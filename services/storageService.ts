import { supabase } from './supabaseClient';
import { FeedingRecord, BabyProfile } from '../types';

const STORAGE_KEY_ACTIVE_BABY = 'babylog_active_baby_v1';

// --- Identity Management ---

/**
 * Gets the current authenticated user ID.
 * Throws error if no user is logged in.
 */
const getCurrentUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }
  
  return session.user.id;
};

// --- Records Management ---

export const saveRecord = async (record: FeedingRecord): Promise<FeedingRecord[]> => {
  const ownerId = await getCurrentUserId();
  
  const recordWithOwner = {
    ...record,
    ownerId: ownerId
  };

  const { error } = await supabase
    .from('records')
    .upsert(recordWithOwner);

  if (error) {
    console.error('Error saving record:', error);
    throw error;
  }
  
  return await getRecords();
};

export const getRecords = async (): Promise<FeedingRecord[]> => {
  try {
    const ownerId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('ownerId', ownerId)
      .order('startTime', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      return [];
    }

    // Ensure numeric types for timestamps (safety against BigInt serialization)
    return (data || []).map((r: any) => ({
      ...r,
      startTime: Number(r.startTime),
      endTime: r.endTime ? Number(r.endTime) : undefined,
      durationSeconds: r.durationSeconds ? Number(r.durationSeconds) : undefined,
      volumeMl: r.volumeMl ? Number(r.volumeMl) : undefined,
      createdAt: Number(r.createdAt),
      // Map pauses timestamps if they exist
      pauses: r.pauses ? r.pauses.map((p: any) => ({
          startTime: Number(p.startTime),
          endTime: Number(p.endTime)
      })) : undefined
    }));
  } catch (e) {
    console.log("Skipping fetch, no user", e);
    return [];
  }
};

export const deleteRecord = async (id: string): Promise<FeedingRecord[]> => {
  const ownerId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id)
    .eq('ownerId', ownerId); // Security: ensure ownership

  if (error) {
    console.error('Error deleting record:', error);
    throw error;
  }

  return await getRecords();
};

// --- Baby Profiles Management ---

export const getBabies = async (): Promise<BabyProfile[]> => {
  try {
    const ownerId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('ownerId', ownerId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Error fetching babies:', error);
      return [];
    }
    
    // Ensure numeric types
    return (data || []).map((b: any) => ({
        ...b,
        birthDate: Number(b.birthDate),
        weightKg: b.weightKg ? Number(b.weightKg) : undefined,
        heightCm: b.heightCm ? Number(b.heightCm) : undefined,
        createdAt: Number(b.createdAt)
    }));
  } catch (e) {
    console.log("Skipping fetch, no user", e);
    return [];
  }
};

export const saveBaby = async (baby: BabyProfile): Promise<BabyProfile[]> => {
  const ownerId = await getCurrentUserId();

  const babyWithOwner = {
      ...baby,
      ownerId: ownerId
  };

  const { error } = await supabase
    .from('babies')
    .upsert(babyWithOwner);

  if (error) {
    console.error('Error saving baby:', error);
    throw error;
  }
  
  // If this is the only baby, set as active locally for fast access
  const allBabies = await getBabies();
  if (allBabies.length === 1) {
    setActiveBabyId(baby.id);
  }
  
  return allBabies;
};

// --- Local Storage Helpers for UI State (Non-critical data) ---

export const getActiveBabyId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_BABY);
};

export const setActiveBabyId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_ACTIVE_BABY, id);
};

// --- Initialization / Consistency ---

export const ensureDataConsistency = async (): Promise<{ babies: BabyProfile[], records: FeedingRecord[] }> => {
  // Check auth first
  try {
      await getCurrentUserId();
  } catch {
      return { babies: [], records: [] };
  }

  let babies = await getBabies();
  let records = await getRecords();

  // 1. If no babies exist in DB (for this authenticated owner), create a default one
  if (babies.length === 0) {
    const ownerId = await getCurrentUserId();
    const defaultBaby: BabyProfile = {
      id: crypto.randomUUID(),
      name: 'Meu Bebê',
      birthDate: Date.now() - (4 * 30 * 24 * 60 * 60 * 1000), // Approx 4 months ago
      gender: 'girl',
      themeColor: 'rose',
      createdAt: Date.now(),
      ownerId: ownerId
    };
    
    // Attempt to save default baby. We don't catch error here to let the UI handle empty state if needed.
    const { error } = await supabase.from('babies').insert(defaultBaby);
    if (!error) {
       babies = [defaultBaby];
       setActiveBabyId(defaultBaby.id);
    }
  }

  // 2. Ensure we have an active ID
  const activeId = getActiveBabyId();
  if (!activeId || !babies.find(b => b.id === activeId)) {
      if (babies.length > 0) {
        setActiveBabyId(babies[0].id);
      }
  }

  return { babies, records };
};

// Stub for backward compatibility if needed, but returns false
export const isDemoMode = () => false;
export const setDemoMode = (v: boolean) => {};