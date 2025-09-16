import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Footer from './Footer';

const AuthRequired = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [, setUserData] = useState(null);
  
  const featureName = searchParams.get('feature') || 'this feature';
  const type = searchParams.get('type') || 'auth';
  const isPremium = type === 'premium';
  const isUpgrade = type === 'upgrade';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUserData(response.data);
      
      // If user is authenticated and has appropriate access, redirect them
      if (response.data) {
        const isAdmin = response.data.role === 'admin';
        const hasPremium = response.data.plan === 'premium' || isAdmin;
        const hasPro = response.data.plan === 'pro' || hasPremium;
        
        // For auth-required features, if user has Pro or higher, redirect to dashboard
        if (type === 'auth' && hasPro) {
          navigate('/app/');
          return;
        }
        
        // For upgrade-required features, if user has Pro or higher, redirect to dashboard
        if (type === 'upgrade' && hasPro) {
          navigate('/app/');
          return;
        }
        
        // For premium-required features, if user has Premium or is admin, redirect to dashboard
        if (type === 'premium' && hasPremium) {
          navigate('/app/');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        <Link 
          to="/app/"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Main content */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
          <div className="mb-6">
            {isPremium ? (
              <User className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
            ) : (
              <Lock className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold text-white mb-2">
              {isPremium ? 'Premium Feature' : isUpgrade ? 'Upgrade Required' : 'Authentication Required'}
            </h1>
            <p className="text-slate-400">
              {isPremium 
                ? `To access ${featureName}, you need a Premium+ subscription.`
                : isUpgrade
                ? `To access ${featureName}, you need to upgrade to Pro or higher.`
                : `To access ${featureName}, you must be logged in.`
              }
            </p>
          </div>

          <div className="space-y-4">
            {isPremium ? (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Premium+ Features Include:</h3>
                <ul className="text-sm text-slate-300 space-y-1 text-left">
                  <li>• Advanced Analytics & Portfolio Metrics</li>
                  <li>• Advanced Data Export (PDF, XML, scheduled)</li>
                  <li>• Custom Alert Thresholds</li>
                  <li>• Priority Notification Delivery</li>
                  <li>• White-label Options</li>
                  <li>• </li>
                </ul>
              </div>
            ) : isUpgrade ? (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Pro Features Include:</h3>
                <ul className="text-sm text-slate-300 space-y-1 text-left">
                  <li>• Real-time Market Alerts</li>
                  <li>• Email & Push Notifications</li>
                  <li>• Telegram Bot Integration</li>
                  <li>• Advanced Market Data</li>
                  <li>• Historical Data Access</li>
                  <li>• Data Export (CSV, JSON, Excel)</li>
                </ul>
              </div>
            ) : (
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Pro Features Include:</h3>
                <ul className="text-sm text-slate-300 space-y-1 text-left">
                  <li>• Real-time Market Alerts</li>
                  <li>• Email & Push Notifications</li>
                  <li>• Telegram Bot Integration</li>
                  <li>• Advanced Market Data</li>
                  <li>• Historical Data Access</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {isPremium ? (
                <Link
                  to="/app/contact"
                  className="flex-1 bg-crypto-blue text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Contact Sales
                </Link>
              ) : isUpgrade ? (
                <Link
                  to="/app/subscription"
                  className="flex-1 bg-crypto-blue text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Upgrade to Pro
                </Link>
              ) : (
                <>
                  <Link
                    to="/app?auth=login"
                    className="flex-1 bg-crypto-blue text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/app?auth=register"
                    className="flex-1 bg-slate-700 text-white py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors font-medium text-center"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {!isPremium && !isUpgrade && (
              <p className="text-xs text-slate-500 mt-4">
                Already have an account?{' '}
                <Link
                  to="/app?auth=login"
                  className="text-crypto-blue hover:text-blue-400"
                >
                  Sign in here
                </Link>
              </p>
            )}

            {/* Footer links */}
            <div className="mt-8 pt-4 border-t border-slate-700">
              <div className="flex justify-center space-x-4 text-xs text-slate-500">
                <Link 
                  to="/app/contact" 
                  className="hover:text-slate-300 transition-colors"
                >
                  Contact
                </Link>
                <Link 
                  to="/app/privacy" 
                  className="hover:text-slate-300 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  to="/app/terms" 
                  className="hover:text-slate-300 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequired;
