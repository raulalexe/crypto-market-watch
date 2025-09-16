import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageCircle, CheckCircle, XCircle, AlertCircle, Calendar, Clock, Filter } from 'lucide-react';
import pushNotificationService from '../services/pushNotificationService';
import TelegramConnection from './TelegramConnection';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false,
    telegramNotifications: false,
    notificationPreferences: {},
    eventNotifications: true,
    eventNotificationWindows: [3],
    eventNotificationChannels: ['email', 'push'],
    eventImpactFilter: 'all'
  });
  
  const [pushStatus, setPushStatus] = useState({
    supported: false,
    isSubscribed: false,
    permission: 'default'
  });
  
  const [loading, setLoading] = useState(true);
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
          notificationPreferences: {},
          eventNotifications: true,
          eventNotificationWindows: [3],
          eventNotificationChannels: ['email', 'push'],
          eventImpactFilter: 'all'
        });
      } else {
        console.error('Failed to load preferences:', response.status, response.statusText);
        setMessage({ type: 'error', text: 'Failed to load notification preferences' });
        // Keep default preferences on error
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setMessage({ type: 'error', text: 'Error loading notification preferences' });
      // Keep default preferences on error
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
      const newPreferences = {
        ...preferences,
        [type]: !preferences[type]
      };
      setPreferences(newPreferences);
      // Auto-save preferences when toggled
      await savePreferencesWithData(newPreferences);
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
          const newPreferences = { ...preferences, pushNotifications: true };
          setPreferences(newPreferences);
          await savePreferencesWithData(newPreferences);
          setMessage({ type: 'success', text: 'Successfully subscribed to push notifications!' });
        } else {

          setMessage({ type: 'error', text: subscribeResult.error });
        }
      } else {
        // Unsubscribe from push notifications
        const unsubscribeResult = await pushNotificationService.unsubscribe();
        if (unsubscribeResult.success) {
          setPushStatus(prev => ({ ...prev, isSubscribed: false }));
          const newPreferences = { ...preferences, pushNotifications: false };
          setPreferences(newPreferences);
          await savePreferencesWithData(newPreferences);
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

  const savePreferencesWithData = async (preferencesToSave) => {
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
        body: JSON.stringify(preferencesToSave)
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        const errorData = await response.json();
        console.error('Auto-save failed:', response.status, errorData);
        setMessage({ type: 'error', text: `Failed to save preferences: ${errorData.error || 'Unknown error'}` });
      }
    } catch (error) {
      console.error('Error auto-saving preferences:', error);
      setMessage({ type: 'error', text: 'Error saving preferences' });
    }
  };


  const testNotification = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      // First try to show a local notification for immediate feedback
      const localResult = await pushNotificationService.showNotification('Test Notification', {
        body: 'This is a test notification from Crypto Market Watch',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });

      // Also send a server-side test notification
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from Crypto Market Watch',
          icon: '/favicon.ico'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test notification sent successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to send test notification' });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage({ type: 'error', text: 'Error sending test notification' });
    }
  };

  // Helper functions for multi-select
  const toggleNotificationWindow = async (days) => {
    const currentWindows = preferences.eventNotificationWindows || [];
    const newWindows = currentWindows.includes(days)
      ? currentWindows.filter(d => d !== days)
      : [...currentWindows, days].sort((a, b) => a - b);
    
    const newPreferences = {
      ...preferences,
      eventNotificationWindows: newWindows
    };
    setPreferences(newPreferences);
    await savePreferencesWithData(newPreferences);
  };

  const toggleNotificationChannel = async (channel) => {
    const currentChannels = preferences.eventNotificationChannels || [];
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];
    
    const newPreferences = {
      ...preferences,
      eventNotificationChannels: newChannels
    };
    setPreferences(newPreferences);
    await savePreferencesWithData(newPreferences);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-700/50 rounded-lg">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-700/50 rounded-lg">
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
        <div className="p-4 bg-slate-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
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
          
          {/* Telegram Connection Component */}
          {preferences.telegramNotifications && (
            <div className="mt-3">
              <TelegramConnection />
            </div>
          )}
        </div>

        {/* Event Notifications Section */}
        <div className="border-t border-slate-600 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-400" />
            Event Notifications
          </h3>
          
          {/* Enable/Disable Event Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-700/50 rounded-lg mb-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-purple-400 mr-3" />
              <div>
                <h4 className="text-white font-medium">Event Notifications</h4>
                <p className="text-slate-400 text-sm">Receive notifications for upcoming market events</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const newPreferences = { ...preferences, eventNotifications: !preferences.eventNotifications };
                setPreferences(newPreferences);
                await savePreferencesWithData(newPreferences);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.eventNotifications ? 'bg-purple-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.eventNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notification Window Setting */}
          {preferences.eventNotifications && (
            <div className="p-4 bg-slate-700/50 rounded-lg mb-4">
              <div className="flex items-center mb-3">
                <Clock className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <h4 className="text-white font-medium">Notification Windows</h4>
                  <p className="text-slate-400 text-sm">Select one or more days before events to send notifications</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 7].map(days => (
                  <button
                    key={days}
                    onClick={() => toggleNotificationWindow(days)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      (preferences.eventNotificationWindows || []).includes(days)
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500 border-slate-500'
                    }`}
                  >
                    {days} day{days > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              {(preferences.eventNotificationWindows || []).length === 0 && (
                <p className="text-red-400 text-xs mt-2">⚠️ Please select at least one notification window</p>
              )}
            </div>
          )}

          {/* Notification Channels Setting */}
          {preferences.eventNotifications && (
            <div className="p-4 bg-slate-700/50 rounded-lg mb-4">
              <div className="flex items-center mb-3">
                <Bell className="w-5 h-5 text-green-400 mr-3" />
                <div>
                  <h4 className="text-white font-medium">Notification Channels</h4>
                  <p className="text-slate-400 text-sm">Choose which channels to use for event notifications</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { 
                    key: 'email', 
                    label: 'Email', 
                    icon: <Mail className="w-4 h-4" />, 
                    description: 'Receive event notifications via email',
                    enabled: preferences.emailNotifications
                  },
                  { 
                    key: 'push', 
                    label: 'Push Notifications', 
                    icon: <Smartphone className="w-4 h-4" />, 
                    description: 'Receive browser push notifications',
                    enabled: preferences.pushNotifications
                  },
                  { 
                    key: 'telegram', 
                    label: 'Telegram', 
                    icon: <MessageCircle className="w-4 h-4" />, 
                    description: 'Receive notifications via Telegram bot',
                    enabled: preferences.telegramNotifications
                  }
                ].map(channel => (
                  <label key={channel.key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(preferences.eventNotificationChannels || []).includes(channel.key)}
                      onChange={() => toggleNotificationChannel(channel.key)}
                      disabled={!channel.enabled}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className={`flex items-center space-x-2 ${!channel.enabled ? 'opacity-50' : ''}`}>
                      <div className="text-slate-400">{channel.icon}</div>
                      <div>
                        <div className="text-white font-medium">{channel.label}</div>
                        <div className="text-slate-400 text-sm">{channel.description}</div>
                        {!channel.enabled && (
                          <div className="text-red-400 text-xs">⚠️ Enable {channel.label.toLowerCase()} notifications above first</div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {(preferences.eventNotificationChannels || []).length === 0 && (
                <p className="text-red-400 text-xs mt-2">⚠️ Please select at least one notification channel</p>
              )}
            </div>
          )}

          {/* Impact Filter Setting */}
          {preferences.eventNotifications && (
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center mb-3">
                <Filter className="w-5 h-5 text-orange-400 mr-3" />
                <div>
                  <h4 className="text-white font-medium">Event Impact Filter</h4>
                  <p className="text-slate-400 text-sm">Which events to receive notifications for</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Events', description: 'High, medium, and low impact events' },
                  { value: 'high', label: 'High Impact Only', description: 'FOMC meetings, CPI releases, Bitcoin halving' },
                  { value: 'high_medium', label: 'High & Medium Impact', description: 'Excludes low impact events' }
                ].map(option => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="eventImpactFilter"
                      value={option.value}
                      checked={preferences.eventImpactFilter === option.value}
                      onChange={async (e) => {
                        const newPreferences = { ...preferences, eventImpactFilter: e.target.value };
                        setPreferences(newPreferences);
                        await savePreferencesWithData(newPreferences);
                      }}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-slate-400 text-sm">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="mt-6 flex justify-center">
        <div className="text-sm text-green-400 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          Preferences are automatically saved when changed
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">How to enable notifications:</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• <strong>Email:</strong> Requires valid email address in your account</li>
          <li>• <strong>Push:</strong> Click the toggle and allow browser notifications when prompted</li>
          <li>• <strong>Telegram:</strong> Contact admin to add your Telegram chat ID</li>
          <li>• <strong>Events:</strong> Configure when and which market events to be notified about</li>
          <li>• <strong>Auto-save:</strong> All changes are automatically saved when you toggle settings</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-slate-600">
          <h5 className="text-sm font-medium text-white mb-1">Event Notification Settings:</h5>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Windows:</strong> Select multiple days (1-7) before events to receive notifications</li>
            <li>• <strong>Channels:</strong> Choose which notification methods to use (email, push, telegram)</li>
            <li>• <strong>Impact Filter:</strong> Select which event types to be notified about</li>
            <li>• <strong>High Impact:</strong> FOMC meetings, CPI releases, Bitcoin halving, SEC updates</li>
            <li>• <strong>Medium Impact:</strong> Fed speeches, Ethereum upgrades, GDP releases</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
