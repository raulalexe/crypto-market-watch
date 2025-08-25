import React from 'react';
import { Menu, RefreshCw, TrendingUp } from 'lucide-react';

const Header = ({ onMenuClick, onRefreshClick, onAuthClick, onLogoutClick, loading, isAuthenticated }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-300" />
          </button>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-crypto-green" />
            <h1 className="text-xl font-bold text-white">Crypto Market Monitor</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <button
              onClick={onRefreshClick}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {isAuthenticated ? (
            <button
              onClick={onLogoutClick}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="px-4 py-2 bg-crypto-green text-black rounded-lg hover:bg-green-400 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;