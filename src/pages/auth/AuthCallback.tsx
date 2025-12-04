import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          console.error('Auth callback error:', authError);
          setError(authError.message);
          toast.error('Authentication failed');
          navigate('/');
          return;
        }

        if (data?.session) {
          const userType = localStorage.getItem('pendingUserType');
          localStorage.removeItem('pendingUserType');

          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            if (userType === 'vendor') {
              const { data: vendorProfile } = await supabase
                .from('vendors')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (vendorProfile) {
                navigate('/vendor/dashboard');
              } else {
                navigate('/vendor/profile-setup');
              }
            } else if (userType === 'supplier') {
              const { data: supplierProfile } = await supabase
                .from('suppliers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (supplierProfile) {
                navigate('/supplier/dashboard');
              } else {
                navigate('/supplier/profile-setup');
              }
            }
            // START: NEW BLOCK FOR DELIVERY PARTNER
            else if (userType === 'delivery') {
              const { data: deliveryProfile } = await supabase
                .from('delivery_partners') // Check 'delivery_partners' table
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

              if (deliveryProfile) {
                navigate('/delivery/dashboard'); // Go to delivery dashboard
              } else {
                navigate('/delivery/profile-setup'); // Go to delivery setup
              }
            }
            // END: NEW BLOCK
            else {
              navigate('/');
            }
          }
        } else {
          navigate('/');
        }
      } catch (err: any) {
        console.error('Callback handling error:', err);
        setError(err.message);
        toast.error('Something went wrong');
        navigate('/');
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