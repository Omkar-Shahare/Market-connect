import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, Users, TrendingUp, Clock, MapPin, CheckCircle, XCircle, Plus, User, Edit,
  Camera, Mail, Phone, Building, Shield, Star, Calendar, Award, Truck, DollarSign,
  Menu, Settings, HelpCircle, LogOut, Navigation, Target, Search, CreditCard,
  Trash // <-- ADDED
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { productService } from "@/services/supabaseProduct";
import { supplierApi, SupplierProfile } from "@/services/supplierApi";
import { orderService } from "@/services/supabaseOrder";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SupplierDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("group");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    product: "",
    quantity: "",
    actualRate: "",
    finalRate: "",
    discountPercentage: "",
    location: "",
    deadline: "",
    deadlineTime: "",
    latitude: "",
    longitude: "",
    imageUrl: ""
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  // Supplier profile data states
  const [supplierData, setSupplierData] = useState<SupplierProfile | null>(null);
  const [editFormData, setEditFormData] = useState<SupplierProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Location-based functionality states
  const [currentLocation, setCurrentLocation] = useState<any | null>(null); // Added 'any' type for flexibility
  const [locationPermission, setLocationPermission] = useState<any | null>(null); // Added 'any' type
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [autoFillLocation, setAutoFillLocation] = useState(true);
  const [groupSearch, setGroupSearch] = useState("");

  const { toast } = useToast();
  const [groupRequests, setGroupRequests] = useState<any[]>([]);

  // Orders state
  const [individualOrders, setIndividualOrders] = useState<any[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);

  // --- NEW STATE FOR EDITING ---
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  // Calculate discount percentage
  const calculateDiscountPercentage = (actualRate: string, finalRate: string) => {
    const actual = parseFloat(actualRate);
    const final = parseFloat(finalRate);
    if (actual > 0 && final > 0 && final <= actual) {
      const discount = ((actual - final) / actual) * 100;
      return discount.toFixed(1);
    }
    return "";
  };

  // Auto-detect location on component mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Fetch supplier profile data
  useEffect(() => {
    const fetchSupplierProfile = async () => {
      if (!user?.id) {
        console.log('No user ID available - redirecting to auth');
        navigate('/supplier/login');
        return;
      }

      console.log('🔍 Current Supabase User ID:', user.id);
      console.log('🔍 Current Supabase User Email:', user.email);

      try {
        console.log('Fetching supplier profile for user ID:', user.id);
        const response = await supplierApi.getByUserId(user.id);
        console.log('Supplier profile response:', response);
        const profile = response.supplier;
        console.log('Supplier profile data:', profile);
        setSupplierData(profile);
        setEditFormData(profile);
      } catch (error: any) {
        console.error('Error fetching supplier profile:', error);

        if (error.message?.includes('not found') || error.status === 404) {
          toast({
            title: "Profile Setup Required",
            description: "Please complete your supplier profile setup.",
            variant: "default"
          });
          navigate('/supplier/profile-setup');
        } else {
          toast({
            title: "Error",
            description: `Failed to load profile data: ${error.message || 'Unknown error'}`,
            variant: "destructive"
          });
          if (error.status === 401 || error.status === 403) {
            navigate('/supplier/login');
          }
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchSupplierProfile();
  }, [user, toast, navigate]);

  // Fetch product groups with real-time updates
  useEffect(() => {
    if (!supplierData?.id) {
      console.log('No supplier data available, skipping group fetch');
      return;
    }

    const loadGroups = async () => {
      try {
        const groups = await productService.getProductsBySupplierId(supplierData.id);
        // Map product data to group format for UI compatibility
        const mappedGroups = groups.map(p => {
          let details = {};
          try {
            details = p.description ? JSON.parse(p.description) : {};
          } catch (e) {
            console.log('Error parsing description JSON', e);
          }
          return {
            id: p.id,
            product: p.name,
            quantity: p.min_order_quantity?.toString() || "0",
            finalRate: p.price_per_unit?.toString() || "0",
            imageUrl: p.image_url,
            ...details
          };
        });
        setGroupRequests(mappedGroups);
      } catch (err: any) {
        console.error('Error fetching product groups:', err);
        toast({
          title: "Error",
          description: "Failed to fetch product groups.",
          variant: "destructive"
        });
      }
    };

    loadGroups();

    const subscription = supabase
      .channel('product_groups_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_groups',
          filter: `created_by=eq.${supplierData.id}`
        },
        (payload) => {
          console.log('Product group change detected:', payload);
          loadGroups();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supplierData, toast]);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('unavailable');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);

      if (permission.state === 'granted') {
        detectCurrentLocation();
      }
    } catch (error) {
      console.log('Permission API not supported, trying geolocation directly');
      detectCurrentLocation();
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    setIsDetectingLocation(true);

    toast({
      title: "Detecting location...",
      description: "Please allow location access when prompted.",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Set basic coordinates first
        setCurrentLocation({ latitude, longitude, name: "Detecting address..." });

        // Get precise location name using reverse geocoding
        try {
          const locationName = await reverseGeocode(latitude, longitude);
          setCurrentLocation({
            latitude,
            longitude,
            name: locationName,
            accuracy: position.coords.accuracy
          });

          // Auto-fill location in new group form if enabled
          if (autoFillLocation && showGroupModal) {
            setNewGroup(prev => ({
              ...prev,
              location: locationName,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          }

          toast({
            title: "Location detected successfully",
            description: `📍 ${locationName}`,
          });
        } catch (error) {
          // Keep coordinates with fallback name
          const coords = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setCurrentLocation({
            latitude,
            longitude,
            name: coords,
            accuracy: position.coords.accuracy
          });

          if (autoFillLocation && showGroupModal) {
            setNewGroup(prev => ({
              ...prev,
              location: coords,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          }

          toast({
            title: "Location detected",
            description: "Using coordinate-based location",
            variant: "default"
          });
        }

        setIsDetectingLocation(false);
      },
      (error) => {
        setIsDetectingLocation(false);
        let errorMessage = "Unable to detect location.";
        let errorTitle = "Location Error";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorTitle = "Location Access Denied";
            errorMessage = "Please enable location permissions in your browser settings and try again.";
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorTitle = "Location Unavailable";
            errorMessage = "Your location information is currently unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            errorTitle = "Location Timeout";
            errorMessage = "Location request timed out. Please check your GPS signal and try again.";
            break;
          default:
            errorMessage = "An unknown error occurred while detecting location.";
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,    // Use GPS if available
        timeout: 15000,              // Wait up to 15 seconds
        maximumAge: 300000           // Cache location for 5 minutes
      }
    );
  };

  // Real reverse geocoding function using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat: number, lng: number) => { // Added types
    try {
      // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MarketConnect-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data && data.display_name) {
        // Extract meaningful location components
        const address = data.address || {};

        // Build location string with available components
        let locationParts = [];

        if (address.suburb || address.neighbourhood) {
          locationParts.push(address.suburb || address.neighbourhood);
        }

        if (address.city || address.town || address.village) {
          locationParts.push(address.city || address.town || address.village);
        }

        if (address.state) {
          locationParts.push(address.state);
        }

        if (address.country) {
          locationParts.push(address.country);
        }

        // If we have components, join them, otherwise use display_name
        const locationName = locationParts.length > 0
          ? locationParts.join(', ')
          : data.display_name.split(',').slice(0, 3).join(',').trim();

        return locationName;
      }

      // Fallback to coordinates if no address found
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    } catch (error) {
      console.warn('Reverse geocoding failed:', error);

      // Fallback to a secondary service or coordinates
      try {
        // Try with a simpler request
        const fallbackResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();

          if (fallbackData.locality && fallbackData.principalSubdivision) {
            return `${fallbackData.locality}, ${fallbackData.principalSubdivision}, ${fallbackData.countryName}`;
          }

          if (fallbackData.city && fallbackData.principalSubdivision) {
            return `${fallbackData.city}, ${fallbackData.principalSubdivision}, ${fallbackData.countryName}`;
          }
        }
      } catch (fallbackError) {
        console.warn('Fallback geocoding also failed:', fallbackError);
      }

      // Final fallback to coordinates
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setNewGroup(prev => ({
        ...prev,
        location: currentLocation.name,
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString()
      }));

      toast({
        title: "Location set",
        description: "Current location added to group details.",
      });
    } else {
      detectCurrentLocation();
    }
  };

  // Profile editing handlers
  const handleEditInputChange = (field: string, value: string | string[]) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!editFormData || !supplierData?.id) return;

    try {
      await supplierApi.update(supplierData.id, editFormData);
      setSupplierData(editFormData);
      setShowProfileEditModal(false);
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSupplyCapabilityToggle = (capability: string) => {
    if (editFormData) {
      const currentCapabilities = editFormData.supplyCapabilities || [];
      const updatedCapabilities = currentCapabilities.includes(capability)
        ? currentCapabilities.filter(item => item !== capability)
        : [...currentCapabilities, capability];

      handleEditInputChange('supplyCapabilities', updatedCapabilities);
    }
  };

  // Helper function to format deadline for display
  const formatDeadline = (deadlineString: string) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    } else {
      return "Expired";
    }
  };

  // Filter group requests based on search
  const getFilteredGroupRequests = () => {
    return groupRequests.filter(request =>
      request.product.toLowerCase().includes(groupSearch.toLowerCase()) ||
      request.location.toLowerCase().includes(groupSearch.toLowerCase())
    );
  };


  // Fetch orders with real-time updates
  useEffect(() => {
    if (!supplierData?.id) {
      return;
    }

    const fetchSupplierOrders = async () => {
      try {
        console.log('Fetching orders for supplier:', supplierData.id);

        const relevantOrders = await orderService.getOrdersBySupplierId(supplierData.id);
        console.log('Supplier orders response:', relevantOrders);
        console.log('Total orders found:', relevantOrders.length || 0);
        if (relevantOrders.length > 0) {
          console.log('First order items:', relevantOrders[0].items);
          if (relevantOrders[0].items && relevantOrders[0].items.length > 0) {
            console.log('First item product:', relevantOrders[0].items[0].product);
          }
        }

        const transformedOrders = relevantOrders.map((order: any) => {
          // Use the first item's product name or a generic label
          const productName = order.items && order.items.length > 0
            ? (order.items[0].product?.name || 'Product')
            : 'View Details';

          return {
            id: order.id,
            product: productName,
            // Robustly extract image URL
            image: order.items && order.items.length > 0
              ? (Array.isArray(order.items[0].product)
                ? order.items[0].product[0]?.image_url
                : order.items[0].product?.image_url)
              : null,
            type: order.order_type || 'individual',
            vendors: 1,
            // Map DB status to UI status
            status: order.status === 'ready_for_pickup' ? 'Ready to Ship' :
              order.status === 'out_for_delivery' ? 'Out for Delivery' :
                order.status === 'delivered' ? 'Delivered' :
                  order.status === 'confirmed' ? 'Processing' :
                    order.status === 'pending' ? 'Pending' : order.status,
            value: `₹${order.total_amount}`,
            quantity: order.items ? `${order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} units` : '0 units',
            deliveryDate: order.delivery_date || 'TBD',
            customerName: 'Customer',
            customerPhone: '',
            paymentMethod: 'online',
            createdAt: order.created_at
          };
        });

        // Separate orders if needed, or put all in confirmedOrders for the dashboard view
        // The UI seems to have "Individual Orders" and "Confirmed Orders" tabs.
        // For now, let's populate confirmedOrders as that's where the action buttons are.
        setConfirmedOrders(transformedOrders);
        setIndividualOrders(transformedOrders); // Also populate individual for safety if used elsewhere

      } catch (error) {
        console.error('Error fetching supplier orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders. Please refresh the page.",
          variant: "destructive"
        });
      }
    };

    fetchSupplierOrders();

    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `supplier_id=eq.${supplierData.id}`
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchSupplierOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supplierData, toast]);

  // --- NEW HELPER FUNCTIONS FOR UPDATE/DELETE ---

  /**
   * Resets all modal fields, image previews, and editing state.
   */
  const closeAndResetModal = () => {
    setShowGroupModal(false);
    setEditingGroup(null);
    setNewGroup({
      product: "",
      quantity: "",
      actualRate: "",
      finalRate: "",
      discountPercentage: "",
      location: autoFillLocation && currentLocation ? currentLocation.name : "",
      deadline: "",
      deadlineTime: "",
      latitude: autoFillLocation && currentLocation ? currentLocation.latitude.toString() : "",
      longitude: autoFillLocation && currentLocation ? currentLocation.longitude.toString() : "",
      imageUrl: ""
    });
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Pre-fills the modal with existing group data for editing.
   */
  const handleStartEdit = (group: any) => {
    setEditingGroup(group);

    // Format deadline from ISO string back into date and time inputs
    const deadline = new Date(group.deadline);
    const deadlineDate = deadline.toISOString().split('T')[0];
    const deadlineTime = deadline.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    setNewGroup({
      product: group.product || "",
      quantity: group.quantity || "",
      actualRate: group.actualRate || "",
      finalRate: group.finalRate || "",
      discountPercentage: group.discountPercentage || "",
      location: group.location || "",
      deadline: deadlineDate,
      deadlineTime: deadlineTime,
      latitude: group.latitude || "",
      longitude: group.longitude || "",
      imageUrl: group.imageUrl || ""
    });

    setImagePreview(group.imageUrl || null);
    setShowGroupModal(true);
  };

  /**
   * Deletes a product group after confirmation.
   */
  const handleDeleteGroup = async (groupId: string) => {
    if (window.confirm("Are you sure you want to delete this product group? This action cannot be undone.")) {
      try {
        await productService.deleteProduct(groupId);

        toast({
          title: "Success",
          description: "Product deleted.",
        });

        // Update state locally for instant UI change
        setGroupRequests(prev => prev.filter(group => group.id !== groupId));
      } catch (err: any) {
        console.error('Error deleting product group:', err);
        toast({
          title: "Error",
          description: `Failed to delete group: ${err.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    }
  };

  /**
   * Handles both Creating a new group and Updating an existing one.
   */
  const handleGroupSubmit = async () => {
    if (!newGroup.product || !newGroup.quantity || !newGroup.actualRate || !newGroup.finalRate || !newGroup.location || !newGroup.deadline || !newGroup.deadlineTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!supplierData?.id) {
      toast({
        title: "Profile Required",
        description: "Please complete your supplier profile setup.",
        variant: "destructive"
      });
      return;
    }

    const deadlineDateTime = `${newGroup.deadline}T${newGroup.deadlineTime}`;

    // Prepare description JSON with extra fields
    const descriptionJson = JSON.stringify({
      location: newGroup.location,
      deadline: deadlineDateTime,
      actualRate: newGroup.actualRate,
      discountPercentage: newGroup.discountPercentage,
      latitude: newGroup.latitude,
      longitude: newGroup.longitude
    });

    const productData = {
      supplier_id: supplierData.id,
      name: newGroup.product,
      category: 'General', // Default
      unit: 'kg', // Default
      price_per_unit: parseFloat(newGroup.finalRate),
      min_order_quantity: parseInt(newGroup.quantity),
      stock_available: true,
      description: descriptionJson,
      image_url: newGroup.imageUrl || null
    };

    try {
      if (editingGroup) {
        // --- UPDATE LOGIC ---
        await productService.updateProduct(editingGroup.id, productData);
        toast({
          title: "Product Updated!",
          description: `${newGroup.product} has been updated.`,
        });
      } else {
        // --- CREATE LOGIC ---
        await productService.createProduct(productData);
        toast({
          title: "Product Created!",
          description: `${newGroup.product} created for ${newGroup.location}`,
        });
      }

      // Reset and close modal
      closeAndResetModal();

      // Manually refetch groups
      const groups = await productService.getProductsBySupplierId(supplierData.id);
      const mappedGroups = groups.map(p => {
        let details = {};
        try {
          details = p.description ? JSON.parse(p.description) : {};
        } catch (e) {
          // ignore
        }
        return {
          id: p.id,
          product: p.name,
          quantity: p.min_order_quantity?.toString() || "0",
          finalRate: p.price_per_unit?.toString() || "0",
          imageUrl: p.image_url,
          ...details
        };
      });
      setGroupRequests(mappedGroups);

    } catch (err: any) {
      console.error(`Error ${editingGroup ? 'updating' : 'creating'} product:`, err);
      toast({
        title: "Error",
        description: `Failed to ${editingGroup ? 'update' : 'create'} product: ${err.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 pt-20">
        {/* Loading State */}
        {profileLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden">
              <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.jpg"
                      alt="MarketConnect Logo"
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Supplier Dashboard</h1>
                      {supplierData && (
                        <p className="text-green-100 text-sm">Welcome back, {supplierData.fullName}!</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                        className="p-2 hover:bg-green-500 rounded-lg text-white"
                      >
                        <Menu className="w-6 h-6" />
                      </button>

                      {showHamburgerMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={() => {
                              setShowProfileEditModal(true);
                              setShowHamburgerMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <User className="w-4 h-4 mr-3" />
                            My Profile
                          </button>
                          <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center">
                            <Settings className="w-4 h-4 mr-3" />
                            Account Settings
                          </button>
                          <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center">
                            <HelpCircle className="w-4 h-4 mr-3" />
                            Help & Support
                          </button>
                          <hr className="my-2" />
                          <button
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                            onClick={async () => {
                              setShowHamburgerMenu(false);
                              await logout();
                              navigate('/supplier/auth');
                            }}
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
              {/* Orders Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg border shadow-sm">
                  <TabsTrigger value="group" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Group Requests</TabsTrigger>
                  <TabsTrigger value="individual" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">My Orders</TabsTrigger>
                  <TabsTrigger value="confirmed" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Order History</TabsTrigger>
                </TabsList>
                <TabsContent value="group" className="space-y-4">
                  <div className="bg-blue-500 text-white rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-2">Group Order Requests</h2>
                    <p className="text-blue-100 mb-4">Manage incoming group order requests from vendors</p>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-100" />
                        {currentLocation ? (
                          <span className="text-blue-100 text-sm">
                            Current location: {currentLocation.name}
                          </span>
                        ) : (
                          <span className="text-blue-200 text-sm">
                            {isDetectingLocation ? "Detecting location..." : "No location detected"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!currentLocation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={detectCurrentLocation}
                            disabled={isDetectingLocation}
                            className="text-white border-white hover:bg-blue-400"
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            {isDetectingLocation ? "Detecting..." : "Detect Location"}
                          </Button>
                        )}
                        <Button variant="secondary" onClick={() => setShowGroupModal(true)} className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Product Group
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="bg-white rounded-lg border p-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="relative flex-1 min-w-[300px]">
                        <input
                          type="text"
                          placeholder="Search group requests..."
                          value={groupSearch}
                          onChange={e => setGroupSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLocationModal(true)}
                        className="flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Location Settings
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {getFilteredGroupRequests().map((request) => (
                      <div key={request.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 flex flex-col justify-between">
                        <div> {/* Top content wrapper */}
                          <div className="mb-3">
                            <div className="w-full h-32 bg-blue-100 rounded-lg overflow-hidden mb-3">
                              {request.imageUrl ? (
                                <img
                                  src={request.imageUrl}
                                  alt={request.product}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-12 h-12 text-blue-600" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-lg text-gray-900">{request.product}</div>
                          <div className="text-gray-600 text-sm">Group order request</div>
                          <div className="flex items-center text-xs text-gray-500 mt-1 mb-2">
                            <span>{request.vendors || 0} vendors</span>
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs capitalize">{request.status}</span>
                          </div>

                          {/* Location Info */}
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{request.location}</span>
                          </div>

                          <div className="text-blue-600 font-bold text-lg mb-1">₹{request.finalRate}/kg</div>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span>Qty: {request.quantity}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Due {formatDeadline(request.deadline)}</span>
                          </div>
                        </div>

                        {/* === MODIFIED: ADDED BUTTONS CONTAINER === */}
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleStartEdit(request)}
                          >
                            <Edit className="w-4 h-4 text-gray-700" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleDeleteGroup(request.id)}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* === END OF MODIFIED BUTTONS === */}

                      </div>
                    ))}
                  </div>

                  {getFilteredGroupRequests().length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Group Requests Found</h3>
                      <p className="text-gray-500 mb-4">
                        {groupSearch
                          ? "No requests match your search criteria."
                          : "Create your first product group to start receiving requests from vendors."}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowGroupModal(true)}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Create Product Group
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="individual" className="space-y-4">
                  <div className="bg-green-500 text-white rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-2">My Orders</h2>
                    <p className="text-green-100 mb-4">Orders assigned to your business (payment completed)</p>
                  </div>

                  {individualOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Orders Assigned</h3>
                      <p className="text-gray-500 mb-4">
                        Orders assigned to your business will appear here after vendors select you and complete payment.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {individualOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
                          <div className="mb-3">
                            <div className="w-full h-32 bg-green-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                              {order.image ? (
                                <img src={order.image} alt={order.product} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-12 h-12 text-green-600" />
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-lg text-gray-900">{order.product}</div>
                          <div className="text-gray-600 text-sm">by {order.vendor}</div>
                          {order.stallName && (
                            <div className="text-gray-500 text-xs">Stall: {order.stallName}</div>
                          )}
                          <div className="flex items-center text-xs text-gray-500 mt-1 mb-2">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{order.location}</span>
                          </div>
                          <div className="text-green-600 font-bold text-lg mb-1">{order.totalValue}</div>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span>Qty: {order.quantity}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span>Rate: {order.requestedPrice}</span>
                          </div>
                          {order.vendorPhone && (
                            <div className="flex items-center text-xs text-gray-500 mb-2">
                              <Phone className="w-3 h-3 mr-1" />
                              <span>{order.vendorPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <CreditCard className="w-3 h-3 mr-1" />
                            <span className="capitalize">{order.paymentMethod}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Payment Status Display */}
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                              <span className="text-green-700 font-medium text-sm">
                                {order.paymentStatus === 'completed' ? 'Payment Confirmed' : 'Payment Pending'}
                              </span>
                            </div>
                            <p className="text-green-600 text-xs text-center mt-1 capitalize">
                              {order.status === 'confirmed' ? 'Order confirmed and ready for processing' : order.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="confirmed" className="space-y-4">
                  <div className="bg-purple-500 text-white rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-2">Order History</h2>
                    <p className="text-purple-100 mb-4">Complete history of all your orders</p>
                  </div>

                  {confirmedOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Order History</h3>
                      <p className="text-gray-500 mb-4">
                        Your complete order history will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {confirmedOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4">
                          <div className="mb-3">
                            <div className="w-full h-32 bg-purple-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                              {order.image ? (
                                <img src={order.image} alt={order.product} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-12 h-12 text-purple-600" />
                              )}
                            </div>
                          </div>
                          <div className="font-semibold text-lg text-gray-900">{order.product}</div>
                          <div className="text-gray-600 text-sm">{order.type} Order</div>
                          <div className="flex items-center text-xs text-gray-500 mt-1 mb-2">
                            {order.vendors && <span>{order.vendors} vendors</span>}
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize ${order.status === 'Ready to Ship' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-purple-600 font-bold text-lg mb-1">{order.value}</div>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span>Qty: {order.quantity}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-3">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Deliver {order.deliveryDate}</span>
                          </div>
                          {order.status !== 'Delivered' && order.status !== 'delivered' && (
                            <div className="space-y-2">
                              {/* Show "Ready for Pickup" if status is pending or confirmed */}
                              {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'Processing') && (
                                <button
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                                  onClick={async () => {
                                    try {
                                      await orderService.updateOrderStatus(order.id, 'ready_for_pickup');
                                      toast({ title: 'Ready for Pickup', description: 'Order marked as ready for pickup.' });
                                      // Refresh orders
                                      const fetchSupplierOrders = async () => {
                                        try {
                                          if (!supplierData?.id) return;
                                          const relevantOrders = await orderService.getOrdersBySupplierId(supplierData.id);
                                          const transformedConfirmedOrders = relevantOrders.map((order: any) => {
                                            return {
                                              id: order.id,
                                              product: 'View Details',
                                              type: order.order_type,
                                              vendors: 1,
                                              // Map DB status to UI status
                                              status: order.status === 'ready_for_pickup' ? 'Ready to Ship' :
                                                order.status === 'out_for_delivery' ? 'Out for Delivery' :
                                                  order.status === 'delivered' ? 'Delivered' :
                                                    order.status === 'confirmed' ? 'Processing' : order.status,
                                              value: `₹${order.total_amount}`,
                                              quantity: '0kg',
                                              deliveryDate: order.delivery_date || 'TBD',
                                              customerName: 'Customer',
                                              customerPhone: '',
                                              paymentMethod: 'online',
                                              createdAt: order.created_at
                                            };
                                          });
                                          setConfirmedOrders(transformedConfirmedOrders);
                                        } catch (error) {
                                          console.error('Error refreshing orders:', error);
                                        }
                                      };
                                      fetchSupplierOrders();
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: `Failed to update status: ${err.message}`, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}

                              {/* Show "Mark as Delivered" only if it's already out for delivery or ready (manual override) */}
                              {(order.status === 'out_for_delivery' || order.status === 'Ready to Ship' || order.status === 'ready_for_pickup') && (
                                <button
                                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
                                  onClick={async () => {
                                    try {
                                      await orderService.updateOrderStatus(order.id, 'delivered');
                                      toast({ title: 'Delivered', description: 'Order marked as delivered.' });
                                      // Refresh orders (duplicate logic, ideally refactor to function)
                                      const fetchSupplierOrders = async () => {
                                        try {
                                          if (!supplierData?.id) return;
                                          const relevantOrders = await orderService.getOrdersBySupplierId(supplierData.id);
                                          const transformedConfirmedOrders = relevantOrders.map((order: any) => {
                                            return {
                                              id: order.id,
                                              product: 'View Details',
                                              type: order.order_type,
                                              vendors: 1,
                                              status: order.status === 'ready_for_pickup' ? 'Ready to Ship' :
                                                order.status === 'out_for_delivery' ? 'Out for Delivery' :
                                                  order.status === 'delivered' ? 'Delivered' :
                                                    order.status === 'confirmed' ? 'Processing' : order.status,
                                              value: `₹${order.total_amount}`,
                                              quantity: '0kg',
                                              deliveryDate: order.delivery_date || 'TBD',
                                              customerName: 'Customer',
                                              customerPhone: '',
                                              paymentMethod: 'online',
                                              createdAt: order.created_at
                                            };
                                          });
                                          setConfirmedOrders(transformedConfirmedOrders);
                                        } catch (error) {
                                          console.error('Error refreshing orders:', error);
                                        }
                                      };
                                      fetchSupplierOrders();
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: `Failed to mark as delivered: ${err.message}`, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Mark as Delivered
                                </button>
                              )}
                            </div>
                          )}
                          {(order.status === 'Delivered' || order.status === 'delivered') && (
                            <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg font-medium text-center">
                              ✓ Delivered
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Profile Edit Modal */}
            {showProfileEditModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl border max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-semibold">Edit Supplier Profile</h2>
                    <button
                      onClick={() => setShowProfileEditModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Details & Business Information */}
                    <div className="space-y-6">
                      {/* Personal Details */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <input
                              type="text"
                              value={editFormData?.fullName || ''}
                              onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Mobile Number *</label>
                            <input
                              type="tel"
                              value={editFormData?.mobileNumber || ''}
                              onChange={(e) => handleEditInputChange('mobileNumber', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="+91 9876543210"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Language Preference *</label>
                            <select
                              value={editFormData?.languagePreference || ''}
                              onChange={(e) => handleEditInputChange('languagePreference', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            >
                              <option value="">Select Language</option>
                              <option value="Hindi">Hindi</option>
                              <option value="Marathi">Marathi</option>
                              <option value="English">English</option>
                              <option value="Gujarati">Gujarati</option>
                              <option value="Punjabi">Punjabi</option>
                              <option value="Bengali">Bengali</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Business Details */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Business Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Business Name</label>
                            <input
                              type="text"
                              value={editFormData?.businessName || ''}
                              onChange={(e) => handleEditInputChange('businessName', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter your business name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Business Address *</label>
                            <input
                              type="text"
                              value={editFormData?.businessAddress || ''}
                              onChange={(e) => handleEditInputChange('businessAddress', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Street, Landmark, etc."
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">City *</label>
                              <input
                                type="text"
                                value={editFormData?.city || ''}
                                onChange={(e) => handleEditInputChange('city', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter city"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Pincode *</label>
                              <input
                                type="text"
                                value={editFormData?.pincode || ''}
                                onChange={(e) => handleEditInputChange('pincode', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter pincode"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">State *</label>
                              <select
                                value={editFormData?.state || ''}
                                onChange={(e) => handleEditInputChange('state', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                              >
                                <option value="">Select State</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Punjab">Punjab</option>
                                <option value="West Bengal">West Bengal</option>
                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Business Type *</label>
                            <select
                              value={editFormData?.businessType || ''}
                              onChange={(e) => handleEditInputChange('businessType', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            >
                              <option value="">Select Business Type</option>
                              <option value="Wholesale">Wholesale</option>
                              <option value="Retail">Retail</option>
                              <option value="Manufacturing">Manufacturing</option>
                              <option value="Distribution">Distribution</option>
                              <option value="Import/Export">Import/Export</option>
                              <option value="Local Supplier">Local Supplier</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">GST Number</label>
                              <input
                                type="text"
                                value={editFormData?.gstNumber || ''}
                                onChange={(e) => handleEditInputChange('gstNumber', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter GST number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">License Number</label>
                              <input
                                type="text"
                                value={editFormData?.licenseNumber || ''}
                                onChange={(e) => handleEditInputChange('licenseNumber', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter license number"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Years in Business</label>
                              <input
                                type="number"
                                value={editFormData?.yearsInBusiness || ''}
                                onChange={(e) => handleEditInputChange('yearsInBusiness', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Enter years in business"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Employee Count</label>
                              <select
                                value={editFormData?.employeeCount || ''}
                                onChange={(e) => handleEditInputChange('employeeCount', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                              >
                                <option value="">Select Employee Count</option>
                                <option value="1-10">1-10</option>
                                <option value="11-25">11-25</option>
                                <option value="25-50">25-50</option>
                                <option value="50-100">50-100</option>
                                <option value="100+">100+</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Primary Email</label>
                            <input
                              type="email"
                              value={editFormData?.primaryEmail || ''}
                              onChange={(e) => handleEditInputChange('primaryEmail', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter primary email"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">WhatsApp Business</label>
                            <input
                              type="tel"
                              value={editFormData?.whatsappBusiness || ''}
                              onChange={(e) => handleEditInputChange('whatsappBusiness', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter WhatsApp business number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supply Capabilities & Preferences */}
                    <div className="space-y-6">
                      {/* Supply Capabilities */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Supply Capabilities *</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {['Spices', 'Oil', 'Vegetables', 'Grains', 'Dairy', 'Meat', 'Fruits', 'Flour', 'Sugar', 'Salt', 'Herbs', 'Packaging', 'Equipment'].map((capability) => (
                            <label key={capability} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editFormData?.supplyCapabilities?.includes(capability) || false}
                                onChange={(e) => handleSupplyCapabilityToggle(capability)}
                                className="mr-2"
                              />
                              <span className="text-sm">{capability}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Preferences */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Delivery Preferences</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Preferred Delivery Time *</label>
                            <select
                              value={editFormData?.preferredDeliveryTime || ''}
                              onChange={(e) => handleEditInputChange('preferredDeliveryTime', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                            >
                              <option value="">Select Delivery Time</option>
                              <option value="Morning (6 AM - 12 PM)">Morning (6 AM - 12 PM)</option>
                              <option value="Afternoon (12 PM - 6 PM)">Afternoon (12 PM - 6 PM)</option>
                              <option value="Evening (6 PM - 12 AM)">Evening (6 PM - 12 AM)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Certifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Certifications (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Food Safety License</label>
                            <input
                              type="text"
                              value={editFormData?.foodSafetyLicense || ''}
                              onChange={(e) => handleEditInputChange('foodSafetyLicense', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter license number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Organic Certification</label>
                            <input
                              type="text"
                              value={editFormData?.organicCertification || ''}
                              onChange={(e) => handleEditInputChange('organicCertification', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter certificate number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">ISO Certification</label>
                            <input
                              type="text"
                              value={editFormData?.isoCertification || ''}
                              onChange={(e) => handleEditInputChange('isoCertification', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="e.g., ISO 22000:2018"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Export License</label>
                            <input
                              type="text"
                              value={editFormData?.exportLicense || ''}
                              onChange={(e) => handleEditInputChange('exportLicense', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Enter license number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Location (Optional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Latitude</label>
                            <input
                              type="text"
                              value={editFormData?.latitude || ''}
                              onChange={(e) => handleEditInputChange('latitude', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Auto-detect or enter manually"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Longitude</label>
                            <input
                              type="text"
                              value={editFormData?.longitude || ''}
                              onChange={(e) => handleEditInputChange('longitude', e.target.value)}
                              className="w-full border rounded px-3 py-2"
                              placeholder="Auto-detect or enter manually"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowProfileEditModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={!editFormData}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Create/Update Product Group Modal */}
            {showGroupModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg border max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-start mb-6">
                    {/* === MODIFIED: DYNAMIC TITLE === */}
                    <h2 className="text-xl font-semibold">
                      {editingGroup ? 'Update Product Group' : 'Create Product Group'}
                    </h2>
                    <button
                      onClick={closeAndResetModal} // <-- Use new reset function
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Fresh Tomatoes"
                        value={newGroup.product}
                        onChange={e => setNewGroup({ ...newGroup, product: e.target.value })}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity *</label>
                      <input
                        type="text"
                        placeholder="e.g., 500 kg"
                        value={newGroup.quantity}
                        onChange={e => setNewGroup({ ...newGroup, quantity: e.target.value })}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Actual Rate (₹/kg) *</label>
                        <input
                          type="number"
                          placeholder="e.g., 25"
                          value={newGroup.actualRate}
                          onChange={e => {
                            const actualRate = e.target.value;
                            const discount = calculateDiscountPercentage(actualRate, newGroup.finalRate);
                            setNewGroup({
                              ...newGroup,
                              actualRate,
                              discountPercentage: discount
                            });
                          }}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Final Rate (₹/kg) *</label>
                        <input
                          type="number"
                          placeholder="e.g., 20"
                          value={newGroup.finalRate}
                          onChange={e => {
                            const finalRate = e.target.value;
                            const discount = calculateDiscountPercentage(newGroup.actualRate, finalRate);
                            setNewGroup({
                              ...newGroup,
                              finalRate,
                              discountPercentage: discount
                            });
                          }}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {newGroup.discountPercentage && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Discount Calculated:</span>
                          <span className="text-lg font-bold text-green-600">{newGroup.discountPercentage}% OFF</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Actual: ₹{newGroup.actualRate}/kg → Final: ₹{newGroup.finalRate}/kg
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Delivery Location *</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Enter delivery location"
                          value={newGroup.location}
                          onChange={e => setNewGroup({ ...newGroup, location: e.target.value })}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {currentLocation && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUseCurrentLocation}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            Use Current Location ({currentLocation.name})
                          </Button>
                        )}
                        {!currentLocation && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={detectCurrentLocation}
                            disabled={isDetectingLocation}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-4 h-4" />
                            {isDetectingLocation ? "Detecting Location..." : "Auto-Detect Location"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Deadline Date *</label>
                        <input
                          type="date"
                          value={newGroup.deadline}
                          onChange={e => setNewGroup({ ...newGroup, deadline: e.target.value })}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Deadline Time *</label>
                        <input
                          type="time"
                          value={newGroup.deadlineTime}
                          onChange={e => setNewGroup({ ...newGroup, deadlineTime: e.target.value })}
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Product Image Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Image (Optional)</label>
                      <div className="space-y-3">
                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setImageFile(null);
                                setNewGroup({ ...newGroup, imageUrl: "" });
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {/* Image Upload Buttons */}
                        {!imagePreview && (
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const base64String = reader.result as string;
                                    setImageFile(file);
                                    setImagePreview(base64String);
                                    setNewGroup({ ...newGroup, imageUrl: base64String });
                                    // TODO: You might want to upload this file to Supabase storage 
                                    // and save the URL instead of the base64 string if it's too large.
                                    // For now, base64 string is saved in imageUrl.
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              Choose from Gallery
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const base64String = reader.result as string;
                                      setImageFile(file);
                                      setImagePreview(base64String);
                                      setNewGroup({ ...newGroup, imageUrl: base64String });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                };
                                input.click();
                              }}
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              Take Photo
                            </Button>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Add a photo of your product to help vendors identify it easily
                        </p>
                      </div>
                    </div>

                    {/* Auto-fill location preference */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={autoFillLocation}
                          onChange={(e) => setAutoFillLocation(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-blue-800">
                          Auto-fill location for future groups
                        </span>
                      </label>
                      <p className="text-xs text-blue-600 mt-1">
                        When enabled, your current location will be automatically filled in new group forms.
                      </p>
                    </div>
                  </div>

                  {/* === MODIFIED: MODAL ACTION BUTTONS === */}
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={closeAndResetModal} // <-- Use new reset function
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleGroupSubmit} // <-- Use new submit handler
                      disabled={!newGroup.product || !newGroup.quantity || !newGroup.actualRate || !newGroup.finalRate || !newGroup.location || !newGroup.deadline || !newGroup.deadlineTime}
                    >
                      {/* Dynamic button text */}
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </Button>
                  </div>
                  {/* === END OF MODIFIED BUTTONS === */}

                </div>
              </div>
            )}

            {/* Location Settings Modal */}
            {showLocationModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold">Location Settings</h2>
                    <button
                      onClick={() => setShowLocationModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Current Location Status */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Current Location</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {currentLocation ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">{currentLocation.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Location not detected</span>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={detectCurrentLocation}
                        disabled={isDetectingLocation}
                        className="w-full mt-3 flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        {isDetectingLocation ? "Detecting..." : "Detect Location"}
                      </Button>
                    </div>

                    {/* Auto-fill Preferences */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Auto-fill Preferences</h3>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={autoFillLocation}
                            onChange={(e) => setAutoFillLocation(e.target.checked)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">Auto-fill location in new group forms</span>
                        </label>
                      </div>

                      {autoFillLocation && currentLocation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Location will be automatically filled as: {currentLocation.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Location Permission Status */}
                    {locationPermission === 'denied' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-yellow-400 rounded-full mt-0.5"></div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Location Access Denied</p>
                            <p className="text-xs text-yellow-600 mt-1">
                              To use location features, please enable location permissions in your browser settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowLocationModal(false)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setShowLocationModal(false);
                        toast({
                          title: "Settings saved",
                          description: "Your location preferences have been updated.",
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default SupplierDashboard;