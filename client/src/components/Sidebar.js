import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, BarChart3, History, Settings, Info, AlertTriangle, Download } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/' },
    { icon: History, label: 'Historical Data', href: '/history' },
    { icon: Download, label: 'Data Export', href: '/export' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: AlertTriangle, label: 'Error Logs', href: '/errors' },
    { icon: Info, label: 'About', href: '/about' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
        
        <nav className="p-4 pb-20">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    location.pathname === item.href
                      ? 'bg-crypto-blue text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
      <div className="mt-auto pt-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-2">Data Collection</h3>
          <p className="text-xs text-slate-300">
            Smart scheduling based on market hours
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default Sidebar;