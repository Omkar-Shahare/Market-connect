import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { vendorApi, ApiError } from "@/services";

const VendorProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setProfileCompleted } = useAuth();
  const [loading, setLoading] = useState(false);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    languagePreference: "",
    stallName: "",
    stallAddress: "",
    city: "",
    pincode: "",
    state: "",
    stallType: "",
    rawMaterialNeeds: [] as string[],
    preferredDeliveryTime: "",
    latitude: "",
    longitude: ""
  });

  useEffect(() => {
    console.log("VendorProfileSetup component mounted");

    const initializeProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("Current user:", user ? user.id : "No user");

      if (error || !user) {
        console.error("No authenticated user found");
        navigate("/vendor/login");
        return;
      }
    
      try {
        console.log("Fetching existing vendor profile for user ID:", user.id);
        const { data: existingProfile, error: profileError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          console.log("Existing vendor profile found:", existingProfile);
          setExistingProfileId(existingProfile.id);
          setIsEditMode(true);

          setFormData({
            fullName: existingProfile.owner_name || "",
            mobileNumber: existingProfile.phone || user.phone || "",
            languagePreference: "",
            stallName: existingProfile.business_name || "",
            stallAddress: existingProfile.address || "",
            city: existingProfile.city || "",
            pincode: existingProfile.pincode || "",
            state: existingProfile.state || "",
            stallType: existingProfile.business_type || "",
            rawMaterialNeeds: [],
            preferredDeliveryTime: "",
            latitude: "",
            longitude: ""
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
  }, [toast]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRawMaterialToggle = (material: string) => {
    setFormData(prev => ({
      ...prev,
      rawMaterialNeeds: prev.rawMaterialNeeds.includes(material)
        ? prev.rawMaterialNeeds.filter(item => item !== material)
        : [...prev.rawMaterialNeeds, material]
    }));
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          toast({
            title: "Location Detected",
            description: "Your location has been automatically detected.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not detect location. Please enter manually.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      { key: 'fullName', label: 'Full Name' },
      { key: 'mobileNumber', label: 'Mobile Number' },
      { key: 'stallAddress', label: 'Stall Address' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'state', label: 'State' },
      { key: 'stallType', label: 'Stall Type' },
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

      const profileData = {
        user_id: user.id,
        business_name: formData.stallName || formData.fullName + "'s Stall",
        owner_name: formData.fullName,
        phone: formData.mobileNumber,
        address: formData.stallAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        business_type: formData.stallType,
        gst_number: null
      };

      let result;
      if (isEditMode && existingProfileId) {
        console.log("Updating existing vendor profile");
        const { data, error } = await supabase
          .from('vendors')
          .update(profileData)
          .eq('id', existingProfileId)
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Updated!",
          description: "Your vendor profile has been updated successfully.",
        });
      } else {
        console.log("Creating new vendor profile");
        const { data, error } = await supabase
          .from('vendors')
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Created!",
          description: "Your vendor profile has been created successfully.",
        });
      }

      setProfileCompleted(true);
      navigate("/vendor/dashboard");
    } catch (error) {
      console.error('Error saving vendor profile:', error);
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

  const languages = ["Hindi", "Marathi", "English", "Gujarati", "Punjabi", "Bengali"];
  const states = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "Punjab", "West Bengal", "Uttar Pradesh"];
  const stallTypes = ["Chaat", "South Indian", "North Indian", "Chinese", "Fast Food", "Beverages", "Desserts", "Street Food", "Other"];
  const rawMaterials = ["Spices", "Oil", "Vegetables", "Grains", "Dairy", "Meat", "Fruits", "Flour", "Sugar", "Salt", "Herbs"];
  const deliveryTimes = ["Morning (6 AM - 12 PM)", "Afternoon (12 PM - 6 PM)", "Evening (6 PM - 12 AM)"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border-2 border-vendor/30">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-vendor rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {isEditMode ? 'Edit Your Vendor Profile' : 'Complete Your Vendor Profile'}
            </CardTitle>
            <CardDescription>
              {isEditMode 
                ? 'Update your business information and preferences' 
                : 'Help us understand your business better to provide personalized services'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vendor">Personal Details</h3>
                
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

                <div className="space-y-2">
                  <Label htmlFor="languagePreference">Language Preference *</Label>
                  <Select value={formData.languagePreference} onValueChange={(value) => handleInputChange("languagePreference", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preferred language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>{language}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vendor">Business Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="stallName">Stall Name (Optional)</Label>
                  <Input
                    id="stallName"
                    value={formData.stallName}
                    onChange={(e) => handleInputChange("stallName", e.target.value)}
                    placeholder="Enter your stall name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stallAddress">Stall Address *</Label>
                  <Input
                    id="stallAddress"
                    value={formData.stallAddress}
                    onChange={(e) => handleInputChange("stallAddress", e.target.value)}
                    placeholder="Street, Landmark, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stallType">Stall Type / Category *</Label>
                  <Select value={formData.stallType} onValueChange={(value) => handleInputChange("stallType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your stall type" />
                    </SelectTrigger>
                    <SelectContent>
                      {stallTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Raw Material Needs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vendor">Raw Material Needs *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rawMaterials.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={material}
                        checked={formData.rawMaterialNeeds.includes(material)}
                        onCheckedChange={() => handleRawMaterialToggle(material)}
                      />
                      <Label htmlFor={material} className="text-sm">{material}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vendor">Delivery Preferences</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredDeliveryTime">Preferred Delivery Time Slot *</Label>
                  <Select value={formData.preferredDeliveryTime} onValueChange={(value) => handleInputChange("preferredDeliveryTime", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred delivery time" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryTimes.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-vendor">Location (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange("latitude", e.target.value)}
                      placeholder="Auto-detect or enter manually"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange("longitude", e.target.value)}
                      placeholder="Auto-detect or enter manually"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocationDetect}
                  className="w-full"
                >
                  Auto-Detect Location
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="vendor"
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

export default VendorProfileSetup; 