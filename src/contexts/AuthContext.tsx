import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileCompleted: boolean;
  setProfileCompleted: (completed: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompletedState] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const completed = localStorage.getItem(`profileCompleted_${session.user.id}`) === 'true';
        setProfileCompletedState(completed);
      } else {
        setProfileCompletedState(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const completed = localStorage.getItem(`profileCompleted_${session.user.id}`) === 'true';
          setProfileCompletedState(completed);
        } else {
          setProfileCompletedState(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const setProfileCompleted = (completed: boolean) => {
    if (user) {
      localStorage.setItem(`profileCompleted_${user.id}`, completed ? 'true' : 'false');
    }
    setProfileCompletedState(completed);
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout process...');
      await supabase.auth.signOut();
      console.log('AuthContext: Supabase signOut successful');
      if (user) {
        localStorage.removeItem(`profileCompleted_${user.id}`);
        console.log('AuthContext: Cleared profile completion status');
      }
      console.log('AuthContext: Logout process completed');
    } catch (error) {
      console.error('AuthContext: Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    profileCompleted,
    setProfileCompleted,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 