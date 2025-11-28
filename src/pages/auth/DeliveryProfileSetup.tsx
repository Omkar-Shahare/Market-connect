import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck } from "lucide-react"; // Using Truck icon
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
// import { supplierApi, ApiError } from "@/services"; // This might not be needed or needs to be deliveryApi

const DeliveryProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setProfileCompleted } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    city: "",
    pincode: "",
    vehicleType: "",
    vehicleNumber: "",
    drivingLicense: ""
  });

  useEffect(() => {
    console.log("DeliveryProfileSetup component mounted");

    const initializeProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("Current user:", user ? user.id : "No user");

      if (error || !user) {
        console.error("No authenticated user found");
        navigate("/delivery/login");
        return;
      }

      try {
        console.log("Fetching existing delivery partner profile for user ID:", user.id);
        // ASSUMPTION: You have a table named 'delivery_partners'
        const { data: existingProfile, error: profileError } = await supabase
          .from('delivery_partners') // Changed table
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          console.log("Existing delivery partner profile found:", existingProfile);
          setExistingProfileId(existingProfile.id);
          setIsEditMode(true);

          setFormData({
            fullName: existingProfile.full_name || "",
            mobileNumber: existingProfile.phone || user.phone || "",
            city: existingProfile.city || "",
            pincode: existingProfile.pincode || "",
            vehicleType: existingProfile.vehicle_type || "",
            vehicleNumber: existingProfile.vehicle_number || "",
            drivingLicense: existingProfile.license_number || ""
          });

          toast({
            title: "Profile Loaded",
            description: "Your existing profile data has been loaded for editing.",
          });
        } else {
          console.log("No existing profile found");
          if (user.phone) {
            setFormData(prev => ({ ...prev, mobileNumber: user.phone }));
          }
          if (user.user_metadata?.name || user.user_metadata?.full_name) {
            setFormData(prev => ({
              ...prev,
              fullName: user.user_metadata.name || user.user_metadata.full_name
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    initializeProfile();
  }, [toast, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'mobileNumber', label: 'Mobile Number' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'vehicleType', label: 'Vehicle Type' },
      { key: 'vehicleNumber', label: 'Vehicle Number' },
      { key: 'drivingLicense', label: 'Driving License' },
    ];
    const missing = requiredFields.filter(f => !formData[f.key]);
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill: ${missing.map(f => f.label).join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("No authenticated user found");
      }

      // ASSUMPTION: 'delivery_partners' table columns
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        phone: formData.mobileNumber,
        city: formData.city,
        pincode: formData.pincode,
        vehicle_type: formData.vehicleType,
        vehicle_number: formData.vehicleNumber,
        license_number: formData.drivingLicense,
        is_active: true, // Default to active
        rating: 0,
        total_reviews: 0
      };

      let result;
      if (isEditMode && existingProfileId) {
        console.log("Updating existing delivery partner profile");
        const { data, error } = await supabase
          .from('delivery_partners') // Changed table
          .update(profileData)
          .eq('id', existingProfileId)
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Updated!",
          description: "Your delivery profile has been updated successfully.",
        });
      } else {
        console.log("Creating new delivery partner profile");
        const { data, error } = await supabase
          .from('delivery_partners') // Changed table
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Created!",
          description: "Your delivery profile has been created successfully.",
        });
      }

      setProfileCompleted(true);
      navigate("/delivery/dashboard"); // Navigate to delivery dashboard
    } catch (error) {
      console.error('Error saving delivery profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error
          ? error.message
          : "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const vehicleTypes = ["Bike", "Scooter", "E-Rickshaw", "Auto-Rickshaw", "Van", "Small Truck"];

  return (
    // Using an orange/yellow gradient theme
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Using 'border-delivery/30' */}
        <Card className="shadow-xl border-2 border-delivery/30">
          <CardHeader className="text-center pb-4">
            {/* Using 'bg-gradient-delivery' */}
            <div className="w-16 h-16 bg-gradient-delivery rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {isEditMode ? "Edit Your Delivery Profile" : "Complete Your Delivery Profile"}
            </CardTitle>
            <CardDescription>
              {isEditMode 
                ? "Update your information to keep your profile current"
                : "Provide your details to start accepting delivery jobs"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-delivery">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-delivery">Operating Area</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange("pincode", e.target.value)}
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-delivery">Vehicle & License Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange("vehicleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Registration Number *</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => handleInputChange("vehicleNumber", e.target.value)}
                      placeholder="e.g., MH 12 AB 3456"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="drivingLicense">Driving License Number *</Label>
                    <Input
                      id="drivingLicense"
                      value={formData.drivingLicense}
                      onChange={(e) => handleInputChange("drivingLicense", e.target.value)}
                      placeholder="Enter DL number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="delivery" // Use delivery variant
                className="w-full"
                disabled={loading}
              >
                {loading 
                  ? (isEditMode ? "Updating profile..." : "Setting up profile...") 
                  : (isEditMode ? "Update Profile" : "Complete Profile Setup")
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryProfileSetup;