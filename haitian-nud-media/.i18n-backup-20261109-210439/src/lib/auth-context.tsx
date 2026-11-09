import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['dghaitiannud@gmail.com'];

export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  plan: 'free' | 'vip';
  isAdmin: boolean;
  blocked: boolean;
  ageConfirmed: boolean;
  freeDownloadsUsed: number;
  subscriptionEndsAt: string | null;
  createdAt: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

// Map raw Supabase row (snake_case) → AppUser (camelCase)
function mapUser(data: any, emailOverride?: string): AppUser {
  const email = data.email || emailOverride || '';
  const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase());
  return {
    id: data.id,
    email,
    displayName: data.display_name || null,
    plan: data.plan || 'free',
    isAdmin: data.is_admin === true || isAdminByEmail,
    blocked: data.blocked === true,
    ageConfirmed: data.age_confirmed === true,
    freeDownloadsUsed: data.free_downloads_used || 0,
    subscriptionEndsAt: data.subscription_ends_at || null,
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppUser = useCallback(async (authUser: User) => {
    try {
      const email = authUser.email || '';
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        // Row doesn't exist yet → create it (snake_case columns)
        const displayName = authUser.user_metadata?.display_name
          || authUser.user_metadata?.name
          || email.split('@')[0]
          || null;

        const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase());

        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email,
            display_name: displayName,
            plan: 'free',
            is_admin: isAdminByEmail,
            blocked: false,
            age_confirmed: false,
            free_downloads_used: 0,
            subscription_ends_at: null,
          })
          .select()
          .single();

        if (newUser) {
          setAppUser(mapUser(newUser, email));
        } else {
          console.error('Failed to create user row:', createError);
          // Even if DB fails, let the user in with email-based admin check
          setAppUser({
            id: authUser.id,
            email,
            displayName: email.split('@')[0],
            plan: 'free',
            isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
            blocked: false,
            ageConfirmed: false,
            freeDownloadsUsed: 0,
            subscriptionEndsAt: null,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // Check subscription expiry
        const now = new Date().toISOString();
        if (data.plan === 'vip' && data.subscription_ends_at && data.subscription_ends_at < now) {
          const { data: updated } = await supabase
            .from('users')
            .update({ plan: 'free' })
            .eq('id', authUser.id)
            .select()
            .single();
          if (updated) {
            setAppUser(mapUser(updated, email));
            return;
          }
        }
        // Also force is_admin=true in DB for ADMIN_EMAILS if not already set
        const isAdminByEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        if (isAdminByEmail && !data.is_admin) {
          await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', authUser.id);
          data.is_admin = true;
        }
        setAppUser(mapUser(data, email));
      }
    } catch (err) {
      console.error('Failed to fetch app user:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchAppUser(s.user);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchAppUser(s.user);
      } else {
        setAppUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchAppUser]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // ⚠️  IMPORTANT: Désactiver "Confirm email" dans Supabase
          //    Authentication > Providers > Email > Confirm email = OFF
          //    Sinon l'utilisateur ne peut pas se connecter immédiatement
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAppUser(null);
      setSession(null);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await fetchAppUser(user);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const isAdmin = appUser?.isAdmin ?? false;
  const isSignedIn = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      appUser,
      session,
      isLoading,
      isAdmin,
      isSignedIn,
      signIn,
      signUp,
      signOut,
      refreshUser,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
