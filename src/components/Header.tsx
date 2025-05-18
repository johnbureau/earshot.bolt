import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, ChevronDown, Menu, X, LogOut } from 'lucide-react';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import NotificationsDropdown from './ui/NotificationsDropdown';

const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Public navigation items - always visible
  const publicNavItems = [
    { label: 'Events', href: '/events' },
    { label: 'Profiles', href: '/profiles' },
    { label: 'Places', href: '/places' },
  ];

  const authenticatedNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Events', href: '/my-events' },
    { label: 'Calendar', href: '/calendar' },
    { label: 'Financials', href: '/financials' },
    { label: 'Chats', href: '/chats' },
    { label: 'Profile', href: '/profile' },
  ];

  const getDisplayName = () => {
    if (!profile) return '';
    return profile.Name || profile.Email?.split('@')[0] || '';
  };

  const isLandingPage = location.pathname === '/';
  const isTransparent = isLandingPage && !isScrolled;
  const isMobile = window.innerWidth < 768;

  // Determine if we should use white text (on landing page, not scrolled, and mobile)
  const useWhiteNav = isLandingPage && !isScrolled && isMobile;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-200 bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom h-16">
        <div className="flex items-center justify-between h-full">
          <div className={`flex items-center ${user ? 'pl-3' : 'pl-0'}`}>
            {user && (
              <button
                className="lg:hidden -ml-4 mr-4 p-2 text-primary-600 hover:text-primary-800"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}

            <Link 
              to="/" 
              className="text-2xl font-bold text-primary-600"
            >
              Earshot
            </Link>

            {/* Navigation Tabs - Always visible */}
            <nav className="hidden md:flex ml-8 space-x-1">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    px-4 py-2 text-sm transition-colors relative
                    text-primary-600 hover:text-primary-800
                    ${location.pathname === item.href ? 'font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600' : ''}
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative">
                  <button
                    className={`relative p-2 ${useWhiteNav ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsProfileMenuOpen(false);
                    }}
                  >
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full"></span>
                  </button>

                  <NotificationsDropdown
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                  />
                </div>

                <div className="relative">
                  <button
                    className={`flex items-center space-x-3 p-2 rounded-full ${useWhiteNav ? 'text-white' : ''} hover:bg-gray-100`}
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationsOpen(false);
                    }}
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      fallback={getDisplayName()}
                      size="sm"
                    />
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {getDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {profile?.role}
                      </div>
                    </div>
                    <ChevronDown size={16} className={useWhiteNav ? 'text-white' : 'text-gray-600'} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/subscription"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Subscription
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-primary-600 border-primary-600 hover:bg-primary-600/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="accent" size="sm" className="text-primary-600 bg-accent-50 border-accent-500 hover:bg-accent-100">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Navigation Menu */}
      <div className={`
        fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="p-4 space-y-2">
          {user && authenticatedNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {user && <div className="border-t border-gray-200 my-2" />}
          {publicNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;