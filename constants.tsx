
import React from 'react';
import { Project, ProjectCategory, Badge } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'flora-01',
    title: 'Plants & Trees',
    description: 'Track local plants and forest health. Help us see how nature is changing in your area.',
    category: ProjectCategory.BIODIVERSITY_FLORA,
    icon: '🌿',
    points: 50,
    stats: { totalObservations: 8400, participants: 1200 }
  },
  {
    id: 'fauna-01',
    title: 'Animals & Wildlife',
    description: 'Report animal sightings and bird migrations. Every photo helps protect local species.',
    category: ProjectCategory.BIODIVERSITY_FAUNA,
    icon: '🦊',
    points: 60,
    stats: { totalObservations: 15200, participants: 2100 }
  },
  {
    id: 'air-01',
    title: 'Air Quality',
    description: 'Help monitor the air we breathe. Report visible pollution, dust, or local weather shifts.',
    category: ProjectCategory.AIR_QUALITY,
    icon: '☁️',
    points: 40,
    stats: { totalObservations: 32000, participants: 5400 }
  },
  {
    id: 'water-01',
    title: 'Water Health',
    description: 'Check the health of nearby streams and lakes. Monitor clarity and look for signs of life.',
    category: ProjectCategory.WATER_HEALTH,
    icon: '🌊',
    points: 45,
    stats: { totalObservations: 7100, participants: 900 }
  }
];

export const BADGES: Badge[] = [
  { id: 'b1', name: 'Explorer', description: 'Log your first 5 findings.', icon: '📋' },
  { id: 'b2', name: 'Nature Scout', description: 'Spot a unique species.', icon: '📈' },
  { id: 'b3', name: 'Water Watcher', description: 'Complete 3 water missions.', icon: '🛡️' },
  { id: 'b4', name: 'Eco Hero', description: 'Protect your local park.', icon: '👁️' }
];
