import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Star, TrendingUp, Zap } from 'lucide-react';

const PreviewWrapper = ({ 
  children, 
  isAuthenticated, 
  title, 
  description, 
  previewMode = 'blur', // 'blur', 'truncate', 'overlay', 'sample'
  upgradeMessage = 'Sign up for free to see full data',
  showSignupPrompt = true,
  className = ''
}) => {
  if (isAuthenticated) {
    return children;
  }

  const renderPreview = () => {
    switch (previewMode) {
      case 'blur':
        return (
          <div className="relative">
            <div className="filter blur-sm pointer-events-none">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg">
              <div className="text-center p-6">
                <Lock className="w-12 h-12 text-crypto-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-300 text-sm mb-4">{description}</p>
                <Link 
                  to="/signup" 
                  className="inline-flex items-center px-4 py-2 bg-crypto-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        );

      case 'overlay':
        return (
          <div className="relative">
            {children}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent h-1/2 rounded-b-lg">
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-sm text-slate-300 mb-2">{upgradeMessage}</p>
                <Link 
                  to="/signup" 
                  className="inline-flex items-center px-3 py-1.5 bg-crypto-blue hover:bg-blue-600 text-white text-sm rounded transition-colors"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Free Signup
                </Link>
              </div>
            </div>
          </div>
        );

      case 'sample':
        return (
          <div className="space-y-4">
            <div className="opacity-100">
              {children}
            </div>
            {showSignupPrompt && (
              <div className="bg-gradient-to-r from-crypto-blue/20 to-purple-600/20 border border-crypto-blue/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-crypto-blue" />
                      {title}
                    </h4>
                    <p className="text-slate-300 text-sm">{description}</p>
                  </div>
                  <Link 
                    to="/signup" 
                    className="px-4 py-2 bg-crypto-blue hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Get Full Access
                  </Link>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return children;
    }
  };

  return (
    <div className={className}>
      {renderPreview()}
    </div>
  );
};

export default PreviewWrapper;
