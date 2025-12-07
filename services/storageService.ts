
import { supabase } from './supabaseClient';
import { FeedingRecord, BabyProfile, Family, FamilyMember } from '../types';

const STORAGE_KEY_ACTIVE_BABY = 'babylog_active_baby_v1';
const STORAGE_KEY_FAMILY_ID = 'evalog_family_id_v1';

// --- Identity Management ---

const getCurrentUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado");
  return session.user.id;
};

// --- Family Management (NEW) ---

export const getUserFamily = async (): Promise<Family | null> => {
    try {
        const userId = await getCurrentUserId();
        
        // Find membership
        const { data: members, error } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', userId)
            .limit(1);

        if (error || !members || members.length === 0) return null;

        const familyId = members[0].family_id;
        localStorage.setItem(STORAGE_KEY_FAMILY_ID, familyId);

        // Get Family Details
        const { data: family } = await supabase
            .from('families')
            .select('*')
            .eq('id', familyId)
            .single();
            
        return family as Family;
    } catch (e) {
        return null;
    }
};

export const createFamily = async (familyName: string): Promise<Family> => {
    const userId = await getCurrentUserId();
    
    // 1. Create Family
    const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert([{ name: familyName, created_by: userId }])
        .select()
        .single();

    if (familyError) throw familyError;

    // 2. Add creator as Admin member
    const { error: memberError } = await supabase
        .from('family_members')
        .insert([{ 
            family_id: familyData.id, 
            user_id: userId, 
            role: 'admin' 
        }]);

    if (memberError) throw memberError;
    
    localStorage.setItem(STORAGE_KEY_FAMILY_ID, familyData.id);
    return familyData as Family;
};

export const joinFamilyByInvite = async (inviteCode: string): Promise<boolean> => {
    const userId = await getCurrentUserId();
    
    // 1. Validate Invite
    const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('code', inviteCode.toUpperCase())
        .single();

    if (inviteError || !invite) throw new Error("Convite inválido");
    if (invite.used_at) throw new Error("Convite já utilizado");
    if (!invite.family_id) throw new Error("Este convite não está vinculado a uma família");

    // 2. Add to Family Members
    const { error: memberError } = await supabase
        .from('family_members')
        .insert([{
            family_id: invite.family_id,
            user_id: userId,
            role: 'member'
        }]);

    if (memberError) throw memberError;

    // 3. Mark Invite Used
    await supabase
        .from('invites')
        .update({ used_at: new Date().toISOString(), used_by: userId })
        .eq('code', inviteCode);

    localStorage.setItem(STORAGE_KEY_FAMILY_ID, invite.family_id);
    return true;
};

const getCachedFamilyId = (): string | null => {
    return localStorage.getItem(STORAGE_KEY_FAMILY_ID);
}

// --- Records Management (Updated for Family) ---

export const saveRecord = async (record: FeedingRecord): Promise<FeedingRecord[]> => {
  const familyId = getCachedFamilyId();
  if (!familyId) throw new Error("Usuário não pertence a uma família");

  const recordWithFamily = {
    ...record,
    familyId: familyId,
    // ownerId kept for backward compat if needed, but logic relies on familyId now
  };

  const { error } = await supabase
    .from('records')
    .upsert(recordWithFamily);

  if (error) {
    console.error('Error saving record:', error);
    throw error;
  }
  
  return await getRecords();
};

export const getRecords = async (): Promise<FeedingRecord[]> => {
  try {
    const familyId = getCachedFamilyId();
    if (!familyId) return [];
    
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('familyId', familyId)
      .order('startTime', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      ...r,
      startTime: Number(r.startTime),
      endTime: r.endTime ? Number(r.endTime) : undefined,
      durationSeconds: r.durationSeconds ? Number(r.durationSeconds) : undefined,
      volumeMl: r.volumeMl ? Number(r.volumeMl) : undefined,
      createdAt: Number(r.createdAt),
      pauses: r.pauses ? r.pauses.map((p: any) => ({
          startTime: Number(p.startTime),
          endTime: Number(p.endTime)
      })) : undefined
    }));
  } catch (e) {
    return [];
  }
};

export const deleteRecord = async (id: string): Promise<FeedingRecord[]> => {
  const familyId = getCachedFamilyId();
  
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', id)
    .eq('familyId', familyId); // Security: ensure family ownership

  if (error) {
    console.error('Error deleting record:', error);
    throw error;
  }

  return await getRecords();
};

// --- Baby Profiles Management (Updated for Family) ---

export const getBabies = async (): Promise<BabyProfile[]> => {
  try {
    const familyId = getCachedFamilyId();
    if (!familyId) return [];

    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('familyId', familyId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Error fetching babies:', error);
      return [];
    }
    
    return (data || []).map((b: any) => ({
        ...b,
        birthDate: Number(b.birthDate),
        weightKg: b.weightKg ? Number(b.weightKg) : undefined,
        heightCm: b.heightCm ? Number(b.heightCm) : undefined,
        createdAt: Number(b.createdAt)
    }));
  } catch (e) {
    return [];
  }
};

export const saveBaby = async (baby: BabyProfile): Promise<BabyProfile[]> => {
  const familyId = getCachedFamilyId();
  if (!familyId) throw new Error("Família não encontrada");

  const babyWithFamily = {
      ...baby,
      familyId: familyId
  };

  const { error } = await supabase
    .from('babies')
    .upsert(babyWithFamily);

  if (error) {
    console.error('Error saving baby:', error);
    throw error;
  }
  
  const allBabies = await getBabies();
  if (allBabies.length === 1) {
    setActiveBabyId(baby.id);
  }
  
  return allBabies;
};

// --- Local Storage Helpers ---

export const getActiveBabyId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_BABY);
};

export const setActiveBabyId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_ACTIVE_BABY, id);
};

// --- Initialization / Consistency ---

export const ensureDataConsistency = async (): Promise<{ babies: BabyProfile[], records: FeedingRecord[], family: Family | null }> => {
  let family = await getUserFamily();
  
  // If no family, we cannot load data yet. The UI should show Onboarding.
  if (!family) {
      return { babies: [], records: [], family: null };
  }

  let babies = await getBabies();
  let records = await getRecords();

  // If family exists but no babies, create default
  if (babies.length === 0) {
    const defaultBaby: BabyProfile = {
      id: crypto.randomUUID(),
      name: 'Bebê da Família',
      birthDate: Date.now() - (4 * 30 * 24 * 60 * 60 * 1000),
      gender: 'girl',
      themeColor: 'rose',
      createdAt: Date.now(),
      familyId: family.id
    };
    
    const { error } = await supabase.from('babies').insert(defaultBaby);
    if (!error) {
       babies = [defaultBaby];
       setActiveBabyId(defaultBaby.id);
    }
  }

  // Ensure active ID
  const activeId = getActiveBabyId();
  if (!activeId || !babies.find(b => b.id === activeId)) {
      if (babies.length > 0) {
        setActiveBabyId(babies[0].id);
      }
  }

  return { babies, records, family };
};

export const isDemoMode = () => false;
export const setDemoMode = (v: boolean) => {};
