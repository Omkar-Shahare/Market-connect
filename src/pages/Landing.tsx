import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp, Truck } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 relative">
      <Navbar />

      {/* Background Image with More Visibility - Below Navbar */}
      <div 
        className="absolute left-0 right-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage: `url('/background.png')`,
          top: '80px', // Start below navbar
          height: '85vh'
        }}
      />
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-800 drop-shadow-lg">
            Bridge the Gap Between
            <span className="text-blue-900"> Local Vendors</span>
            , <span className="text-green-900">Suppliers</span>
            <br />
            and <span className="text-orange-900">Delivery Partners</span>
          </h1>
          <p className="text-xl text-gray-700 drop-shadow-md mb-8 max-w-2xl mx-auto font-medium">
            Connect local vendors with reliable suppliers and efficient delivery partners through our innovative platform.
            Join group orders, save costs, and grow your business together.
          </p>
          
          {/* Role Selection Cards - Updated to grid-cols-3 */}
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto">
            {/* Vendor Card */}
            <Card className="group hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-vendor/50" 
                  onClick={() => navigate('/vendor/signup')}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-vendor rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-8 h-8 text-white" />
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
            <Card className="group hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-supplier/50" 
                  onClick={() => navigate('/supplier/login')}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-supplier rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-8 h-8 text-white" />
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
            <Card className="group hover:shadow-glow transition-all duration-300 cursor-pointer border-2 hover:border-delivery/50" 
                  onClick={() => navigate('/delivery/login')}>
              <CardHeader className="text-center pb-4">
                
                {/* --- THIS IS THE UPDATED PART --- */}
                <img 
                  src="/delivery.png" 
                  alt="Delivery Partner" 
                  className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" 
                />
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
      <div className="bg-gray-50 py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Platform Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover the comprehensive suite of tools and services designed to revolutionize 
              the way vendors, suppliers, and delivery partners collaborate.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Collaborative Group Ordering</h3>
              <p className="text-gray-600 leading-relaxed">
                Enable multiple vendors to combine their purchasing power, achieving better wholesale prices 
                and reducing individual order minimums through our intelligent group ordering system.
              </p>
            </div>
            
            <div className="text-center bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Verified Supply Chain Network</h3>
              <p className="text-gray-600 leading-relaxed">
                Access our curated network of verified suppliers, ensuring product quality, reliability, 
                and consistent availability for your business operations.
              </p>
            </div>
            
            <div className="text-center bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
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
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Real-time Inventory Management</h4>
              <p className="text-gray-600">
                Track inventory levels, manage stock alerts, and synchronize with suppliers for seamless 
                supply chain visibility and planning.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Secure Payment Processing</h4>
              <p className="text-gray-600">
                Process transactions securely with our integrated payment system, supporting multiple 
                payment methods and providing detailed financial reporting.
              </p> {/* <-- THIS IS THE FIX. Was </a */}
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Real-Time Order Tracking</h4>
              <p className="text-gray-600">
                Monitor the status of your orders from placement to delivery, with live updates
                from our delivery partners for complete transparency.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;