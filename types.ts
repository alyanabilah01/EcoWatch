
export enum ProjectCategory {
  BIODIVERSITY_FLORA = 'Flora Monitoring',
  BIODIVERSITY_FAUNA = 'Fauna Biodiversity',
  AIR_QUALITY = 'Atmospheric Dynamics',
  WATER_HEALTH = 'Aquatic Systems',
  WEATHER = 'Climate Patterns'
}

export interface ScientistFeedback {
  scientistName: string;
  institution: string;
  comment: string;
  date: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  icon: string;
  points: number;
  stats: {
    totalObservations: number;
    participants: number;
  };
}

export interface Observation {
  id: string;
  projectId: string;
  timestamp: number;
  location?: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  analysis?: string;
  feedback?: ScientistFeedback;
  data: {
    metrics?: {
      aqi?: number;
      ph?: number;
      turbidity?: string;
      temp?: number;
      humidity?: number;
      canopyDensity?: string;
      speciesCount?: number;
    };
    notes?: string;
  };
  userId: string;
  isValidated: boolean;
}

export interface UserProfile {
  name: string;
  level: number;
  points: number;
  contributions: number;
  badges: Badge[];
  expertise: Record<string, number>;
  learnedInterests: string[];
  lastAiPersonalization?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  imageUrl?: string;
  isPeerReview?: boolean;
}
