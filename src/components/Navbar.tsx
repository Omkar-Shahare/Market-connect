import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Menu, User, HelpCircle, LogOut, Home, BarChart3, Package, ShoppingCart, Bell } from "lucide-react";
import { vendorApi, VendorProfile } from "@/services/vendorApi";
import { supplierApi, SupplierProfile } from "@/services/supplierApi";

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
  const [userProfile, setUserProfile] = useState<VendorProfile | SupplierProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    return null;
  };

  const userType = getUserType();

  // Fetch user profile data from backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid || !userType) return;

      setProfileLoading(true);
      try {
        if (userType === 'vendor') {
          const response = await vendorApi.getByUserId(user.uid);
          setUserProfile(response.vendor);
        } else if (userType === 'supplier') {
          const response = await supplierApi.getByUserId(user.uid);
          setUserProfile(response.supplier);
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
  }, [user?.uid, userType]);

  // Get navigation items based on user type
  const getNavigationItems = () => {
    if (!user) return [];

    if (userType === 'vendor') {
      return [];
    }

    if (userType === 'supplier') {
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
    }
  };

  // Get display name from profile data
  const getDisplayName = () => {
    if (profileLoading) return "Loading...";
    if (userProfile?.fullName) {
      return userProfile.fullName;
    }
    if (user?.displayName) {
      return user.displayName;
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
            className="flex items-center gap-3 text-3xl font-bold text-black font-sans tracking-tight cursor-pointer hover:text-blue-600 transition-colors duration-300"
            style={{ fontFamily: 'Georgia, serif' }}
            onClick={() => navigate('/')}
          >
            <img
              src="/logo.jpg"
              alt="MarketConnect Logo"
              className="w-16 h-16 object-contain rounded-lg"
            />
            Market Connect
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-6">
              <Button
                variant="outline"
                className="bg-blue-600 text-white border-none hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-2 font-semibold"
                onClick={() => navigate('/about')}
              >
                About
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
                              {userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'User'}
                            </p>
                            {userProfile && (
                              <p className="text-xs text-gray-400 truncate">
                                {userProfile.city && userProfile.state ? `${userProfile.city}, ${userProfile.state}` : 'Location not set'}
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
                        {userProfile ? 'Edit Profile' : 'Complete Profile'}
                      </button>
                      <hr className="my-2" />
                      <button
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
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
                                {userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'User'}
                              </p>
                              {userProfile && (
                                <p className="text-xs text-gray-400 truncate">
                                  {userProfile.city && userProfile.state ? `${userProfile.city}, ${userProfile.state}` : 'Location not set'}
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
                          {userProfile ? 'Edit Profile' : 'Complete Profile'}
                        </button>
                        <hr className="my-2" />
                        <button
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
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
                          Home
                        </button>
                        <button
                          onClick={() => handleNavigation('/vendor/login')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Vendor Login
                        </button>
                        <button
                          onClick={() => handleNavigation('/supplier/login')}
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Supplier Login
                        </button>
                        <hr className="my-2" />
                        <button
                          className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => navigate('/about')}
                        >
                          <HelpCircle className="w-4 h-4 mr-3" />
                          About
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
