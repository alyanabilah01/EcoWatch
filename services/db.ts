
import { Dexie, type Table } from 'dexie';
import { UserProfile, Observation, ChatMessage, ProjectCategory } from '../types';

const db = new Dexie('EcoWatchDB') as Dexie & {
  users: Table<UserProfile & { id: string }>;
  observations: Table<Observation>;
  chat: Table<ChatMessage>;
  predictions: Table<{ category: string; data: any; timestamp: number }>;
};

db.version(3).stores({
  users: 'id, name',
  observations: 'id, projectId, timestamp, userId',
  chat: 'id, timestamp, sender',
  predictions: 'category, timestamp'
});

export { db };

export const getOrCreateLocalUser = async (): Promise<UserProfile & { id: string }> => {
  const userId = 'local_user';
  const existing = await db.users.get(userId);
  
  if (existing) {
    return existing;
  }

  const newUser: UserProfile & { id: string } = {
    id: userId,
    name: 'Lead Investigator',
    level: 1,
    points: 0,
    contributions: 0,
    badges: [],
    expertise: {
      // Fix: ProjectCategory.BIODIVERSITY changed to ProjectCategory.BIODIVERSITY_FLORA
      [ProjectCategory.BIODIVERSITY_FLORA]: 0,
      [ProjectCategory.AIR_QUALITY]: 0,
      [ProjectCategory.WATER_HEALTH]: 0,
      [ProjectCategory.WEATHER]: 0,
    },
    learnedInterests: []
  };

  await db.users.add(newUser);
  return newUser;
};

export const saveObservation = async (observation: Observation, category: string) => {
  await db.observations.add(observation);

  const userId = 'local_user';
  const user = await db.users.get(userId);
  if (user) {
    const updatedExpertise = { ...user.expertise };
    updatedExpertise[category] = (updatedExpertise[category] || 0) + 10;

    const updatedStats = {
      points: user.points + 50,
      contributions: user.contributions + 1,
      level: Math.floor((user.points + 50) / 500) + 1,
      expertise: updatedExpertise
    };
    await db.users.update(userId, updatedStats);
  }
};

export const cachePrediction = async (category: string, data: any) => {
  await db.predictions.put({
    category,
    data,
    timestamp: Date.now()
  });
};

export const getCachedPredictions = async () => {
  const all = await db.predictions.toArray();
  const map: Record<string, any> = {};
  all.forEach(p => {
    map[p.category] = p.data;
  });
  return map;
};

export const updateUserAiPersonalization = async (summary: string, interests: string[]) => {
  const userId = 'local_user';
  await db.users.update(userId, {
    lastAiPersonalization: summary,
    learnedInterests: interests
  });
};

export const saveChatMessage = async (message: ChatMessage) => {
  await db.chat.add(message);
};

export const clearAllLocalData = async () => {
  await db.users.clear();
  await db.observations.clear();
  await db.chat.clear();
  await db.predictions.clear();
};
