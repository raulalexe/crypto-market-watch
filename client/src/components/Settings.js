import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, CreditCard, Shield, Bell, Database, Key } from 'lucide-react';
import axios from 'axios';
import { shouldShowUpgradePrompt } from '../utils/authUtils';
import NotificationSettings from './NotificationSettings';
import ToastNotification from './ToastNotification';

const Settings = ({ setAuthModalOpen }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('preferences');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  const handleUpgradeClick = () => {
    navigate('/app/subscription');
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alert, setAlert] = useState(null);

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

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
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
              <p className="text-white">No payment method on file</p>
              <p className="text-slate-400 text-sm">Add a payment method to manage your subscription</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Billing History</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <p className="text-slate-400">No billing history available</p>
              <p className="text-slate-400 text-sm">Billing history will appear here once you have active subscriptions</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {shouldShowUpgradePrompt({ isAuthenticated }) ? (
        <div className="bg-slate-700 rounded-lg p-6 text-center">
          <Bell className="w-12 h-12 text-crypto-blue mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Get Real-Time Notifications</h3>
          <p className="text-slate-400 mb-4">
            Stay ahead of market movements with instant notifications via email, push, and Telegram.
          </p>
          <div className="space-y-2 text-sm text-slate-400 mb-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Email notifications</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Push notifications</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Telegram alerts</span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/app?auth=register'}
            className="px-6 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign Up for Pro
          </button>
        </div>
      ) : (
        <NotificationSettings />
      )}
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
              <p className="text-slate-400 text-sm">Coming soon</p>
            </div>
            <button 
              className="px-4 py-2 bg-slate-600 text-slate-400 rounded-lg cursor-not-allowed"
              disabled
            >
              Enable 2FA
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-2">Two-factor authentication will be available in a future update</p>
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

  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);

  const fetchApiKeys = async () => {
    try {
      setApiKeyLoading(true);
      const response = await axios.get('/api/keys');
      setApiKeys(response.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const createApiKey = async (name) => {
    try {
      const response = await axios.post('/api/keys', { name });
      setNewApiKey(response.data);
      setShowNewKey(true);
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const regenerateApiKey = async (id) => {
    try {
      const response = await axios.put(`/api/keys/${id}/regenerate`);
      setNewApiKey(response.data);
      setShowNewKey(true);
      fetchApiKeys();
    } catch (error) {
      console.error('Error regenerating API key:', error);
    }
  };

  const deactivateApiKey = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this API key?')) {
      return;
    }
    try {
      await axios.delete(`/api/keys/${id}`);
      fetchApiKeys();
    } catch (error) {
      console.error('Error deactivating API key:', error);
    }
  };

  useEffect(() => {
    if (subscriptionStatus?.plan !== 'free') {
      fetchApiKeys();
    }
  }, [subscriptionStatus]);

  const renderApiTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">API Access</h3>
        {subscriptionStatus?.plan === 'free' ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-slate-400 mb-3">API access requires a Pro or Premium subscription.</p>
            <button 
              onClick={handleUpgradeClick}
              className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Key Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-white">API Keys</h4>
                <button
                  onClick={() => createApiKey('New API Key')}
                  className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create New Key
                </button>
              </div>
              
              {apiKeyLoading ? (
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400">Loading API keys...</p>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400">No API keys found. Create your first API key to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{key.name}</p>
                          <p className="text-slate-400 text-sm font-mono">{key.api_key}</p>
                          <p className="text-slate-400 text-xs">
                            Created: {new Date(key.created_at).toLocaleDateString()}
                            {key.last_used && ` • Last used: ${new Date(key.last_used).toLocaleDateString()}`}
                            {key.usage_count > 0 && ` • Used ${key.usage_count} times`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => regenerateApiKey(key.id)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={() => deactivateApiKey(key.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Deactivate
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New API Key Modal */}
            {showNewKey && newApiKey && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-medium text-white mb-4">New API Key Created</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Copy this API key now. You won't be able to see it again!
                  </p>
                  <div className="bg-slate-700 rounded-lg p-3 mb-4">
                    <p className="text-white font-mono text-sm break-all">{newApiKey.api_key}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newApiKey.api_key);
                        showAlert('API key copied to clipboard!', 'success');
                      }}
                      className="flex-1 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        setShowNewKey(false);
                        setNewApiKey(null);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API Usage Info */}
            <div>
              <h4 className="text-md font-medium text-white mb-2">API Usage Limits</h4>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Pro Plan:</span>
                    <span className="text-white">1,000 calls/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Premium+ Plan:</span>
                    <span className="text-white">10,000 calls/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Admin:</span>
                    <span className="text-white">Unlimited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* API Documentation */}
            <div>
              <h4 className="text-md font-medium text-white mb-2">API Endpoints</h4>
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-white font-mono">GET /api/v1/market-data</p>
                    <p className="text-slate-400">Get latest market data</p>
                  </div>
                  <div>
                    <p className="text-white font-mono">GET /api/v1/crypto-prices</p>
                    <p className="text-slate-400">Get crypto prices</p>
                  </div>
                  <div>
                    <p className="text-white font-mono">GET /api/v1/analysis</p>
                    <p className="text-slate-400">Get AI analysis</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-3">
                  Include your API key in the X-API-Key header or Authorization header
                </p>
              </div>
            </div>
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
      
      {/* Toast Notification */}
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default Settings;
