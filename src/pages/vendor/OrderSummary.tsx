import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Clock, Package, CreditCard, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const OrderSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { cart, supplier, total } = location.state || {};
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: "",
    area: "",
    landmark: "",
    preferredTime: "",
    contactPerson: "",
    mobile: "",
    notes: ""
  });

  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!deliveryDetails.address || !deliveryDetails.area || !deliveryDetails.contactPerson || !deliveryDetails.mobile) {
      toast({
        title: "Missing Information",
        description: "Please fill all required delivery details",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate order placement and payment
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Order Placed Successfully!",
        description: "Redirecting to payment...",
      });
      
      // Redirect to payment page
      navigate('/vendor/payment', {
        state: {
          orderId: `ORD${Date.now()}`,
          amount: total,
          supplier: supplier.name,
          items: cart,
          deliveryDetails
        }
      });
    }, 2000);
  };

  if (!cart || !supplier) {
    navigate('/vendor/dashboard');
    return null;
  }

  const deliveryFee = total > 1000 ? 0 : 50;
  const finalAmount = total + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Order Summary</h1>
              <p className="text-muted-foreground">Review your order and delivery details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Supplier Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                    <p className="text-muted-foreground">{supplier.businessName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      Delivery: 24 hours
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} {item.unit} × {item.quantity} kg
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
                <CardDescription>
                  Please provide accurate delivery information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Full name"
                      value={deliveryDetails.contactPerson}
                      onChange={(e) => setDeliveryDetails({...deliveryDetails, contactPerson: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={deliveryDetails.mobile}
                      onChange={(e) => setDeliveryDetails({...deliveryDetails, mobile: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="House/Shop number, street, locality"
                    value={deliveryDetails.address}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, address: e.target.value})}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Sector *</Label>
                    <Select value={deliveryDetails.area} onValueChange={(value) => setDeliveryDetails({...deliveryDetails, area: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplier.deliveryAreas.map((area: string) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      placeholder="Near XYZ mall, etc."
                      value={deliveryDetails.landmark}
                      onChange={(e) => setDeliveryDetails({...deliveryDetails, landmark: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Delivery Time</Label>
                    <Select value={deliveryDetails.preferredTime} onValueChange={(value) => setDeliveryDetails({...deliveryDetails, preferredTime: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                        <SelectItem value="evening">Evening (4 PM - 8 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special delivery instructions..."
                    value={deliveryDetails.notes}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, notes: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>₹{total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee === 0 && (
                    <p className="text-xs text-green-600">Free delivery on orders above ₹1000</p>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount</span>
                      <span>₹{finalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    variant="vendor" 
                    className="w-full" 
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : `Pay ₹${finalAmount}`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Secure payment via Razorpay
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Order Protection</h4>
                  <p className="text-xs text-blue-700">
                    Your payment is protected. Money will be released to supplier only after successful delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;