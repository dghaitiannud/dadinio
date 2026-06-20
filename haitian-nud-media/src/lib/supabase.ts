import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lcfnjxqademkrcocvtlo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZm5qeHFhZGVta3Jjb2N2dGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc1NDgsImV4cCI6MjA5NzI1MzU0OH0.Nfa_2wP8RVfV3MnFYWY17PuBnz98yyDsBiXdbxRKvxY';

// 🔐 SECURITY FIX #3: Validate env vars at initialization
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
    `Please set these in your Vercel Dashboard → Settings → Environment Variables`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export const ADMIN_EMAIL = 'dghaitiannud@gmail.com';
export const LIVE_ADMIN_EMAIL = 'liveadmin@gmail.com'; // 🚀 L'email autorisé à lancer le live

