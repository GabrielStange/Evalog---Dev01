import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseKey = '';

// Attempt to load from Vite environment variables
// We use try/catch because accessing import.meta.env might fail in some runtime environments if not replaced by build.
try {
  // @ts-ignore
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
} catch (error) {
  // Ignore reference errors if import.meta.env is not defined
}

// Fallback to process.env
if (!supabaseUrl && typeof process !== 'undefined' && process.env) {
  try {
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  } catch (e) {}
}

// Prevent app crash if URL is missing
const isMissingConfig = !supabaseUrl;
if (isMissingConfig) {
    console.warn("Supabase URL is missing. Initializing with placeholder.");
    supabaseUrl = 'https://placeholder.supabase.co';
}
if (!supabaseKey) {
    supabaseKey = 'placeholder-key';
}

export const supabase = createClient(supabaseUrl, supabaseKey);