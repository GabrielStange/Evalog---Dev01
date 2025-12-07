import { createClient } from '@supabase/supabase-js';

// Valores hardcoded para teste imediato (fallback se o .env não existir)
const TEST_URL = 'https://socywemllqwpsqczsvsh.supabase.co';
const TEST_KEY = 'sb_publishable_xcKvto9zqp4ADNEWKFuN2A_i8mQpPfc';

let supabaseUrl = TEST_URL;
let supabaseKey = TEST_KEY;

// Tentativa de ler variáveis de ambiente (prioridade sobre os valores de teste se existirem)
try {
  // @ts-ignore
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  // @ts-ignore
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (envUrl) supabaseUrl = envUrl;
  if (envKey) supabaseKey = envKey;
} catch (error) {
  // Ignore
}

// Fallback para process.env se import.meta falhar (ambientes não-Vite)
if (supabaseUrl === TEST_URL && typeof process !== 'undefined' && process.env) {
  try {
    // @ts-ignore
    const processUrl = process.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const processKey = process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    
    if (processUrl) supabaseUrl = processUrl;
    if (processKey) supabaseKey = processKey;
  } catch (e) {}
}

// Verificação de configuração
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co';

if (!isSupabaseConfigured) {
    if (!supabaseUrl) supabaseUrl = 'https://placeholder.supabase.co';
    if (!supabaseKey) supabaseKey = 'placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseKey);