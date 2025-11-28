import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { supplierApi, ApiError } from "@/services";

const SupplierProfileSetup: React.FC = () => {
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
    businessName: "",
    businessAddress: "",
    city: "",
    pincode: "",
    state: "",
    businessType: "",
    supplyCapabilities: [] as string[],
    preferredDeliveryTime: "",
    latitude: "",
    longitude: "",
    // Additional Business Information
    gstNumber: "",
    licenseNumber: "",
    yearsInBusiness: "",
    employeeCount: "",
    // Additional Contact Information
    primaryEmail: "",
    whatsappBusiness: "",
    // Certifications
    foodSafetyLicense: "",
    organicCertification: "",
    isoCertification: "",
    exportLicense: ""
  });

  useEffect(() => {
    console.log("SupplierProfileSetup component mounted");

    const initializeProfile = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("Current user:", user ? user.id : "No user");

      if (error || !user) {
        console.error("No authenticated user found");
        navigate("/supplier/login");
        return;
      }

      try {
        console.log("Fetching existing supplier profile for user ID:", user.id);
        const { data: existingProfile, error: profileError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingProfile) {
          console.log("Existing supplier profile found:", existingProfile);
          setExistingProfileId(existingProfile.id);
          setIsEditMode(true);

          setFormData({
            fullName: existingProfile.owner_name || "",
            mobileNumber: existingProfile.phone || user.phone || "",
            languagePreference: "",
            businessName: existingProfile.business_name || "",
            businessAddress: existingProfile.address || "",
            city: existingProfile.city || "",
            pincode: existingProfile.pincode || "",
            state: existingProfile.state || "",
            businessType: "",
            supplyCapabilities: [],
            preferredDeliveryTime: "",
            latitude: "",
            longitude: "",
            gstNumber: existingProfile.gst_number || "",
            licenseNumber: existingProfile.fssai_license || "",
            yearsInBusiness: "",
            employeeCount: "",
            primaryEmail: existingProfile.email || "",
            whatsappBusiness: "",
            foodSafetyLicense: "",
            organicCertification: "",
            isoCertification: "",
            exportLicense: ""
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
          if (user.email) {
            setFormData(prev => ({ ...prev, primaryEmail: user.email }));
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

  const handleSupplyCapabilityToggle = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      supplyCapabilities: prev.supplyCapabilities.includes(capability)
        ? prev.supplyCapabilities.filter(item => item !== capability)
        : [...prev.supplyCapabilities, capability]
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
      { key: 'businessAddress', label: 'Business Address' },
      { key: 'city', label: 'City' },
      { key: 'pincode', label: 'Pincode' },
      { key: 'state', label: 'State' },
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
        business_name: formData.businessName || formData.fullName + "'s Business",
        owner_name: formData.fullName,
        phone: formData.mobileNumber,
        email: formData.primaryEmail || user.email || "",
        address: formData.businessAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        gst_number: formData.gstNumber || null,
        fssai_license: formData.licenseNumber || null,
        rating: 0,
        total_reviews: 0
      };

      let result;
      if (isEditMode && existingProfileId) {
        console.log("Updating existing supplier profile");
        const { data, error } = await supabase
          .from('suppliers')
          .update(profileData)
          .eq('id', existingProfileId)
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Updated!",
          description: "Your supplier profile has been updated successfully.",
        });
      } else {
        console.log("Creating new supplier profile");
        const { data, error } = await supabase
          .from('suppliers')
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: "Profile Created!",
          description: "Your supplier profile has been created successfully.",
        });
      }

      setProfileCompleted(true);
      navigate("/supplier/dashboard");
    } catch (error) {
      console.error('Error saving supplier profile:', error);
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
  const businessTypes = ["Wholesale", "Retail", "Manufacturing", "Distribution", "Import/Export", "Local Supplier", "Other"];
  const supplyCapabilities = ["Spices", "Oil", "Vegetables", "Grains", "Dairy", "Meat", "Fruits", "Flour", "Sugar", "Salt", "Herbs", "Packaging", "Equipment"];
  const deliveryTimes = ["Morning (6 AM - 12 PM)", "Afternoon (12 PM - 6 PM)", "Evening (6 PM - 12 AM)"];
  
  // Additional options for new fields
  const employeeCounts = ["1-10", "11-25", "25-50", "50-100", "100+"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border-2 border-supplier/30">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-supplier rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {isEditMode ? "Edit Your Supplier Profile" : "Complete Your Supplier Profile"}
            </CardTitle>
            <CardDescription>
              {isEditMode 
                ? "Update your business information to keep your profile current"
                : "Help us understand your business better to connect you with the right vendors"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-supplier">Personal Details</h3>
                
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
                <h3 className="text-lg font-semibold text-supplier">Business Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name (Optional)</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange("businessAddress", e.target.value)}
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
                  <Label htmlFor="businessType">Business Type / Category *</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange("businessType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                      placeholder="Enter GST number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsInBusiness">Years in Business</Label>
                    <Input
                      id="yearsInBusiness"
                      type="number"
                      value={formData.yearsInBusiness}
                      onChange={(e) => handleInputChange("yearsInBusiness", e.target.value)}
                      placeholder="Enter years in business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Select value={formData.employeeCount} onValueChange={(value) => handleInputChange("employeeCount", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee count" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeCounts.map((count) => (
                          <SelectItem key={count} value={count}>{count}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <h3 className="text-lg font-semibold text-supplier">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryEmail">Primary Email</Label>
                    <Input
                      id="primaryEmail"
                      type="email"
                      value={formData.primaryEmail}
                      onChange={(e) => handleInputChange("primaryEmail", e.target.value)}
                      placeholder="Enter primary email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="whatsappBusiness">WhatsApp Business</Label>
                    <Input
                      id="whatsappBusiness"
                      type="tel"
                      value={formData.whatsappBusiness}
                      onChange={(e) => handleInputChange("whatsappBusiness", e.target.value)}
                      placeholder="Enter WhatsApp business number"
                    />
                  </div>
                </div>
              </div>

              {/* Supply Capabilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-supplier">Supply Capabilities *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supplyCapabilities.map((capability) => (
                    <div key={capability} className="flex items-center space-x-2">
                      <Checkbox
                        id={capability}
                        checked={formData.supplyCapabilities.includes(capability)}
                        onCheckedChange={() => handleSupplyCapabilityToggle(capability)}
                      />
                      <Label htmlFor={capability} className="text-sm">{capability}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-supplier">Delivery Preferences</h3>
                
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

              {/* Certifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-supplier">Certifications (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foodSafetyLicense">Food Safety License</Label>
                    <Input
                      id="foodSafetyLicense"
                      value={formData.foodSafetyLicense}
                      onChange={(e) => handleInputChange("foodSafetyLicense", e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organicCertification">Organic Certification</Label>
                    <Input
                      id="organicCertification"
                      value={formData.organicCertification}
                      onChange={(e) => handleInputChange("organicCertification", e.target.value)}
                      placeholder="Enter certificate number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isoCertification">ISO Certification</Label>
                    <Input
                      id="isoCertification"
                      value={formData.isoCertification}
                      onChange={(e) => handleInputChange("isoCertification", e.target.value)}
                      placeholder="e.g., ISO 22000:2018"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exportLicense">Export License</Label>
                    <Input
                      id="exportLicense"
                      value={formData.exportLicense}
                      onChange={(e) => handleInputChange("exportLicense", e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-supplier">Location (Optional)</h3>
                
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
                variant="supplier"
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

export default SupplierProfileSetup;