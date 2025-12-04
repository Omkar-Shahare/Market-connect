import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Menu, User, HelpCircle, LogOut, Home, BarChart3, Package, ShoppingCart, Bell, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { vendorApi, VendorProfile } from "@/services/vendorApi";
import { supplierApi, SupplierProfile } from "@/services/supplierApi";
import { supabase } from "@/lib/supabase";

// Define DeliveryProfile locally since we don't have a service file yet
interface DeliveryProfile {
  id: string;
  user_id: string;
  full_name: string;
  city: string;
  // Add other fields if needed
}

// Props interface
interface NavbarProps {
  notificationCount?: number;
  onNotificationClick?: () => void;
}

const Navbar = ({ notificationCount, onNotificationClick }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<VendorProfile | SupplierProfile | DeliveryProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowHamburgerMenu(false);
      }
    };

    if (showHamburgerMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHamburgerMenu]);

  // Determine user type based on current route
  const getUserType = () => {
    if (location.pathname.startsWith('/vendor')) return 'vendor';
    if (location.pathname.startsWith('/supplier')) return 'supplier';
    if (location.pathname.startsWith('/delivery')) return 'delivery';
    return null;
  };

  const userType = getUserType();

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id || !userType) return;

      setProfileLoading(true);
      try {
        if (userType === 'vendor') {
          const response = await vendorApi.getByUserId(user.id);
          setUserProfile(response.vendor);
        } else if (userType === 'supplier') {
          const response = await supplierApi.getByUserId(user.id);
          setUserProfile(response.supplier);
        } else if (userType === 'delivery') {
          const { data, error } = await supabase
            .from('delivery_partners')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          setUserProfile(data as DeliveryProfile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Profile might not exist yet, which is fine
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id, userType]);

  // Get navigation items based on user type
  const getNavigationItems = () => {
    if (!user) return [];

    if (userType === 'vendor') {
      return [];
    }

    if (userType === 'supplier') {
      return [];
    }

    if (userType === 'delivery') {
      return [];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setShowHamburgerMenu(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowHamburgerMenu(false);
  };

  const handleProfileClick = () => {
    setShowHamburgerMenu(false);
    // Navigate to appropriate profile page or trigger profile edit modal
    if (userType === 'vendor') {
      navigate('/vendor/profile-setup');
    } else if (userType === 'supplier') {
      navigate('/supplier/profile-setup');
    } else if (userType === 'delivery') {
      navigate('/delivery/profile-setup');
    }
  };

  // Get display name from profile data
  const getDisplayName = () => {
    if (profileLoading) return "Loading...";
    if ('fullName' in userProfile) {
      return userProfile.fullName;
    }
    // Check for full_name (DeliveryProfile uses snake_case)
    if ((userProfile as any)?.full_name) {
      return (userProfile as any).full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  // Get profile greeting text
  const getProfileGreeting = () => {
    const name = getDisplayName();
    if (name === "Loading...") return name;
    return `${name}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="relative w-12 h-12 overflow-hidden rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 flex items-center justify-center">
              <img
                src="/logo-new.jpg"
                alt="MarketConnect Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-green-600 group-hover:to-blue-600 transition-all duration-300">
              Market Connect
            </span>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-700 hover:text-blue-600">
                    <Globe className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('hi')}>
                    हिंदी (Hindi)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('mr')}>
                    मराठी (Marathi)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="bg-blue-600 text-white border-none hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-2 font-semibold"
                onClick={() => navigate('/about')}
              >
                {t('about')}
              </Button>

              {/* Notification Bell for Supplier */}
              {userType === 'supplier' && onNotificationClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-700 hover:text-blue-600"
                  onClick={onNotificationClick}
                >
                  <Bell className="h-6 w-6" />
                  {notificationCount !== undefined && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Desktop Hamburger Menu for authenticated users */}
              {user && (
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-700 hover:text-blue-600"
                    onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>

                  {showHamburgerMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Profile Header */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getProfileGreeting()}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {userType === 'delivery' ? 'Delivery Partner' : (userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'User')}
                            </p>
                            {userProfile && (
                              <p className="text-xs text-gray-400 truncate">
                                {userType === 'delivery'
                                  ? (userProfile as DeliveryProfile).city
                                  : (userProfile as any).city && (userProfile as any).state
                                    ? `${(userProfile as any).city}, ${(userProfile as any).state}`
                                    : t('location_not_set')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleProfileClick}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <User className="w-4 h-4 mr-3" />
                        {userProfile ? t('edit_profile') : t('complete_profile')}
                      </button>
                      <hr className="my-2" />
                      <button
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <div className="flex items-center gap-2">
              {/* Notification Bell for Supplier Mobile */}
              {userType === 'supplier' && onNotificationClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-700 hover:text-blue-600"
                  onClick={onNotificationClick}
                >
                  <Bell className="h-6 w-6" />
                  {notificationCount !== undefined && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Button>
              )}

              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 hover:text-blue-600"
                  onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>

                {showHamburgerMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {user && (
                      <>
                        {/* User Profile Header for Mobile */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getProfileGreeting()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {userType === 'delivery' ? 'Delivery Partner' : (userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'User')}
                              </p>
                              {userProfile && (
                                <p className="text-xs text-gray-400 truncate">
                                  {userType === 'delivery'
                                    ? (userProfile as DeliveryProfile).city
                                    : (userProfile as any).city && (userProfile as any).state
                                      ? `${(userProfile as any).city}, ${(userProfile as any).state}`
                                      : t('location_not_set')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {navigationItems.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <item.icon className="w-4 h-4 mr-3" />
                            {item.label}
                          </button>
                        ))}
                        <hr className="my-2" />
                        <button
                          onClick={handleProfileClick}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          {userProfile ? t('edit_profile') : t('complete_profile')}
                        </button>
                        <hr className="my-2" />
                        <button
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          {t('logout')}
                        </button>
                      </>
                    )}

                    {!user && (
                      <>
                        <button
                          onClick={() => handleNavigation('/')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Home className="w-4 h-4 mr-3" />
                          {t('home')}
                        </button>
                        <button
                          onClick={() => handleNavigation('/vendor/login')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          {t('vendor_login')}
                        </button>
                        <button
                          onClick={() => handleNavigation('/supplier/login')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          {t('supplier_login')}
                        </button>
                        <button
                          onClick={() => handleNavigation('/delivery/login')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Delivery Partner Login
                        </button>
                        <hr className="my-2" />
                        <button
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => navigate('/about')}
                        >
                          <HelpCircle className="w-4 h-4 mr-3" />
                          {t('about')}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
