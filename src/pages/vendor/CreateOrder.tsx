import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Trash2, User, Calendar, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  preferredPrice: number;
  unit: string;
}

const CreateOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only individual order is supported now
  const orderType = "individual";
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", name: "", quantity: 0, preferredPrice: 0, unit: "kg" }
  ]);
  
  const [orderDetails, setOrderDetails] = useState({
    deliveryLocation: "",
    area: "",
    deadline: "",
    notes: "",
    contactPerson: "",
    mobile: ""
  });

  const [loading, setLoading] = useState(false);

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 0,
      preferredPrice: 0,
      unit: "kg"
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    // Validation
    const hasEmptyItems = items.some(item => !item.name || item.quantity <= 0 || item.preferredPrice <= 0);
    if (hasEmptyItems) {
      toast({
        title: "Incomplete Items",
        description: "Please fill all item details",
        variant: "destructive"
      });
      return;
    }

    if (!orderDetails.deliveryLocation || !orderDetails.area || !orderDetails.deadline || !orderDetails.contactPerson || !orderDetails.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    // Redirect to payment flow instead of creating order directly
    toast({
      title: "Redirecting to Payment",
      description: "Please complete payment to confirm your order.",
    });
    
    // Navigate to dashboard where payment flow will handle order creation
    navigate('/vendor/dashboard');
  };

  const areas = ["Sector 15", "Sector 16", "Sector 17", "Sector 18", "Sector 22", "Sector 25"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/vendor/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Order</h1>
              <p className="text-muted-foreground">Submit your requirements to suppliers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Type Selection (Individual Only) */}
          <Card>
            <CardHeader>
              <CardTitle>Order Type</CardTitle>
              <CardDescription>
                Only individual orders are supported. Direct order for immediate delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-1 gap-4">
                <Card className="border-2 border-vendor bg-vendor/5">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-8 h-8 text-vendor" />
                      <div>
                        <h3 className="font-semibold">Individual Order</h3>
                        <p className="text-sm text-muted-foreground">
                          Direct order for immediate delivery
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order Items</CardTitle>
                  <CardDescription>
                    Add items you need with quantities and preferred prices
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <Card key={item.id} className="border-2 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${item.id}`}>Product Name *</Label>
                        <Input
                          id={`name-${item.id}`}
                          placeholder="e.g., Tomatoes"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${item.id}`}>Quantity *</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`quantity-${item.id}`}
                            type="number"
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                            required
                          />
                          <Select value={item.unit} onValueChange={(value) => updateItem(item.id, "unit", value)}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="ton">ton</SelectItem>
                              <SelectItem value="box">box</SelectItem>
                              <SelectItem value="piece">pc</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${item.id}`}>Preferred Price *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            id={`price-${item.id}`}
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            value={item.preferredPrice || ""}
                            onChange={(e) => updateItem(item.id, "preferredPrice", parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Total Estimate</Label>
                        <div className="h-10 flex items-center px-3 bg-gray-50 rounded-md border">
                          <span className="font-medium">
                            ₹{(item.quantity * item.preferredPrice) || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery & Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Your name"
                    value={orderDetails.contactPerson}
                    onChange={(e) => setOrderDetails({...orderDetails, contactPerson: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={orderDetails.mobile}
                    onChange={(e) => setOrderDetails({...orderDetails, mobile: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryLocation">Delivery Address *</Label>
                <Textarea
                  id="deliveryLocation"
                  placeholder="Complete delivery address with landmarks"
                  value={orderDetails.deliveryLocation}
                  onChange={(e) => setOrderDetails({...orderDetails, deliveryLocation: e.target.value})}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area/Sector *</Label>
                  <Select value={orderDetails.area} onValueChange={(value) => setOrderDetails({...orderDetails, area: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your area" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Required By *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={orderDetails.deadline}
                    onChange={(e) => setOrderDetails({...orderDetails, deadline: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific requirements, quality preferences, etc."
                  value={orderDetails.notes}
                  onChange={(e) => setOrderDetails({...orderDetails, notes: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/vendor/dashboard')}>
              Cancel
            </Button>
            <Button 
              variant="vendor" 
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
            >
              {loading ? "Creating Order..." : "Create Individual Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;