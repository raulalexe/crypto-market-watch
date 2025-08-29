import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Bell, 
  Key, 
  Download, 
  LogOut, 
  Save, 
  Edit, 
  Settings,
  Database,
  AlertTriangle,
  FileText,
  BarChart3,
  Lock,
  Copy,
  Trash2,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { isAuthenticated, isAdmin, hasProAccess, hasPremiumAccess } from '../utils/authUtils';
import NotificationSettings from './NotificationSettings';
import ToastNotification from './ToastNotification';

const Profile = ({ onProfileUpdate }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    notifications: {
      email: true,
      push: true,
      telegram: false
    }
  });

  const showAlert = (message, type = 'info') => {
    setToastAlert({ message, type });
  };

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const checkAuthAndFetchProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/app/auth-required?feature=Profile&type=auth');
        return;
      }

      const response = await axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const user = response.data;
      
      // Check if user is authenticated using centralized method
      if (!isAuthenticated(user)) {
        navigate('/app/auth-required?feature=Profile&type=auth');
        return;
      }

      setUserData(user);
      setSubscriptionStatus(user);
      setFormData({
        email: user.email || '',
        notifications: {
          email: user.notifications?.email ?? true,
          push: user.notifications?.push ?? true,
          telegram: user.notifications?.telegram ?? false
        }
      });

      // Fetch API keys if user has Pro+ access
      if (hasProAccess(user)) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If there's an auth error, redirect to auth required
      if (error.response?.status === 401) {
        navigate('/app/auth-required?feature=Profile&type=auth');
        return;
      }
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.put('/api/profile', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUserData(response.data);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Notify parent component to refresh user data
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('lastSeenAlertId');
    navigate('/');
  };

  const getPlanColor = (userData) => {
    if (isAdmin(userData)) return 'text-purple-400';
    switch (userData.plan) {
      case 'premium': return 'text-yellow-400';
      case 'pro': return 'text-crypto-blue';
      default: return 'text-slate-400';
    }
  };

  const getPlanFeatures = (userData) => {
    if (isAdmin(userData)) {
      return ['Full access to all features', 'Admin dashboard', 'Error logs', 'System management'];
    }
    switch (userData.plan) {
      case 'premium':
        return ['Advanced Analytics', 'Advanced Data Export', 'Custom Alert Thresholds', 'Priority Notifications'];
      case 'pro':
        return ['Real-time Alerts', 'Email & Push Notifications', 'Historical Data', 'Data Export', 'API Access'];
      default:
        return ['Basic market data', 'Limited historical data'];
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'api', name: 'API Keys', icon: Key, requiresPro: true },
    { id: 'security', name: 'Security', icon: Lock }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <User className="w-5 h-5 mr-2" />
            Account Information
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-3 py-1 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              />
            ) : (
              <div className="flex items-center space-x-2 text-slate-300">
                <Mail className="w-4 h-4" />
                <span>{userData.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Type</label>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className={`font-medium ${getPlanColor(userData)}`}>
                {isAdmin(userData) ? 'Admin' : 
                 userData.plan === 'premium' ? 'Premium+' : 
                 userData.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/alerts"
            className="flex items-center space-x-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <AlertTriangle className="w-5 h-5 text-slate-300" />
            <div>
              <span className="text-slate-300 font-medium">Market Alerts</span>
              <p className="text-slate-400 text-sm">View and manage alerts</p>
            </div>
          </Link>
          <Link
            to="/data-export"
            className="flex items-center space-x-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Download className="w-5 h-5 text-slate-300" />
            <div>
              <span className="text-slate-300 font-medium">Data Export</span>
              <p className="text-slate-400 text-sm">Export market data</p>
            </div>
          </Link>
          {hasPremiumAccess(userData) && (
            <Link
              to="/advanced-analytics"
              className="flex items-center space-x-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-slate-300" />
              <div>
                <span className="text-slate-300 font-medium">Advanced Analytics</span>
                <p className="text-slate-400 text-sm">Portfolio analysis</p>
              </div>
            </Link>
          )}
          {hasPremiumAccess(userData) && (
            <Link
              to="/advanced-export"
              className="flex items-center space-x-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Database className="w-5 h-5 text-slate-300" />
              <div>
                <span className="text-slate-300 font-medium">Advanced Export</span>
                <p className="text-slate-400 text-sm">Scheduled exports</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Current Subscription</h3>
        {subscriptionStatus ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">
                {subscriptionStatus.planName || 'Free Plan'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                subscriptionStatus.status === 'active' 
                  ? 'bg-green-900/20 text-green-400' 
                  : 'bg-red-900/20 text-red-400'
              }`}>
                {subscriptionStatus.status}
              </span>
            </div>
            {subscriptionStatus.currentPeriodEnd && (
              <p className="text-slate-400 text-sm">
                Renews: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {subscriptionStatus.plan !== 'free' && !isAdmin(userData) && (
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Cancel Subscription
              </button>
            )}
          </div>
        ) : (
          <p className="text-slate-400">Loading subscription status...</p>
        )}
      </div>

      {!isAdmin(userData) && (
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

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Plan Features</h3>
        <div className="bg-slate-700 rounded-lg p-4">
          <ul className="space-y-2">
            {getPlanFeatures(userData).map((feature, index) => (
              <li key={index} className="text-slate-300 flex items-center">
                <div className="w-1.5 h-1.5 bg-crypto-blue rounded-full mr-2"></div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!isAdmin(userData) && (
        <div className="pt-4">
          <Link
            to="/subscription"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Manage Subscription</span>
          </Link>
        </div>
      )}
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <NotificationSettings />
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">API Access</h3>
        {!hasProAccess(userData) ? (
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-slate-400 mb-3">API access requires a Pro or Premium subscription.</p>
            <Link
              to="/subscription"
              className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Key Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-white">API Keys</h4>
                <button
                  onClick={() => createApiKey('New API Key')}
                  className="flex items-center space-x-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Key</span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  // Don't show this condition since we handle auth redirects above
  if (!userData && !loading) {
    return null; // Will redirect to auth required
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your account, subscription, and preferences</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
              : 'bg-red-900/20 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 mb-6">
          <div className="flex flex-wrap border-b border-slate-700">
            {tabs.map((tab) => {
              // Skip API tab if user doesn't have Pro access
              if (tab.requiresPro && !hasProAccess(userData)) {
                return null;
              }
              
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-crypto-blue border-b-2 border-crypto-blue bg-slate-700'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'subscription' && renderSubscriptionTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'api' && renderApiTab()}
            {activeTab === 'security' && renderSecurityTab()}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Sign Out</span>
            </button>
            <Link
              to="/app/contact"
              className="flex items-center space-x-3 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-300" />
              <span className="text-slate-300">Contact Support</span>
            </Link>
          </div>
        </div>
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
      
      {/* Toast Notification */}
      {toastAlert && <ToastNotification message={toastAlert.message} type={toastAlert.type} onClose={() => setToastAlert(null)} />}
    </div>
  );
};

export default Profile;
