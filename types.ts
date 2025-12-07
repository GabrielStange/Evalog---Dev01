
export type FeedingType = 'breast_left' | 'breast_right' | 'bottle';

export type ThemeColor = 'rose' | 'blue' | 'emerald' | 'violet' | 'amber' | 'red';

export interface Family {
    id: string;
    name: string;
    created_at: number;
    created_by: string;
}

export interface FamilyMember {
    family_id: string;
    user_id: string;
    role: 'admin' | 'member';
}

export interface BabyProfile {
  id: string;
  ownerId?: string; // Legacy: kept for migration, but logic moves to familyId
  familyId?: string; // New: Links baby to a family group
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
  ownerId?: string; 
  familyId?: string; // New: Links record to a family group
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
    family_id?: string | null; // Null means it's a generic invite (create new family), Value means join specific family
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
