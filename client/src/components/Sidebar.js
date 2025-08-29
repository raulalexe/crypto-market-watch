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
  MessageSquare,
  Calendar
} from 'lucide-react';
import { shouldShowUpgradePrompt, shouldShowPremiumUpgradePrompt, isAdmin as isAdminUser } from '../utils/authUtils';

const Sidebar = ({ userData, isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      name: 'Market Dashboard',
      icon: BarChart3
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: User,
      requiresAuth: true
    },
    {
      path: '/history',
      name: 'Historical Data',
      icon: History,
      requiresAuth: true
    },
    {
      path: '/advanced-analytics',
      name: 'Advanced Analytics',
      icon: BarChart3,
      requiresAuth: true,
      requiresPremium: true
    },
    {
      path: '/advanced-export',
      name: 'Advanced Export',
      icon: Download,
      requiresAuth: true,
      requiresPremium: true
    },
    {
      path: '/custom-alerts',
      name: 'Custom Alerts',
      icon: AlertTriangle,
      requiresAuth: true,
      requiresPremium: true
    },
    {
      path: '/data-export',
      name: 'Data Export',
      icon: Download,
      requiresAuth: true
    },
    {
      path: '/subscription',
      name: 'Subscription Plans',
      icon: CreditCard
    },
    {
      path: '/alerts',
      name: 'Market Alerts',
      icon: AlertTriangle,
      requiresAuth: true
    },
    {
      path: '/events',
      name: 'Upcoming Events',
      icon: Calendar,
      requiresAuth: true
    },

  ];

  // Add admin-specific menu items
  const adminItems = [
    {
      path: '/admin',
      name: 'Admin Dashboard',
      icon: Settings,
      adminOnly: true
    },
    {
      path: '/errors',
      name: 'Error Logs',
      icon: AlertTriangle,
      adminOnly: true
    }
  ];

  // Combine regular and admin items
  const allNavItems = [...navItems, ...adminItems];

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
      `}>
        {/* Mobile header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 md:hidden">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-crypto-blue" />
            <h1 className="text-xl font-bold">Crypto Market Monitor</h1>
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
            {allNavItems.map((item) => {
              // Skip admin-only items if user is not admin
              if (item.adminOnly && !isAdmin) {
                return null;
              }

                              // Show auth required link for auth-required items if user should see upgrade prompts (but not for admins)
              if (item.requiresAuth && shouldShowUpgradePrompt(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to={`/auth-required?feature=${encodeURIComponent(item.name)}&type=auth`}
                      onClick={handleNavClick}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              }

              // Show auth required link for premium items if user doesn't have premium (but not for admins)
              if (item.requiresPremium && shouldShowPremiumUpgradePrompt(userData) && !isAdmin) {
                return (
                  <li key={item.path}>
                    <Link
                      to={`/auth-required?feature=${encodeURIComponent(item.name)}&type=premium`}
                      onClick={handleNavClick}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
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
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-center text-sm text-gray-400">
                          <p>© 2024 Crypto Market Monitor</p>
              <p className="mt-1">v1.0.0</p>
              <div className="mt-3 space-y-1">
                <Link
                  to="/contact"
                  className="block text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center"
                  onClick={handleNavClick}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Contact Us
                </Link>
                <Link
                  to="/privacy"
                  className="block text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  onClick={handleNavClick}
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="block text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  onClick={handleNavClick}
                >
                  Terms & Conditions
                </Link>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;