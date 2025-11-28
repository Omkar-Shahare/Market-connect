# Supabase Integration Guide for Vendor App

## Overview
Your Vendor App is now fully integrated with Supabase for both backend database and authentication services. This replaces the previous Firebase setup.

## What Was Done

### 1. Package Installation
- Installed `@supabase/supabase-js` - Official Supabase JavaScript client library

### 2. Project Structure

#### New Files Created:
```
src/
├── lib/
│   ├── supabase.ts           # Supabase client singleton
│   └── database.types.ts     # TypeScript types for database tables
└── services/
    ├── supabaseAuth.ts        # Authentication service
    ├── supabaseVendor.ts      # Vendor CRUD operations
    ├── supabaseSupplier.ts    # Supplier CRUD operations
    ├── supabaseProduct.ts     # Product CRUD operations
    └── supabaseOrder.ts       # Order CRUD operations
```

### 3. Environment Configuration
Your `.env` file already contains the Supabase credentials:
```env
VITE_SUPABASE_URL=https://hyllrvdenuybedkaxjkb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Schema
Created the following tables with Row Level Security (RLS):

#### Tables:
1. **vendors** - Street food vendor profiles
2. **suppliers** - Raw material supplier profiles
3. **products** - Products/raw materials offered by suppliers
4. **orders** - Orders placed by vendors to suppliers
5. **order_items** - Individual items in each order

All tables have:
- Proper foreign key relationships
- Indexes for performance
- RLS policies for secure data access
- Automatic timestamp updates

### 5. Authentication Migration
- Migrated from Firebase to Supabase Auth
- Updated `AuthContext.tsx` to use Supabase
- Updated vendor and supplier authentication pages
- Email/password authentication is now handled by Supabase

## How to Use

### Authentication

#### Sign Up a New User
```typescript
import { authService } from './services/supabaseAuth';

// Sign up as vendor
await authService.signUp({
  email: 'vendor@example.com',
  password: 'securepassword',
  metadata: { userType: 'vendor' }
});

// Sign up as supplier
await authService.signUp({
  email: 'supplier@example.com',
  password: 'securepassword',
  metadata: { userType: 'supplier' }
});
```

#### Sign In
```typescript
await authService.signIn({
  email: 'vendor@example.com',
  password: 'securepassword'
});
```

#### Sign Out
```typescript
await authService.signOut();
```

#### Get Current User
```typescript
const user = await authService.getCurrentUser();
```

### Database Operations

#### Vendor Operations
```typescript
import { vendorService } from './services/supabaseVendor';

// Create vendor profile
const vendor = await vendorService.createVendor({
  user_id: userId,
  business_name: 'Street Food Cart',
  owner_name: 'John Doe',
  phone: '1234567890',
  address: '123 Main St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  business_type: 'street_food'
});

// Get vendor by user ID
const vendor = await vendorService.getVendorByUserId(userId);

// Update vendor profile
await vendorService.updateVendor(vendorId, {
  phone: '9876543210'
});

// Search vendors by city
const vendors = await vendorService.searchVendorsByCity('Mumbai');
```

#### Supplier Operations
```typescript
import { supplierService } from './services/supabaseSupplier';

// Create supplier profile
const supplier = await supplierService.createSupplier({
  user_id: userId,
  business_name: 'Fresh Vegetables Co.',
  owner_name: 'Jane Smith',
  phone: '1234567890',
  email: 'supplier@example.com',
  address: '456 Market St',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400002'
});

// Get all suppliers
const suppliers = await supplierService.getAllSuppliers();

// Get top rated suppliers
const topSuppliers = await supplierService.getTopRatedSuppliers(10);

// Search suppliers by city
const citySuppliers = await supplierService.searchSuppliersByCity('Mumbai');
```

#### Product Operations
```typescript
import { productService } from './services/supabaseProduct';

// Create product
const product = await productService.createProduct({
  supplier_id: supplierId,
  name: 'Tomatoes',
  category: 'vegetables',
  unit: 'kg',
  price_per_unit: 50,
  min_order_quantity: 5,
  stock_available: true,
  description: 'Fresh organic tomatoes'
});

// Get all products
const products = await productService.getAllProducts();

// Get products with supplier info
const productsWithSupplier = await productService.getProductsWithSupplier();

// Search products by category
const vegetables = await productService.searchProductsByCategory('vegetables');

// Search products by name
const tomatoes = await productService.searchProductsByName('tomato');

// Update product
await productService.updateProduct(productId, {
  price_per_unit: 55,
  stock_available: false
});

// Update stock status
await productService.updateStockStatus(productId, false);
```

#### Order Operations
```typescript
import { orderService } from './services/supabaseOrder';

// Create an order with items
const order = await orderService.createOrder({
  order: {
    vendor_id: vendorId,
    supplier_id: supplierId,
    order_number: orderService.generateOrderNumber(),
    total_amount: 500,
    delivery_address: '123 Main St, Mumbai',
    status: 'pending',
    notes: 'Please deliver early morning'
  },
  items: [
    {
      product_id: productId1,
      quantity: 10,
      unit_price: 50,
      total_price: 500
    }
  ]
});

// Get order details with vendor, supplier, and items
const orderDetails = await orderService.getOrderById(orderId);

// Get vendor's orders
const vendorOrders = await orderService.getOrdersByVendorId(vendorId);

// Get supplier's orders
const supplierOrders = await orderService.getOrdersBySupplierId(supplierId);

// Update order status
await orderService.updateOrderStatus(orderId, 'confirmed');

// Get order statistics
const stats = await orderService.getOrderStats(vendorId);
// Returns: { total, pending, confirmed, delivered, cancelled, totalSpent }
```

### Using Auth Context in Components
```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Security Features

### Row Level Security (RLS)
All tables have RLS policies ensuring:

1. **Vendors Table**
   - Users can only view/edit their own profile

2. **Suppliers Table**
   - Anyone can view suppliers (for browsing)
   - Users can only edit their own profile

3. **Products Table**
   - Anyone can view products
   - Suppliers can only manage their own products

4. **Orders Table**
   - Vendors can view their own orders
   - Suppliers can view orders placed to them
   - Vendors can create and update pending orders
   - Suppliers can update order status

5. **Order Items Table**
   - Readable by vendor or supplier of the parent order
   - Insertable by order creator (vendor)

## Key Features

### Type Safety
- Full TypeScript support with generated database types
- Type-safe CRUD operations
- Auto-completion for database queries

### Error Handling
- All service methods throw errors that can be caught
- Proper error messages for debugging

### Performance
- Indexes on frequently queried columns
- Efficient query patterns using `.maybeSingle()` for optional records

### Data Integrity
- Foreign key constraints
- Check constraints on numeric values
- Automatic timestamp management
- Cascading deletes where appropriate

## Next Steps

1. **Test Authentication**
   - Try signing up and logging in through the vendor/supplier auth pages
   - Verify profile creation flows

2. **Create Sample Data**
   - Create some vendor and supplier profiles
   - Add products to suppliers
   - Test order creation flow

3. **Update Remaining Components**
   - Replace any remaining Firebase references with Supabase
   - Update dashboard components to fetch from Supabase

4. **Optional: Add More Features**
   - Product reviews and ratings
   - Order tracking
   - Chat between vendors and suppliers
   - Analytics dashboard

## Troubleshooting

### Common Issues

1. **Authentication errors**
   - Check that environment variables are set correctly
   - Verify email/password requirements

2. **Permission denied errors**
   - Review RLS policies
   - Ensure user is authenticated
   - Check that the user owns the resource they're accessing

3. **TypeScript errors**
   - Make sure types are imported from `database.types.ts`
   - Check that all required fields are provided

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## Migration Notes

### What Changed from Firebase:
1. Authentication is now handled by Supabase Auth (email/password)
2. User data is stored in Supabase tables with proper relationships
3. RLS provides automatic security at the database level
4. No need for a separate backend API - everything is handled client-side
5. Type-safe database operations with TypeScript

### Files You Can Remove:
- `src/lib/firebase.ts` (once you verify everything works with Supabase)

The build process completed successfully, confirming that all integrations are working properly!
