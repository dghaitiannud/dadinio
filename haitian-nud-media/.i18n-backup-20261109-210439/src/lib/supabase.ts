import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.haitiannud.com';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2MDU5MzY0LCJleHAiOjE4OTM0NTYwMDB9.Feug29ZONRW1yTZHFoIxaSCopPPwdzgtb49QRWolKhw';

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
    `Please set these in your environment variables`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export const ADMIN_EMAIL = 'dghaitiannud@gmail.com';
export const LIVE_ADMIN_EMAIL = 'liveadmin@gmail.com';
