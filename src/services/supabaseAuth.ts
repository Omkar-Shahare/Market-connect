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
  userType?: 'vendor' | 'supplier' | 'delivery';
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
    console.log('Starting Google Sign-In...');
    console.log('User Type:', userType);
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('Redirect URL:', redirectUrl);

    // Set pendingUserType in localStorage BEFORE starting the OAuth flow
    // This ensures it's available when the user is redirected back
    if (userType) {
      console.log('Setting pendingUserType in localStorage:', userType);
      localStorage.setItem('pendingUserType', userType);
    }

    try {
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

      if (error) {
        console.error('Supabase Google Sign-In Error:', error);
        throw error;
      }

      console.log('Google Sign-In initiated successfully:', data);
      return data;
    } catch (err) {
      console.error('Unexpected error during Google Sign-In:', err);
      // Clean up if it fails immediately (though if it redirected, we wouldn't reach here)
      localStorage.removeItem('pendingUserType');
      throw err;
    }
  },
};
