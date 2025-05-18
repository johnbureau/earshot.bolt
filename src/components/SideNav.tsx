import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  LogOut,
  MessageSquare,
  Share2
} from 'lucide-react';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      href: '/dashboard',
    },
    {
      label: 'My Events',
      icon: <Calendar size={20} />,
      href: '/my-events',
    },
    {
      label: 'Chats',
      icon: <MessageSquare size={20} />,
      href: '/chats',
    },
    {
      label: 'Financials',
      icon: <DollarSign size={20} />,
      href: '/financials',
    },
    {
      label: 'Social',
      icon: <Share2 size={20} />,
      href: '/social',
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-30
          transform transition-transform duration-300 ease-in-out
          w-64 flex flex-col hidden lg:flex
        `}
      >
        {/* Navigation Items */}
        <div className="flex-grow px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg mb-1
                  transition-colors duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer with Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default SideNav;