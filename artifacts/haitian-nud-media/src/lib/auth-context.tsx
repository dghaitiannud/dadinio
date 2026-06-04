import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppUser = useCallback(async (authUser: User) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      // Create user row if not exists
      const email = authUser.email || '';
      const isAdmin = email.toLowerCase() === 'dghaitiannud@gmail.com';
      const displayName = authUser.user_metadata?.display_name || authUser.user_metadata?.name || email.split('@')[0] || null;
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email,
          displayName,
          plan: 'free',
          isAdmin,
          blocked: false,
          ageConfirmed: false,
          freeDownloadsUsed: 0,
          subscriptionEndsAt: null,
        })
        .select()
        .single();

      if (newUser) {
        setAppUser(newUser as AppUser);
      } else {
        // silently ignore creation error
      }
    } else {
      // Check subscription expiry
      const now = new Date().toISOString();
      if (data.plan === 'vip' && data.subscriptionEndsAt && data.subscriptionEndsAt < now) {
        const { data: updated } = await supabase
          .from('users')
          .update({ plan: 'free' })
          .eq('id', authUser.id)
          .select()
          .single();
        if (updated) {
          setAppUser(updated as AppUser);
          return;
        }
      }
      setAppUser(data as AppUser);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchAppUser(s.user);
      }
      setIsLoading(false);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (user) {
      await fetchAppUser(user);
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}
