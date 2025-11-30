import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseKey = '';

// Attempt to load from Vite environment variables
try {
  // @ts-ignore
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  // Ignore
}

// Fallback to process.env
if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
  try {
    // @ts-ignore
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {}
}

// Check if configuration is present and valid
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co';

if (!isSupabaseConfigured) {
    // Fallback placeholder to prevent runtime crash during initialization, 
    // but the App component should block access if isSupabaseConfigured is false.
    if (!supabaseUrl) supabaseUrl = 'https://placeholder.supabase.co';
    if (!supabaseKey) supabaseKey = 'placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseKey);