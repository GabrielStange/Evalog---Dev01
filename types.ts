
export type FeedingType = 'breast_left' | 'breast_right' | 'bottle';

export type ThemeColor = 'rose' | 'blue' | 'emerald' | 'violet' | 'amber' | 'red';

export interface BabyProfile {
  id: string;
  ownerId?: string; // Links data to a specific device/browser
  name: string;
  birthDate: number; // timestamp
  gender: 'boy' | 'girl';
  themeColor: ThemeColor;
  weightKg?: number;
  heightCm?: number;
  photoUrl?: string; // Placeholder for future
  createdAt: number;
}

export interface PauseInterval {
  startTime: number;
  endTime: number;
}

export interface FeedingRecord {
  id: string;
  ownerId?: string; // Links data to a specific device/browser
  babyId: string; // Linked to BabyProfile
  type: FeedingType;
  startTime: number; // timestamp
  endTime?: number; // timestamp
  pauses?: PauseInterval[];
  durationSeconds?: number;
  volumeMl?: number;
  notes?: string;
  createdAt: number;
}

export interface InviteCode {
    code: string;
    created_at: string;
    used_at: string | null;
    used_by: string | null;
}

export enum AppTab {
  TRACKER = 'tracker',
  HISTORY = 'history',
  STATS = 'stats',
  AI = 'ai'
}