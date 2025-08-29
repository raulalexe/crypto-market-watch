import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import pushNotificationService from '../services/pushNotificationService';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false,
    telegramNotifications: false,
    notificationPreferences: {}
  });
  
  const [pushStatus, setPushStatus] = useState({
    supported: false,
    isSubscribed: false,
    permission: 'default'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadPreferences();
    initializePushNotifications();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in to access notification settings.' });
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
  
        setPreferences(data.preferences || {
          emailNotifications: false,
          pushNotifications: false,
          telegramNotifications: false,
          notificationPreferences: {}
        });
      } else {

      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const initializePushNotifications = async () => {
    try {
      const status = await pushNotificationService.getSubscriptionStatus();
      setPushStatus(status);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const handleToggle = async (type) => {
    if (type === 'pushNotifications') {
      await handlePushToggle();
    } else {
      setPreferences(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
    }
  };

  const handlePushToggle = async () => {
    try {
      if (!pushStatus.supported) {
        setMessage({ type: 'error', text: 'Push notifications not supported in this browser' });
        return;
      }

      if (pushStatus.permission === 'denied') {
        setMessage({ type: 'error', text: 'Notification permission denied. Please enable in browser settings.' });
        return;
      }

      if (!pushStatus.isSubscribed) {
        // Subscribe to push notifications
        const permissionResult = await pushNotificationService.requestPermission();
        if (!permissionResult.success) {
          setMessage({ type: 'error', text: permissionResult.error });
          return;
        }

        const subscribeResult = await pushNotificationService.subscribe();

        if (subscribeResult.success) {
          setPushStatus(prev => ({ ...prev, isSubscribed: true }));
          setPreferences(prev => ({ ...prev, pushNotifications: true }));
          setMessage({ type: 'success', text: 'Successfully subscribed to push notifications!' });
        } else {

          setMessage({ type: 'error', text: subscribeResult.error });
        }
      } else {
        // Unsubscribe from push notifications
        const unsubscribeResult = await pushNotificationService.unsubscribe();
        if (unsubscribeResult.success) {
          setPushStatus(prev => ({ ...prev, isSubscribed: false }));
          setPreferences(prev => ({ ...prev, pushNotifications: false }));
          setMessage({ type: 'success', text: 'Successfully unsubscribed from push notifications' });
        } else {
          setMessage({ type: 'error', text: unsubscribeResult.error });
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      setMessage({ type: 'error', text: 'Error updating push notifications' });
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in to save notification preferences.' });
        return;
      }

      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Error saving preferences' });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async () => {
    try {
      const result = await pushNotificationService.showNotification('Test Notification', {
        body: 'This is a test notification from Crypto Market Monitor',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Test notification sent!' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error sending test notification' });
    }
  };

  const getPermissionStatus = () => {
    switch (pushStatus.permission) {
      case 'granted':
        return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Granted', color: 'text-green-500' };
      case 'denied':
        return { icon: <XCircle className="w-4 h-4 text-red-500" />, text: 'Denied', color: 'text-red-500' };
      default:
        return { icon: <AlertCircle className="w-4 h-4 text-yellow-500" />, text: 'Not set', color: 'text-yellow-500' };
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Bell className="w-5 h-5 mr-2" />
        Notification Settings
      </h2>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center">
            <Mail className="w-5 h-5 text-blue-400 mr-3" />
            <div>
              <h3 className="text-white font-medium">Email Notifications</h3>
              <p className="text-slate-400 text-sm">Receive alerts via email</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('emailNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.emailNotifications ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center">
            <Smartphone className="w-5 h-5 text-green-400 mr-3" />
            <div>
              <h3 className="text-white font-medium">Push Notifications</h3>
              <p className="text-slate-400 text-sm">
                Receive browser notifications
                {!pushStatus.supported && <span className="text-red-400 ml-1">(Not supported)</span>}
              </p>
              <div className="flex items-center mt-1">
                {getPermissionStatus().icon}
                <span className={`text-xs ml-1 ${getPermissionStatus().color}`}>
                  Permission: {getPermissionStatus().text}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {pushStatus.isSubscribed && (
              <button
                onClick={testNotification}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Test
              </button>
            )}
            <button
              onClick={() => handleToggle('pushNotifications')}
              disabled={!pushStatus.supported}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.pushNotifications ? 'bg-green-600' : 'bg-slate-600'
              } ${!pushStatus.supported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 text-blue-500 mr-3" />
            <div>
              <h3 className="text-white font-medium">Telegram Notifications</h3>
              <p className="text-slate-400 text-sm">Receive alerts via Telegram bot</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('telegramNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.telegramNotifications ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.telegramNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">How to enable notifications:</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• <strong>Email:</strong> Requires valid email address in your account</li>
          <li>• <strong>Push:</strong> Click the toggle and allow browser notifications when prompted</li>
          <li>• <strong>Telegram:</strong> Contact admin to add your Telegram chat ID</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings;
