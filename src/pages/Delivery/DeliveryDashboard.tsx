import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Your supabase client
import { useAuth } from '@/contexts/AuthContext'; // Your Auth context
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Truck, MapPin, Package, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar'; // Assuming you have a Navbar
import Footer from '@/components/Footer'; // Assuming you have a Footer
import { Database } from '@/lib/database.types';

// 1. Define the detailed job type we will be fetching
// This is based on your supabaseOrder.ts and VendorProfileSetup.tsx
type DeliveryJob = Database['public']['Tables']['orders']['Row'] & {
  supplier: {
    business_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  } | null;
  vendor: {
    business_name: string;
    owner_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  } | null;
  order_items: Array<{
    quantity: number;
    product: {
      name: string;
      unit: string;
    };
  }>;
};

// 2. Define the query string for our detailed join
const DELIVERY_JOB_QUERY = `
  id,
  created_at,
  status,
  order_number, 
  supplier:suppliers(business_name, phone, address, city, state),
  vendor:vendors(business_name, owner_name, phone, address, city, state),
  order_items(quantity, product:products(name, unit))
`;

const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth(); // Get the currently logged-in delivery partner
  const [pickupJobs, setPickupJobs] = useState<DeliveryJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. Main function to fetch all jobs
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Query 1: Get jobs "To Pick Up"
      const { data: pickupData, error: pickupError } = await supabase
        .from('orders')
        .select(DELIVERY_JOB_QUERY)
        .eq('status', 'ready_for_pickup') // <-- New Status
        .is('delivery_partner_id', null)
        .order('created_at', { ascending: true });

      if (pickupError) throw pickupError;

      // Query 2: Get jobs "Out for Delivery"
      // First get the partner ID
      const { data: partnerData } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let deliveryData: any[] = [];

      if (partnerData) {
        const { data: deliveryOrders, error: deliveryError } = await supabase
          .from('orders')
          .select(DELIVERY_JOB_QUERY)
          .eq('status', 'out_for_delivery') // <-- New Status
          .eq('delivery_partner_id', partnerData.id) // Use correct ID
          .order('created_at', { ascending: true });

        if (deliveryError) throw deliveryError;
        deliveryData = deliveryOrders || [];
      }

      setPickupJobs(pickupData as unknown as DeliveryJob[]);
      setDeliveryJobs(deliveryData as unknown as DeliveryJob[]);

    } catch (error: any) {
      toast.error("Failed to fetch jobs", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 4. useEffect to fetch jobs on load AND listen for REAL-TIME updates
  useEffect(() => {
    if (user) {
      fetchJobs(); // Initial fetch

      // Set up the real-time subscription
      const channel = supabase
        .channel('public:orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            // When ANY order changes, re-fetch all jobs.
            // This is the simplest way to keep the dashboard live.
            console.log('Real-time change detected:', payload);
            toast.info("Job list updated!", { description: "New jobs may be available." });
            fetchJobs();
          }
        )
        .subscribe();

      // Cleanup subscription on component unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchJobs]);

  // 5. Handler to "Mark as Picked Up"
  const handleMarkAsPickedUp = async (orderId: string) => {
    if (!user) return;

    try {
      // First, get the delivery partner ID corresponding to the current user
      const { data: partnerData, error: partnerError } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError) throw new Error("Could not find delivery partner profile");
      if (!partnerData) throw new Error("Delivery partner profile not found");

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'out_for_delivery',
          delivery_partner_id: partnerData.id, // Use the correct ID from the table
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Job accepted!");
      // The real-time listener will auto-refresh the lists
    } catch (error: any) {
      toast.error("Failed to accept job", { description: error.message });
    }
  };

  // 6. Handler to "Mark as Delivered"
  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Delivery Completed!");
      // The real-time listener will auto-refresh the lists
    } catch (error: any) {
      toast.error("Failed to update status", { description: error.message });
    }
  };

  // 7. Helper function to format addresses
  const formatAddress = (
    address: string,
    city: string,
    state: string
  ) => `${address}, ${city}, ${state}`;

  // 8. Helper component for each job card (to keep JSX clean)
  const JobCard: React.FC<{ job: DeliveryJob; isPickup: boolean }> = ({ job, isPickup }) => (
    <Card className="mb-4 overflow-hidden shadow-md">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg">{job.order_items.map(item => item.product.name).join(', ')}</h3>
          <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {job.order_number || `ORD-${job.id.substring(0, 6)}`}
          </span>
        </div>

        {/* Pickup Location */}
        <div className="flex items-start gap-2 text-sm mb-2">
          <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
          <div className="flex-grow">
            <span className="font-semibold text-gray-700">Pickup Location</span>
            {job.supplier ? (
              <>
                <p className="text-gray-600">
                  {job.supplier.business_name}<br />
                  {formatAddress(job.supplier.address, job.supplier.city, job.supplier.state)}
                </p>
                <p className="text-xs text-gray-500">Contact: {job.supplier.phone}</p>
              </>
            ) : (
              <p className="text-gray-500 italic">Unknown Supplier Location</p>
            )}
          </div>
        </div>

        {/* Dropoff Location */}
        <div className="flex items-start gap-2 text-sm mb-2">
          <CheckCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
          <div className="flex-grow">
            <span className="font-semibold text-gray-700">Dropoff Location</span>
            {job.vendor ? (
              <>
                <p className="text-gray-600">
                  {job.vendor.owner_name} ({job.vendor.business_name})<br />
                  {formatAddress(job.vendor.address, job.vendor.city, job.vendor.state)}
                </p>
                <p className="text-xs text-gray-500">Contact: {job.vendor.phone}</p>
              </>
            ) : (
              <p className="text-gray-500 italic">Unknown Vendor Location</p>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-start gap-2 text-sm">
          <Package className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
          <div className="flex-grow">
            <span className="font-semibold text-gray-700">Quantity</span>
            {job.order_items.map((item) => (
              <p key={item.product.name} className="text-gray-600">
                {item.quantity} {item.product.unit || 'units'} - {item.product.name}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Card Action Button */}
      {isPickup ? (
        <Button
          variant="default" // Changed from "delivery" to "default"
          className="w-full rounded-t-none bg-blue-600 hover:bg-blue-700"
          onClick={() => handleMarkAsPickedUp(job.id)}
        >
          <Truck className="w-4 h-4 mr-2" />
          Mark as Picked Up
        </Button>
      ) : (
        <Button
          variant="default" // Changed from "success" to "default"
          className="w-full rounded-t-none bg-green-600 hover:bg-green-700"
          onClick={() => handleMarkAsDelivered(job.id)}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark as Delivered
        </Button>
      )}
    </Card>
  );

  // 9. Main component render
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      {/* Basic header similar to your design */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Market Connect Delivery</h1>
        <div>
          <span className="text-sm font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-full mr-4">
            Delivery Team
          </span>
          <span className="text-sm text-gray-600 mr-4">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Delivery Dashboard</h2>
        <p className="text-lg text-gray-600 mb-6">Manage your delivery orders</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-lg">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Orders to Pick Up</h4>
            <p className="text-4xl font-bold text-purple-600">{loading ? '...' : pickupJobs.length}</p>
          </Card>
          <Card className="p-6 shadow-lg">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Out for Delivery</h4>
            <p className="text-4xl font-bold text-blue-600">{loading ? '...' : deliveryJobs.length}</p>
          </Card>
          <Card className="p-6 shadow-lg">
            <h4 className="text-sm font-medium text-gray-500 uppercase">Total Active</h4>
            <p className="text-4xl font-bold text-green-600">
              {loading ? '...' : pickupJobs.length + deliveryJobs.length}
            </p>
          </Card>
        </div>

        {/* Job Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column 1: Orders to Pick Up */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">Orders to Pick Up</h3>
            {loading && <p>Loading jobs...</p>}
            {!loading && pickupJobs.length === 0 && (
              <p className="text-gray-500">No jobs available for pickup. We'll notify you!</p>
            )}
            {pickupJobs.map((job) => (
              <JobCard key={job.id} job={job} isPickup={true} />
            ))}
          </div>

          {/* Column 2: Out for Delivery */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">Out for Delivery</h3>
            {loading && <p>Loading...</p>}
            {!loading && deliveryJobs.length === 0 && (
              <p className="text-gray-500">You have no active deliveries.</p>
            )}
            {deliveryJobs.map((job) => (
              <JobCard key={job.id} job={job} isPickup={false} />
            ))}
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
};

export default DeliveryDashboard;