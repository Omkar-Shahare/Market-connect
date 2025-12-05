import React, { useState } from "react";
import { authService } from "../../services/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft } from "lucide-react"; // Changed icon
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DeliveryAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { profileCompleted } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await authService.signIn({ email, password });
        navigate("/delivery/dashboard"); // Navigate to delivery dashboard
      } else {
        await authService.signUp({
          email,
          password,
          metadata: { userType: 'delivery' } // Set userType to 'delivery'
        });
        navigate("/delivery/profile-setup"); // Navigate to delivery profile setup
      }
      // CORRECTED LINE: Removed the extra ' ' before the {
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('DeliveryAuth: Initiating Google Sign-In...');
    try {
      setError("");
      await authService.signInWithGoogle({ userType: 'delivery' }); // Set userType
      console.log('DeliveryAuth: Google Sign-In initiated.');
    } catch (err: any) {
      console.error('DeliveryAuth: Google Sign-In failed', err);
      setError(err.message);
      toast.error("Failed to sign in with Google");
    }
  };

  return (
    <>
      <Navbar />
      {/* Using an orange/yellow gradient for delivery partners */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 pt-20">
        {/* Back Button - Below Navbar */}
        <div className="container mx-auto px-4 pt-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 p-2 bg-white/80 hover:bg-white rounded-lg shadow-md transition-all duration-200 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>

        <div className="flex items-center justify-center px-4">
          {/* Using 'border-delivery/30' - ensure this is in your config */}
          <Card className="w-full max-w-md shadow-xl border-2 border-delivery/30">
            <CardHeader className="flex flex-col items-center pb-2">
              {/* Using 'bg-gradient-delivery' - ensure this is in your config */}
              <div className="w-16 h-16 bg-gradient-delivery rounded-full flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">{isLogin ? "Delivery Partner Login" : "Delivery Partner Signup"}</CardTitle>
              <CardDescription>
                {isLogin ? "Access your delivery dashboard" : "Create your delivery partner account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                {/* Using 'variant="delivery"' - ensure this is in your config */}
                <Button type="submit" variant="delivery" className="w-full">
                  {isLogin ? "Login" : "Sign Up"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  /* Using 'text-delivery' - ensure this is in your config */
                  className="text-delivery underline text-sm hover:text-delivery/80"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DeliveryAuth;