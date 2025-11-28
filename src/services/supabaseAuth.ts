import { supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  metadata?: {
    name?: string;
    userType?: 'vendor' | 'supplier';
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface GoogleSignInOptions {
  userType: 'vendor' | 'supplier';
}

export const authService = {
  signUp: async ({ email, password, metadata }: SignUpData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },

  signIn: async ({ email, password }: SignInData) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  signInWithGoogle: async ({ userType }: GoogleSignInOptions) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'email profile',
      },
    });

    if (error) throw error;

    if (userType) {
      localStorage.setItem('pendingUserType', userType);
    }

    return data;
  },
};
