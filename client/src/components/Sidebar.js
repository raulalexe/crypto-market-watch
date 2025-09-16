import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  History, 
  Download, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  X,
  Settings,
  User,
  Calendar,
  Mail,
  DollarSign
} from 'lucide-react';
import { isAdmin as isAdminUser, isAuthenticated, hasProAccess, hasPremiumAccess } from '../utils/authUtils';

const Sidebar = ({ userData, isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/app',
      name: 'Market Dashboard',
      icon: BarChart3
    },
    {
      path: '/app/events',
      name: 'Upcoming Events',
      icon: Calendar
    },
    {
      path: '/app/prices',
      name: 'Crypto Prices',
      icon: DollarSign
    },
    {
      path: '/app/history',
      name: 'Historical Data',
      icon: History
    },
    {
      path: '/app/data-export',
      name: 'Data Export',
      icon: Download,
      requiresAuth: true,
      requiresPro: true
    },
    {
      path: '/app/advanced-export',
      name: 'Advanced Export',
      icon: Download,
      requiresAuth: true,
      requiresPro: true
    },
    {
      path: '/app/advanced-analytics',
      name: 'Advanced Analytics',
      icon: BarChart3,
      requiresAuth: true,
      requiresPro: true
    },
    {
      path: '/app/custom-alerts',
      name: 'Custom Alerts',
      icon: AlertTriangle,
      requiresAuth: true,
      requiresPro: true
    },
    {
      path: '/app/subscription',
      name: 'Subscription Plans',
      icon: CreditCard
    }
  ];

  // Admin-specific menu items
  const adminItems = [
    {
      path: '/app/admin',
      name: 'Admin Dashboard',
      icon: Settings,
      adminOnly: true
    },
    {
      path: '/app/alerts',
      name: 'Market Alerts',
      icon: AlertTriangle,
      adminOnly: true
    },
    {
      path: '/app/errors',
      name: 'Error Logs',
      icon: AlertTriangle,
      adminOnly: true
    }
  ];

  // Profile and contact items
  const profileItem = {
    path: '/app/profile',
    name: 'Profile',
    icon: User,
    requiresAuth: true
  };
  
  const contactItem = {
    path: '/app/contact',
    name: 'Contact',
    icon: Mail
  };

  // Check if user is admin using shared utility
  const isAdmin = isAdminUser(userData);

  // Handle navigation click (close mobile menu)
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-800 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{maxHeight: '100vh', overflowY: 'auto'}}>
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 md:hidden">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-crypto-blue" />
            <h1 className="text-xl font-bold">Crypto Market Watch</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {/* Regular Navigation Items */}
            {navItems.map((item) => {
              // Show auth required link for auth-required items if user is NOT authenticated (but not for admins)
              if (item.requiresAuth && !isAuthenticated(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to="/app/subscription"
                      onClick={handleNavClick}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.requiresPro && !hasProAccess(userData) && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Pro
                        </span>
                      )}
                    </Link>
                  </li>
                );
              }

              // Show upgrade link for auth-required items if user is authenticated but doesn't have pro access (but not for admins)
              if (item.requiresAuth && isAuthenticated(userData) && !hasProAccess(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to="/app/subscription"
                      onClick={handleNavClick}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.requiresPro && !hasProAccess(userData) && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          Pro
                        </span>
                      )}
                    </Link>
                  </li>
                );
              }

              // Show upgrade link for premium items if user doesn't have premium (but not for admins)
              if (item.requiresPremium && !hasPremiumAccess(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to="/app/subscription"
                      onClick={handleNavClick}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              }

              // Show upgrade link for pro items if user doesn't have pro access (but not for admins)
              if (item.requiresPro && !hasProAccess(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to="/app/subscription"
                      onClick={handleNavClick}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </div>
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Pro
                      </span>
                    </Link>
                  </li>
                );
              }

              // Show regular navigation for users who have access
              const IconComponent = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-crypto-blue text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.requiresPro && !hasProAccess(userData) && (
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Pro
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            
            {/* Admin Section */}
            {isAdmin && adminItems.length > 0 && (
              <>
                <li className="mt-8 pt-4 border-t border-gray-700">
                  <div className="px-4 py-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
                  </div>
                </li>
                {adminItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={handleNavClick}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-crypto-blue text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </>
            )}
            
            {/* Profile and Contact Section */}
            <li className="mt-8 pt-4 border-t border-gray-700">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</span>
              </div>
            </li>
            {/* Only show profile link if user is authenticated */}
            {isAuthenticated(userData) && (
              <li>
                <Link
                  to={profileItem.path}
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    location.pathname === profileItem.path
                      ? 'bg-crypto-blue text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <profileItem.icon className="w-5 h-5" />
                  <span>{profileItem.name}</span>
                </Link>
              </li>
            )}
            <li>
              <Link
                to={contactItem.path}
                onClick={handleNavClick}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  location.pathname === contactItem.path
                    ? 'bg-crypto-blue text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <contactItem.icon className="w-5 h-5" />
                <span>{contactItem.name}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;