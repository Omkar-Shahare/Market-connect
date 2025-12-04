import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Users, Package, Clock, Bell, Menu,
  TrendingUp, MapPin, CheckCircle, XCircle, Plus, User, Edit,
  Camera, Mail, Phone, Building, Shield, Star, Calendar, Award, Truck, DollarSign,
  Settings, HelpCircle, LogOut, Navigation, Target, Search, CreditCard,
  Trash, PieChart, AlertTriangle, MessageSquare
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { productService } from "@/services/supabaseProduct";
import { supplierApi, SupplierProfile } from "@/services/supplierApi";
import { orderService } from "@/services/supabaseOrder";
import { reviewService } from "@/services/supabaseReview";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Define tab items for reuse
const tabItems = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-green-600", activeClass: "data-[state=active]:bg-green-600" },
  { value: "analytics", label: "Analytics", icon: BarChart3, color: "bg-indigo-600", activeClass: "data-[state=active]:bg-indigo-600" },
  { value: "group", label: "Group Requests", icon: Users, color: "bg-blue-500", activeClass: "data-[state=active]:bg-blue-500" },

  { value: "confirmed", label: "Order History", icon: Clock, color: "bg-purple-500", activeClass: "data-[state=active]:bg-purple-500" },

];

const SupplierDashboard = () => {
  const { logout, user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    imageUrl: "",
    category: "Vegetables"
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
      if (loading) return;

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
  }, [user, loading, toast, navigate]);

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
  const fetchSupplierOrders = useCallback(async () => {
    if (!supplierData?.id) return;

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

      // Extract all product IDs from all orders
      const allProductIds = new Set<string>();
      relevantOrders.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            // Handle both array and object format for product (though now it will be just ID in item, we need to be careful)
            // Since we removed the join, item.product might be missing or just an ID if we didn't select it.
            // Actually, order_items table has product_id.
            if (item.product_id) allProductIds.add(item.product_id);
          });
        }
      });

      // Fetch product details manually
      let productsMap: Record<string, any> = {};
      if (allProductIds.size > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', Array.from(allProductIds));

        if (productsData) {
          productsMap = productsData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
      }

      const transformedOrders = relevantOrders.map((order: any) => {
        // Attach product details to items
        const itemsWithProducts = order.items?.map((item: any) => ({
          ...item,
          product: productsMap[item.product_id] || { name: 'Unknown Product', image_url: null }
        })) || [];

        // Use the first item's product name or a generic label
        const firstItem = itemsWithProducts[0];
        const productName = itemsWithProducts.length > 0
          ? (firstItem.product?.name || 'Product')
          : 'No Items Data';

        return {
          id: order.id,
          product: productName,
          image: firstItem?.product?.image_url || null,
          items: itemsWithProducts,
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
          deliveryDate: order.delivery_date ? new Date(order.delivery_date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }) : 'TBD',
          customerName: 'Customer',
          customerPhone: '',
          paymentMethod: 'online',
          createdAt: order.created_at
        };
      });

      // Fetch reviews for all orders in one go
      const orderIds = transformedOrders.map((o: any) => o.id);
      let reviewsMap: Record<string, any> = {};

      if (orderIds.length > 0) {
        try {
          const reviews = await reviewService.getReviewsByOrderIds(orderIds);
          if (reviews) {
            reviewsMap = reviews.reduce((acc: any, review: any) => {
              acc[review.order_id] = review;
              return acc;
            }, {});
          }
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError);
        }
      }

      const ordersWithReviews = transformedOrders.map((order: any) => {
        const review = reviewsMap[order.id];
        return {
          ...order,
          review: review
        };
      });

      // Separate orders if needed, or put all in confirmedOrders for the dashboard view
      // The UI seems to have "Individual Orders" and "Confirmed Orders" tabs.
      // For now, let's populate confirmedOrders as that's where the action buttons are.
      setConfirmedOrders(ordersWithReviews);


    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [supplierData, toast]);

  useEffect(() => {
    fetchSupplierOrders();

    if (!supplierData?.id) return;

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
  }, [fetchSupplierOrders, supplierData?.id]);

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
      imageUrl: "",
      category: "Vegetables"
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
      imageUrl: group.imageUrl || "",
      category: group.category || "Vegetables"
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
      category: newGroup.category,
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


  // Calculate notification count
  const lowStockCount = groupRequests.filter(p => parseInt(p.quantity) < 10).length;
  const newOrderCount = confirmedOrders.length;
  const reviewCount = confirmedOrders.filter(o => o.review).length;
  const notificationCount = lowStockCount + newOrderCount + reviewCount;

  return (
    <>
      <Navbar
        notificationCount={notificationCount}
        onNotificationClick={() => setActiveTab("notifications")}
      />
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
                {/* Mobile Tab Navigation */}
                <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    {(() => {
                      if (activeTab === 'notifications') {
                        return (
                          <>
                            <Bell className="w-5 h-5" />
                            Notifications
                          </>
                        );
                      }
                      const currentItem = tabItems.find(t => t.value === activeTab);
                      const Icon = currentItem?.icon || LayoutDashboard;
                      return (
                        <>
                          <Icon className="w-5 h-5" />
                          {currentItem?.label || "Dashboard"}
                        </>
                      );
                    })()}
                  </span>
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                      <SheetHeader className="mb-6 text-left">
                        <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-2">
                        {tabItems.map((item) => (
                          <Button
                            key={item.value}
                            variant={activeTab === item.value ? "default" : "ghost"}
                            className={`justify-start ${activeTab === item.value ? item.color : ''}`}
                            onClick={() => {
                              setActiveTab(item.value);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop Tab Navigation */}
                <TabsList className="hidden lg:grid w-full grid-cols-4 bg-white p-1 rounded-lg border shadow-sm">
                  {tabItems.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className={`${item.activeClass} data-[state=active]:text-white`}
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="notifications" className="space-y-6">
                  <div className="bg-orange-500 text-white rounded-lg p-6 shadow-lg mb-6">
                    <h2 className="text-3xl font-bold mb-2">Notifications</h2>
                    <p className="text-orange-100">Stay updated with real-time alerts and messages.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Low Stock Alerts */}
                    {groupRequests.filter(p => parseInt(p.quantity) < 10).map(product => (
                      <div key={`stock-${product.id}`} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-4">
                        <div className="bg-red-100 p-2 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-red-800">Low Stock Alert</h3>
                          <p className="text-red-700">
                            <span className="font-semibold">{product.product}</span> is running low ({product.quantity} kg remaining).
                          </p>
                          <p className="text-xs text-red-500 mt-1">Update stock immediately to avoid shortages.</p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => {
                          handleStartEdit(product);
                          setActiveTab("group");
                        }}>Update Stock</Button>
                      </div>
                    ))}

                    {/* New Order Alerts */}
                    {confirmedOrders.slice(0, 10).map(order => (
                      <div key={`order-${order.id}`} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-800">New Order Received</h3>
                          <p className="text-blue-700">
                            <span className="font-semibold">{order.customerName || 'Vendor'}</span> ordered <span className="font-semibold">{order.product}</span> worth <span className="font-semibold">{order.value}</span>.
                          </p>
                          <p className="text-xs text-blue-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setActiveTab("confirmed")}>View Order</Button>
                      </div>
                    ))}

                    {/* Vendor Messages / Reviews */}
                    {confirmedOrders.filter(o => o.review).map(order => (
                      <div key={`review-${order.id}`} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm flex items-start gap-4">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <MessageSquare className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-yellow-800">New Review</h3>
                          <p className="text-yellow-700">
                            <span className="font-semibold">{order.review.vendor?.business_name || 'Vendor'}</span> rated you <span className="font-bold">{order.review.rating}/5</span>.
                          </p>
                          {order.review.comment && (
                            <p className="text-sm text-yellow-600 italic mt-1">"{order.review.comment}"</p>
                          )}
                          <p className="text-xs text-yellow-500 mt-1">{new Date(order.review.created_at || order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}

                    {groupRequests.filter(p => parseInt(p.quantity) < 10).length === 0 && confirmedOrders.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No new notifications</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="bg-indigo-600 text-white rounded-lg p-6 shadow-lg mb-6">
                    <h2 className="text-3xl font-bold mb-2">Business Analytics</h2>
                    <p className="text-indigo-100">Insights to help you grow your business.</p>
                  </div>

                  {/* 1. Revenue Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">This Month Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">
                          ₹{confirmedOrders.reduce((acc, order) => {
                            const orderDate = new Date(order.createdAt);
                            const now = new Date();
                            if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                              const val = parseFloat(order.value.replace('₹', '').replace(/,/g, ''));
                              return acc + (isNaN(val) ? 0 : val);
                            }
                            return acc;
                          }, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +12.5% from last month
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">This Week Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">
                          ₹{confirmedOrders.reduce((acc, order) => {
                            const orderDate = new Date(order.createdAt);
                            const now = new Date();
                            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            if (orderDate >= oneWeekAgo) {
                              const val = parseFloat(order.value.replace('₹', '').replace(/,/g, ''));
                              return acc + (isNaN(val) ? 0 : val);
                            }
                            return acc;
                          }, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +5.2% from last week
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Average Order Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">
                          {(() => {
                            if (confirmedOrders.length === 0) return "₹0";
                            const total = confirmedOrders.reduce((acc, order) => {
                              const val = parseFloat(order.value.replace('₹', '').replace(/,/g, ''));
                              return acc + (isNaN(val) ? 0 : val);
                            }, 0);
                            return `₹${Math.round(total / confirmedOrders.length).toLocaleString()}`;
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Based on {confirmedOrders.length} orders
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. Top Selling Products */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                        <CardDescription>Most popular items by order count</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={(() => {
                                const productCounts: Record<string, number> = {};
                                confirmedOrders.forEach(order => {
                                  const prod = order.product;
                                  productCounts[prod] = (productCounts[prod] || 0) + 1;
                                });
                                return Object.entries(productCounts)
                                  .map(([name, count]) => ({ name, count }))
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 5);
                              })()}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" allowDecimals={false} />
                              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                              <RechartsTooltip />
                              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 3. Order Statistics */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle>Order Statistics</CardTitle>
                        <CardDescription>Breakdown by order status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                          <div className="h-[250px] w-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={(() => {
                                    const stats = {
                                      Completed: confirmedOrders.filter(o => o.status === 'delivered' || o.status === 'Delivered').length,
                                      Pending: confirmedOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'Processing').length,
                                      Cancelled: confirmedOrders.filter(o => o.status === 'cancelled').length
                                    };
                                    // Ensure we have data to show, otherwise show a placeholder
                                    const data = [
                                      { name: 'Completed', value: stats.Completed, color: '#22c55e' },
                                      { name: 'Pending', value: stats.Pending, color: '#eab308' },
                                      { name: 'Cancelled', value: stats.Cancelled, color: '#ef4444' }
                                    ].filter(d => d.value > 0);

                                    if (data.length === 0) return [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
                                    return data;
                                  })()}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {/* We map colors in the data generation above, but need to apply them here */}
                                  {/* Since we can't easily map inside the Pie component props in this inline style without a separate variable, 
                                      we'll rely on the Cell component mapping. */}
                                  {(() => {
                                    const stats = {
                                      Completed: confirmedOrders.filter(o => o.status === 'delivered' || o.status === 'Delivered').length,
                                      Pending: confirmedOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'Processing').length,
                                      Cancelled: confirmedOrders.filter(o => o.status === 'cancelled').length
                                    };
                                    const data = [
                                      { name: 'Completed', value: stats.Completed, color: '#22c55e' },
                                      { name: 'Pending', value: stats.Pending, color: '#eab308' },
                                      { name: 'Cancelled', value: stats.Cancelled, color: '#ef4444' }
                                    ].filter(d => d.value > 0);
                                    if (data.length === 0) return <Cell key="nodata" fill="#e5e7eb" />;
                                    return data.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ));
                                  })()}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-4 w-full md:w-auto">
                            <div className="flex items-center justify-between min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">Completed</span>
                              </div>
                              <span className="font-bold">{confirmedOrders.filter(o => o.status === 'delivered' || o.status === 'Delivered').length}</span>
                            </div>
                            <div className="flex items-center justify-between min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600">Pending</span>
                              </div>
                              <span className="font-bold">{confirmedOrders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'Processing').length}</span>
                            </div>
                            <div className="flex items-center justify-between min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">Cancelled</span>
                              </div>
                              <span className="font-bold">{confirmedOrders.filter(o => o.status === 'cancelled').length}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 4. Customer Satisfaction */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Satisfaction</CardTitle>
                      <CardDescription>Based on vendor reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="text-center md:text-left">
                          <div className="text-5xl font-bold text-gray-900 mb-2">
                            {(() => {
                              const ratedOrders = confirmedOrders.filter(o => o.review?.rating);
                              if (ratedOrders.length === 0) return "0.0";
                              const sum = ratedOrders.reduce((acc, o) => acc + o.review.rating, 0);
                              return (sum / ratedOrders.length).toFixed(1);
                            })()}
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-5 h-5 ${star <= Math.round(
                                confirmedOrders.filter(o => o.review?.rating).reduce((acc, o) => acc + o.review.rating, 0) /
                                (confirmedOrders.filter(o => o.review?.rating).length || 1)
                              ) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }`} />
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">
                            Based on {confirmedOrders.filter(o => o.review).length} reviews
                          </p>
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const totalReviews = confirmedOrders.filter(o => o.review).length || 1; // Avoid div by 0
                            const count = confirmedOrders.filter(o => o.review?.rating === rating).length;
                            const percentage = (count / totalReviews) * 100;
                            return (
                              <div key={rating} className="flex items-center gap-4">
                                <span className="text-sm font-medium w-3">{rating}</span>
                                <Star className="w-4 h-4 text-gray-400" />
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dashboard" className="space-y-6">
                  {/* Welcome Section */}
                  <div className="bg-green-600 text-white rounded-lg p-6 shadow-lg">
                    <h2 className="text-3xl font-bold mb-2">Welcome back, {supplierData?.fullName || 'Supplier'}!</h2>
                    <p className="text-green-100">Here's what's happening with your business today.</p>
                  </div>

                  {/* Low Stock Warning in Dashboard */}
                  {groupRequests.some(p => parseInt(p.quantity) < 10) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <div>
                          <h3 className="font-bold text-red-800">Low Stock Warning</h3>
                          <p className="text-sm text-red-700">
                            {groupRequests.filter(p => parseInt(p.quantity) < 10).length} products are running low on stock.
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => setActiveTab("notifications")}>Check Now</Button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Orders */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{confirmedOrders.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {confirmedOrders.filter(o => o.status === 'pending').length} pending
                        </p>
                      </CardContent>
                    </Card>

                    {/* Total Products */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{groupRequests.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {groupRequests.length} active products
                        </p>
                      </CardContent>
                    </Card>

                    {/* Monthly Revenue */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">₹{confirmedOrders.reduce((acc, order) => {
                          const orderDate = new Date(order.createdAt);
                          const now = new Date();
                          if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                            const val = parseFloat(order.value.replace('₹', '').replace(/,/g, ''));
                            return acc + (isNaN(val) ? 0 : val);
                          }
                          return acc;
                        }, 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                          Current month
                        </p>
                      </CardContent>
                    </Card>

                    {/* Rating */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(() => {
                          const ratedOrders = confirmedOrders.filter(o => o.review?.rating);
                          if (ratedOrders.length === 0) return "N/A";
                          const sum = ratedOrders.reduce((acc, o) => acc + o.review.rating, 0);
                          return (sum / ratedOrders.length).toFixed(1);
                        })()}</div>
                        <p className="text-xs text-muted-foreground">
                          Average rating
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions & Recent Orders */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Manage your store efficiently</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button className="w-full justify-start" onClick={() => setShowGroupModal(true)}>
                          <Plus className="mr-2 h-4 w-4" /> Add New Product
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("group")}>
                          <Package className="mr-2 h-4 w-4" /> Check Stock
                        </Button>

                      </CardContent>
                    </Card>

                    {/* Recent Orders */}
                    <Card className="col-span-1 lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Latest orders from vendors</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {confirmedOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {order.image ? (
                                    <img src={order.image} alt={order.product} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{order.product}</p>
                                  <p className="text-sm text-gray-500">{order.customerName} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{order.value}</p>
                                <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                              </div>
                            </div>
                          ))}
                          {confirmedOrders.length === 0 && <p className="text-center text-gray-500">No recent orders</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
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
                        <div key={order.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="mb-3">
                            {order.image ? (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                                <img src={order.image} alt="Order" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                <Package className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* DEBUG: Show raw data if product is missing */}
                          {order.product === 'No Items Data' && (
                            <div className="text-xs text-red-500 mb-2 overflow-hidden">
                              <p>Missing Data Debug:</p>
                              <pre>{JSON.stringify(order.items, null, 2)}</pre>
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                {order.items && order.items.length > 0 ? (
                                  <div className="space-y-1 mb-2">
                                    {order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-baseline border-b border-gray-50 pb-1 last:border-0">
                                        <span className="font-semibold text-lg text-gray-900 truncate pr-2">{item.product?.name || 'Product'}</span>
                                        <span className="text-sm text-gray-600 whitespace-nowrap">x {item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <h3 className="font-semibold text-lg mb-1">{order.product}</h3>
                                )}

                                <div className="text-sm text-gray-500 mb-2">
                                  {order.type === 'group' ? 'Group Order' : 'Individual Order'}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{order.vendors} vendors</span>
                                  </div>
                                  <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="capitalize">
                                    {order.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div>
                                <div className="text-xl font-bold text-purple-600">{order.value}</div>
                                <div className="text-xs text-gray-500">Total Qty: {order.quantity}</div>
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                <span>Deliver {order.deliveryDate}</span>
                              </div>
                            </div>
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
                                      // Refresh orders using the main function
                                      fetchSupplierOrders();
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: `Failed to update status: ${err.message}`, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}


                            </div>
                          )}
                          {(order.status === 'Delivered' || order.status === 'delivered') && (
                            <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg font-medium text-center">
                              ✓ Delivered
                            </div>
                          )}

                          {/* Review Section */}
                          {order.review && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < order.review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                  />
                                ))}
                                <span className="text-sm font-medium ml-1">{order.review.rating}.0</span>
                              </div>
                              {order.review.comment && (
                                <p className="text-sm text-gray-600 italic">"{order.review.comment}"</p>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                - {order.review.vendor?.business_name || "Vendor"}
                              </div>
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
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <select
                        value={newGroup.category}
                        onChange={e => setNewGroup({ ...newGroup, category: e.target.value })}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains</option>
                        <option value="Spices">Spices</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Others">Others</option>
                      </select>
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