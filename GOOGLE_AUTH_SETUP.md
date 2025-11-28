# Google Authentication Integration Guide

## Overview
Your project now uses **Google OAuth authentication** through Supabase for both vendors and suppliers. The authentication system is fully integrated with your database schema.

## What Was Implemented

### 1. Database Schema
- Complete vendor-supplier marketplace schema applied to Supabase
- Tables: `vendors`, `suppliers`, `products`, `orders`, `order_items`, `product_groups`
- Row Level Security (RLS) policies enabled for all tables
- Proper foreign key relationships and indexes

### 2. Google OAuth Integration
- Configured Supabase client with Google OAuth support
- Added `VITE_GOOGLE_CLIENT_ID` to environment variables
- Created Google sign-in functions in `authService`
- Added "Sign in with Google" buttons to both vendor and supplier auth pages

### 3. Auth Flow Components
- **VendorAuth** (`/vendor/login`, `/vendor/signup`): Login/signup with email/password or Google
- **SupplierAuth** (`/supplier/login`, `/supplier/signup`): Login/signup with email/password or Google
- **AuthCallback** (`/auth/callback`): Handles OAuth redirect and routes users to appropriate dashboards
- **VendorProfileSetup** (`/vendor/profile-setup`): Creates/updates vendor profile in Supabase
- **SupplierProfileSetup** (`/supplier/profile-setup`): Creates/updates supplier profile in Supabase

### 4. Authentication Context
- Updated `AuthContext` to use Supabase Auth
- Proper session management and profile completion tracking
- Logout functionality integrated with Supabase

## How Authentication Works

### For New Users (Google OAuth):
1. User clicks "Sign in with Google" on vendor or supplier login page
2. User is redirected to Google OAuth consent screen
3. After consent, Google redirects to `/auth/callback`
4. Callback handler checks if user has a profile in the database
5. If no profile exists, redirects to profile setup page
6. If profile exists, redirects to appropriate dashboard

### For Existing Users (Email/Password):
1. User enters email and password
2. Supabase authenticates the credentials
3. User is redirected to dashboard if profile exists
4. Otherwise, redirected to profile setup

### Profile Setup:
- **Vendors**: Create profile with business name, address, phone, etc.
- **Suppliers**: Create profile with business details, GST, FSSAI license, etc.
- Data is stored in Supabase `vendors` or `suppliers` table
- Profile completion tracked in localStorage and AuthContext

## Important Configuration Notes

### Supabase Dashboard Setup Required:
To enable Google OAuth in production, you need to configure it in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your Google Client ID: `579674940239-3bne3stc4kajcgmn9vj7iu0tr38rlu44`
5. Add your Google Client Secret (from Google Cloud Console)
6. Configure redirect URLs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### Google Cloud Console Setup:
1. Go to Google Cloud Console
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (for development)

## Security Features

### Row Level Security (RLS):
- Vendors can only view/edit their own profiles and orders
- Suppliers can view all products but only edit their own
- Suppliers can view orders assigned to them or unassigned orders
- Product groups are visible to all but only manageable by creators

### Authentication Flow:
- PKCE flow enabled for enhanced security
- Session persistence in browser
- Auto-refresh tokens
- Secure session detection in URLs

## Testing the Integration

### Test User Flow:
1. Navigate to `/vendor/login` or `/supplier/login`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Fill out profile setup form
5. Access dashboard with authenticated session

### Test Email/Password Flow:
1. Navigate to vendor/supplier signup
2. Enter email and password
3. Complete profile setup
4. Login with same credentials

## Files Modified/Created

### New Files:
- `src/pages/auth/AuthCallback.tsx` - OAuth callback handler

### Modified Files:
- `.env` - Added Google Client ID
- `src/lib/supabase.ts` - Configured OAuth support
- `src/services/supabaseAuth.ts` - Added Google sign-in method
- `src/pages/auth/VendorAuth.tsx` - Added Google button
- `src/pages/auth/SupplierAuth.tsx` - Added Google button
- `src/pages/auth/VendorProfileSetup.tsx` - Updated to use Supabase
- `src/pages/auth/SupplierProfileSetup.tsx` - Updated to use Supabase
- `src/App.tsx` - Added callback route

### Database:
- Applied complete marketplace schema migration to Supabase

## Next Steps

1. **Configure Supabase Provider**: Enable Google OAuth in Supabase dashboard
2. **Test Authentication**: Try both Google and email/password flows
3. **Verify RLS Policies**: Ensure data access is properly restricted
4. **Add Email Verification** (optional): Enable in Supabase if needed
5. **Monitor Auth Issues**: Check Supabase logs for any authentication errors

## Troubleshooting

### "User authentication failed" error:
- Check that Supabase Google provider is enabled
- Verify redirect URLs are correctly configured
- Ensure Google Client ID matches in both .env and Supabase

### Profile not loading:
- Check browser console for errors
- Verify user has completed profile setup
- Ensure RLS policies allow user to read their profile

### OAuth redirect issues:
- Verify callback URL is correctly added in Google Cloud Console
- Check that `/auth/callback` route exists in App.tsx
- Ensure Supabase project URL is correct in .env

## Support

For issues related to:
- **Supabase Auth**: Check Supabase documentation and logs
- **Google OAuth**: Review Google Cloud Console credentials
- **Database Access**: Verify RLS policies in Supabase dashboard
