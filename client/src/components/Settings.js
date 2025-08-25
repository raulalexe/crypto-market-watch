import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, CreditCard, Shield, Bell, Database, Key } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('preferences');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Check auth status periodically to stay in sync
    const interval = setInterval(checkAuthStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    
    // Set auth header for API calls
    if (authenticated) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get('/api/subscription');
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSave = async (section) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`${section} settings saved successfully!`);
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = isAuthenticated ? [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Access', icon: Key },
    { id: 'data', label: 'Data Preferences', icon: Database }
  ] : [
    { id: 'preferences', label: 'Preferences', icon: User },
    { id: 'data', label: 'Data Preferences', icon: Database }
  ];

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Display Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue">
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Interface Options</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Show advanced metrics</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Auto-refresh data</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" />
            <span className="text-slate-300">Show price alerts</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Save preferences locally</span>
          </label>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Sign In for More Features</h4>
          <p className="text-slate-400 text-sm mb-3">
            Create an account to access subscription management, API keys, and advanced settings.
          </p>
          <button 
            onClick={() => window.location.href = '/#login'}
            className="px-4 py-2 bg-crypto-green text-black rounded-lg hover:bg-green-400 transition-colors"
          >
            Sign In / Sign Up
          </button>
        </div>
      )}

      <button
        onClick={() => handleSave('Preferences')}
        disabled={loading}
        className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="Your Name"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Receive email updates</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Show advanced metrics</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" />
            <span className="text-slate-300">Enable dark mode only</span>
          </label>
        </div>
      </div>

      <button
        onClick={() => handleSave('Profile')}
        disabled={loading}
        className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Current Subscription</h3>
        {subscriptionStatus ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">
                  {subscriptionStatus.planName || 'Free Plan'}
                </h4>
                <p className="text-slate-400 text-sm">
                  Status: <span className="text-crypto-green">{subscriptionStatus.status}</span>
                </p>
                {subscriptionStatus.currentPeriodEnd && (
                  <p className="text-slate-400 text-sm">
                    Renews: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscriptionStatus.plan !== 'free' && (
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-400">Loading subscription status...</p>
        )}
      </div>

      {subscriptionStatus?.plan !== 'free' && (
        <>
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Billing Information</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">Payment Method</p>
              <p className="text-white">•••• •••• •••• 4242</p>
              <p className="text-slate-400 text-sm">Expires 12/25</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Billing History</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">Pro Plan - Monthly</p>
                  <p className="text-slate-400 text-sm">March 1, 2024</p>
                </div>
                <span className="text-crypto-green">$29.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">Pro Plan - Monthly</p>
                  <p className="text-slate-400 text-sm">February 1, 2024</p>
                </div>
                <span className="text-crypto-green">$29.00</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Market alerts</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" defaultChecked />
            <span className="text-slate-300">Price movements</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" />
            <span className="text-slate-300">Weekly reports</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-3" />
            <span className="text-slate-300">News updates</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Alert Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Price Change %</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="5"
              defaultValue="5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Volume Spike %</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="50"
              defaultValue="50"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => handleSave('Notification')}
        disabled={loading}
        className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Notifications'}
      </button>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">2FA Status</p>
              <p className="text-slate-400 text-sm">Not enabled</p>
            </div>
            <button className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => handleSave('Security')}
        disabled={loading}
        className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Update Security'}
      </button>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">API Access</h3>
        {subscriptionStatus?.plan === 'free' ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-slate-400 mb-3">API access requires a Pro or Premium subscription.</p>
            <button className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                  value="sk_test_1234567890abcdef"
                  readOnly
                />
                <button className="ml-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors">
                  Copy
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Usage</label>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">Calls today:</span>
                  <span className="text-white">245 / 1,000</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-crypto-blue h-2 rounded-full" style={{ width: '24.5%' }}></div>
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Regenerate API Key
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Data Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Default Currency</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Zone</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue">
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="GMT">GMT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data Refresh Interval</label>
            <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue">
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
              <option value="900">15 minutes</option>
              <option value="3600" selected>1 hour (automatic)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Data Export</h3>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Export Market Data (CSV)
          </button>
          <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Export Analysis Reports (PDF)
          </button>
          <button className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Export User Data (JSON)
          </button>
        </div>
      </div>

      <button
        onClick={() => handleSave('Data')}
        disabled={loading}
        className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences':
        return renderPreferencesTab();
      case 'profile':
        return renderProfileTab();
      case 'subscription':
        return renderSubscriptionTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'api':
        return renderApiTab();
      case 'data':
        return renderDataTab();
      default:
        return renderPreferencesTab();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-crypto-blue" />
        <h2 className="text-2xl font-bold text-white">Settings</h2>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <span className="text-green-400">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-crypto-blue text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 rounded-lg p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
