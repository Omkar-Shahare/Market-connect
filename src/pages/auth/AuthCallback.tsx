import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for session immediately
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
        setError(error.message);
        return;
      }
      if (session) {
        handleUserNavigation(session.user.id);
      }
    };

    // Also listen for auth state changes (important for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleUserNavigation(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        navigate('/');
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleUserNavigation = async (userId: string) => {
    try {
      const userType = localStorage.getItem('pendingUserType');
      localStorage.removeItem('pendingUserType');

      // Helper to check profile existence
      const checkProfile = async (table: string) => {
        const { data } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        return !!data;
      };

      if (userType === 'vendor') {
        const exists = await checkProfile('vendors');
        navigate(exists ? '/vendor/dashboard' : '/vendor/profile-setup');
      } else if (userType === 'supplier') {
        const exists = await checkProfile('suppliers');
        navigate(exists ? '/supplier/dashboard' : '/supplier/profile-setup');
      } else if (userType === 'delivery') {
        const exists = await checkProfile('delivery_partners');
        navigate(exists ? '/delivery/dashboard' : '/delivery/profile-setup');
      } else {
        // If no pending user type, check all tables to find where the user belongs
        const [isVendor, isSupplier, isDelivery] = await Promise.all([
          checkProfile('vendors'),
          checkProfile('suppliers'),
          checkProfile('delivery_partners')
        ]);

        if (isVendor) navigate('/vendor/dashboard');
        else if (isSupplier) navigate('/supplier/dashboard');
        else if (isDelivery) navigate('/delivery/dashboard');
        else {
          // If user exists but has no profile and no pending type, default to landing or a generic setup choice
          // For now, redirect to landing with a message or let them choose login again
          toast.error("Profile not found. Please login again.");
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Navigation error:', err);
      setError(err.message);
      toast.error('Failed to navigate');
      navigate('/');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;