import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!loading && user) {
        console.log("Landing: User is authenticated, checking role...");
        // 1. Check metadata first (fastest)
        const userType = user.user_metadata?.userType;
        if (userType === 'vendor') {
          navigate('/vendor/dashboard');
          return;
        }
        if (userType === 'supplier') {
          navigate('/supplier/dashboard');
          return;
        }
        if (userType === 'delivery') {
          navigate('/delivery/dashboard');
          return;
        }

        // 2. If metadata missing, check tables
        // Check Vendor
        const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle();
        if (vendor) {
          navigate('/vendor/dashboard');
          return;
        }

        // Check Supplier
        const { data: supplier } = await supabase.from('suppliers').select('id').eq('user_id', user.id).maybeSingle();
        if (supplier) {
          navigate('/supplier/dashboard');
          return;
        }

        // Check Delivery
        const { data: delivery } = await supabase.from('delivery_partners').select('id').eq('user_id', user.id).maybeSingle();
        if (delivery) {
          navigate('/delivery/dashboard');
          return;
        }
      }
    };

    checkUserAndRedirect();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 relative">
      <Navbar />

      {/* Background Image with More Visibility - Below Navbar */}
      {/* Background Image with More Visibility - Below Navbar */}
      <div
        className="absolute left-0 right-0 bg-cover bg-center bg-no-repeat opacity-60 z-0"
        style={{
          backgroundImage: `url('/landing-bg-modern.png')`,
          top: '0',
          height: '100vh',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/80 z-0 pointer-events-none" style={{ top: '80px' }} />
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight text-gray-900 drop-shadow-xl tracking-tight">
            Bridge the Gap Between
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-vendor px-2"> Local Vendors</span>
            , <span className="text-transparent bg-clip-text bg-gradient-supplier px-2">Suppliers</span>
            <br />
            and <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 px-2">Delivery Partners</span>
          </h1>
          <p className="text-2xl text-gray-600 drop-shadow-sm mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Connect local vendors with reliable suppliers and efficient delivery partners through our innovative platform.
            Join group orders, save costs, and grow your business together.
          </p>

          {/* Role Selection Cards - Updated to grid-cols-3 */}
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
            {/* Vendor Card */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-white/40 bg-white/80 backdrop-blur-md relative overflow-hidden"
              onClick={() => navigate('/vendor/signup')}>
              <div className="absolute inset-0 bg-gradient-vendor opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-vendor rounded-2xl shadow-lg shadow-vendor/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <ShoppingCart className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Vendor</CardTitle>
                <CardDescription className="text-base">
                  Join group orders, save costs, and access reliable suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="vendor" className="w-full" size="lg">
                  Get Started as Vendor
                </Button>
              </CardContent>
            </Card>

            {/* Supplier Card */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-white/40 bg-white/80 backdrop-blur-md relative overflow-hidden"
              onClick={() => navigate('/supplier/login')}>
              <div className="absolute inset-0 bg-gradient-supplier opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-supplier rounded-2xl shadow-lg shadow-supplier/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Package className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">I'm a Supplier</CardTitle>
                <CardDescription className="text-base">
                  Fulfill bulk orders, manage inventory, and grow your network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="supplier" className="w-full" size="lg">
                  Get Started as Supplier
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Partner Card */}
            <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer border border-white/40 bg-white/80 backdrop-blur-md relative overflow-hidden"
              onClick={() => navigate('/delivery/login')}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="text-center pb-4">

                {/* --- THIS IS THE UPDATED PART --- */}
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <img
                    src="/delivery.png"
                    alt="Delivery Partner"
                    className="w-12 h-12 brightness-0 invert"
                  />
                </div>
                {/* --- END OF UPDATE --- */}

                <CardTitle className="text-2xl">I'm a Delivery Partner</CardTitle>
                <CardDescription className="text-base">
                  Manage deliveries, earn income, and connect with local businesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="delivery" className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-semibold transition-all duration-300" size="lg">
                  Get Started as Delivery Partner
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Features Section - Formal Presentation */}
      <div className="bg-gradient-to-b from-white to-blue-50 py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Platform Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the comprehensive suite of tools and services designed to revolutionize
              the way vendors, suppliers, and delivery partners collaborate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Collaborative Group Ordering</h3>
              <p className="text-gray-600 leading-relaxed">
                Enable multiple vendors to combine their purchasing power, achieving better wholesale prices
                and reducing individual order minimums through our intelligent group ordering system.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Verified Supply Chain Network</h3>
              <p className="text-gray-600 leading-relaxed">
                Access our curated network of verified suppliers, ensuring product quality, reliability,
                and consistent availability for your business operations.
              </p>
            </div>

            <div className="text-center bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Optimized Delivery Logistics</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline your order fulfillment with our integrated delivery partner network,
                ensuring timely and efficient transportation from supplier to vendor.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12 mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Real-time Inventory Management</h4>
              <p className="text-gray-600">
                Track inventory levels, manage stock alerts, and synchronize with suppliers for seamless
                supply chain visibility and planning.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Secure Payment Processing</h4>
              <p className="text-gray-600">
                Process transactions securely with our integrated payment system, supporting multiple
                payment methods and providing detailed financial reporting.
              </p> {/* <-- THIS IS THE FIX. Was </a */}
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Real-Time Order Tracking</h4>
              <p className="text-gray-600">
                Monitor the status of your orders from placement to delivery, with live updates
                from our delivery partners for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Landing;