import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('AuthCallback: Starting handleCallback...');
      console.log('AuthCallback: Current URL:', window.location.href);

      // Check for code or error in URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        console.error('AuthCallback: Error in URL:', error, errorDescription);
        setError(errorDescription || error);
        toast.error('Authentication failed');
        navigate('/');
        return;
      }

      if (code) {
        console.log('AuthCallback: Auth code found in URL, waiting for session exchange...');
      } else {
        console.log('AuthCallback: No auth code found in URL.');
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('AuthCallback: Auth state change:', event);
        if (event === 'SIGNED_IN' && session) {
          try {
            console.log('AuthCallback: Session established, processing...');
            await processSession(session);
          } catch (err: any) {
            console.error('AuthCallback: Error processing session in listener:', err);
            setError(err.message || 'Failed to process session');
            toast.error('Authentication failed during session processing');
          }
        }
      });

      // Also check current session immediately
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        console.log('AuthCallback: getSession result:', { hasSession: !!data.session, authError });

        if (authError) {
          console.error('Auth callback error:', authError);
          setError(authError.message);
          toast.error('Authentication failed');
          navigate('/');
          return;
        }

        if (data?.session) {
          await processSession(data.session);
        } else if (!code) {
          // Only redirect if no code and no session
          console.warn('AuthCallback: No session and no code found, navigating to landing page');
          navigate('/');
        }
        // If code exists but no session yet, we wait for onAuthStateChange
      } catch (err: any) {
        console.error('Callback handling error:', err);
        setError(err.message);
        toast.error('Something went wrong');
        navigate('/');
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    const processSession = async (session: any) => {
      const user = session.user;
      const userType = localStorage.getItem('pendingUserType');
      console.log('AuthCallback: Processing session for user:', user.id);
      console.log('AuthCallback: pendingUserType:', userType);
      localStorage.removeItem('pendingUserType');

      // Helper to run query with timeout
      const runQueryWithTimeout = async (queryPromise: Promise<any>, timeoutMs = 5000) => {
        let timeoutHandle: NodeJS.Timeout;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Database query timed out')), timeoutMs);
        });

        try {
          const result = await Promise.race([queryPromise, timeoutPromise]);
          clearTimeout(timeoutHandle!);
          return result;
        } catch (error) {
          clearTimeout(timeoutHandle!);
          throw error;
        }
      };

      if (user) {
        try {
          if (userType === 'vendor') {
            console.log('AuthCallback: Checking vendor profile...');
            let vendorProfile = null;
            try {
              const { data } = await runQueryWithTimeout(
                supabase
                  .from('vendors')
                  .select('id')
                  .eq('user_id', user.id)
                  .maybeSingle() as unknown as Promise<any>
              );
              vendorProfile = data;
            } catch (e) {
              console.warn('AuthCallback: Profile check timed out or failed, falling back to setup:', e);
            }

            console.log('AuthCallback: Vendor profile:', vendorProfile);

            if (vendorProfile) {
              console.log('AuthCallback: Navigating to vendor dashboard');
              navigate('/vendor/dashboard');
            } else {
              console.log('AuthCallback: Navigating to vendor profile setup');
              navigate('/vendor/profile-setup');
            }
          } else if (userType === 'supplier') {
            console.log('AuthCallback: Checking supplier profile...');
            let supplierProfile = null;
            try {
              const { data } = await runQueryWithTimeout(
                supabase
                  .from('suppliers')
                  .select('id')
                  .eq('user_id', user.id)
                  .maybeSingle() as unknown as Promise<any>
              );
              supplierProfile = data;
            } catch (e) {
              console.warn('AuthCallback: Profile check timed out or failed, falling back to setup:', e);
            }

            console.log('AuthCallback: Supplier profile:', supplierProfile);

            if (supplierProfile) {
              console.log('AuthCallback: Navigating to supplier dashboard');
              navigate('/supplier/dashboard');
            } else {
              console.log('AuthCallback: Navigating to supplier profile setup');
              navigate('/supplier/profile-setup');
            }
          }
          // START: NEW BLOCK FOR DELIVERY PARTNER
          else if (userType === 'delivery') {
            console.log('AuthCallback: Checking delivery profile...');
            let deliveryProfile = null;
            try {
              const { data } = await runQueryWithTimeout(
                supabase
                  .from('delivery_partners') // Check 'delivery_partners' table
                  .select('id')
                  .eq('user_id', user.id)
                  .maybeSingle() as unknown as Promise<any>
              );
              deliveryProfile = data;
            } catch (e) {
              console.warn('AuthCallback: Profile check timed out or failed, falling back to setup:', e);
            }

            console.log('AuthCallback: Delivery profile:', deliveryProfile);

            if (deliveryProfile) {
              console.log('AuthCallback: Navigating to delivery dashboard');
              navigate('/delivery/dashboard'); // Go to delivery dashboard
            } else {
              console.log('AuthCallback: Navigating to delivery profile setup');
              navigate('/delivery/profile-setup'); // Go to delivery setup
            }
          }
          // END: NEW BLOCK
          else {
            console.warn('AuthCallback: Unknown userType or no userType, navigating to landing page');
            navigate('/');
          }
        } catch (err) {
          console.error('AuthCallback: Error during profile check:', err);
          // Fallback to landing page if something critical fails
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
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