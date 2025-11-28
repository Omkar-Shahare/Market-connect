import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, MapPin, Clock, Star, ShoppingCart, Plus, Minus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  minQty: number;
}

const SupplierDetails = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mock supplier data
  const supplier = {
    id: "1",
    name: "Fresh Foods Co.",
    businessName: "Fresh Foods Private Limited",
    rating: 4.8,
    reviews: 156,
    deliveryAreas: ["Sector 15", "Sector 16", "Sector 17", "Sector 22"],
    description: "Premium quality fresh vegetables and fruits supplier with 15+ years experience",
    products: [
      {
        id: "1",
        name: "Fresh Tomatoes",
        price: 25,
        unit: "per kg",
        minQty: 10,
        maxQty: 500,
        inStock: true,
        image: "/api/placeholder/150/150",
        description: "Farm fresh tomatoes, Grade A quality"
      },
      {
        id: "2", 
        name: "Red Onions",
        price: 18,
        unit: "per kg",
        minQty: 20,
        maxQty: 300,
        inStock: true,
        image: "/api/placeholder/150/150",
        description: "Premium red onions, good for storage"
      },
      {
        id: "3",
        name: "Green Capsicum",
        price: 35,
        unit: "per kg", 
        minQty: 5,
        maxQty: 100,
        inStock: true,
        image: "/api/placeholder/150/150",
        description: "Fresh green bell peppers"
      },
      {
        id: "4",
        name: "Potatoes",
        price: 15,
        unit: "per kg",
        minQty: 25,
        maxQty: 1000,
        inStock: false,
        image: "/api/placeholder/150/150",
        description: "Currently out of stock"
      }
    ]
  };

  const addToCart = (product: any, quantity: number) => {
    if (quantity < product.minQty) {
      toast({
        title: "Minimum quantity not met",
        description: `Minimum order quantity is ${product.minQty} kg`,
        variant: "destructive"
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        unit: product.unit,
        minQty: product.minQty
      }]);
    }

    toast({
      title: "Added to cart",
      description: `${quantity} kg ${product.name} added to cart`,
    });
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const ProductCard = ({ product }: { product: any }) => {
    const [quantity, setQuantity] = useState(product.minQty);
    const cartItem = cart.find(item => item.id === product.id);

    return (
      <Card className={`${!product.inStock ? 'opacity-60' : 'hover:shadow-lg'} transition-all duration-300`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                {!product.inStock && (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                <span className="text-muted-foreground">{product.unit}</span>
                <span className="text-sm text-muted-foreground">
                  Min: {product.minQty} kg
                </span>
              </div>

              {product.inStock && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`qty-${product.id}`} className="text-sm">Qty:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setQuantity(Math.max(product.minQty, quantity - 5))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        id={`qty-${product.id}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(product.minQty, parseInt(e.target.value) || product.minQty))}
                        className="w-20 h-8 text-center"
                        min={product.minQty}
                        max={product.maxQty}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setQuantity(Math.min(product.maxQty, quantity + 5))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                  
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => addToCart(product, quantity)}
                    className="ml-auto"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart - ₹{quantity * product.price}
                  </Button>
                </div>
              )}

              {cartItem && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">
                      In cart: {cartItem.quantity} kg
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(product.id, cartItem.quantity - 5)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium">{cartItem.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={() => updateCartQuantity(product.id, cartItem.quantity + 5)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={() => navigate('/vendor/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{supplier.name}</h1>
              <p className="text-muted-foreground mb-2">{supplier.businessName}</p>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{supplier.rating}</span>
                  <span className="text-muted-foreground">({supplier.reviews} reviews)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Delivers to: </span>
                {supplier.deliveryAreas.slice(0, 3).map((area, index) => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {supplier.deliveryAreas.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{supplier.deliveryAreas.length - 3} more
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground max-w-2xl">{supplier.description}</p>
            </div>

            {cart.length > 0 && (
              <Card className="w-80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart ({cart.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span>{item.name}</span>
                        <span>{item.quantity} kg - ₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-primary">₹{getTotalAmount()}</span>
                    </div>
                    <Button 
                      variant="vendor" 
                      className="w-full"
                      onClick={() => navigate('/vendor/order-summary', { 
                        state: { cart, supplier, total: getTotalAmount() }
                      })}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Available Products</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Usually delivers within 24 hours
          </div>
        </div>

        <div className="grid gap-4">
          {supplier.products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetails;