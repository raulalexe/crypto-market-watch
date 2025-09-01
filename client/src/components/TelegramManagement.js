import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TelegramManagement = () => {
  const [status, setStatus] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, recentSubscribers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newChatId, setNewChatId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testChatId, setTestChatId] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, chatId: null, userName: '' });

  useEffect(() => {
    fetchTelegramData();
  }, []);

  const fetchTelegramData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Fetch status
      try {
        const statusResponse = await axios.get('/api/telegram/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStatus(statusResponse.data);
      } catch (statusError) {
        console.error('Error fetching status:', statusError);
        setStatus({ success: false, error: 'Failed to fetch status' });
      }

      // Fetch subscribers
      try {
        const subscribersResponse = await axios.get('/api/telegram/subscribers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSubscribers(subscribersResponse.data.subscribers || []);
        setStats(subscribersResponse.data.stats || { total: 0, active: 0, inactive: 0, recentSubscribers: [] });
      } catch (subscribersError) {
        console.error('Error fetching subscribers:', subscribersError);
        setSubscribers([]);
        setStats({ total: 0, active: 0, inactive: 0, recentSubscribers: [] });
      }
    } catch (error) {
      console.error('Error in fetchTelegramData:', error);
      setError('Failed to fetch Telegram data');
    } finally {
      setLoading(false);
    }
  };

  const addChatId = async () => {
    if (!newChatId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a chat ID' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/telegram/add-chat', 
        { chatId: newChatId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Chat ID added successfully' });
        setNewChatId('');
        fetchTelegramData();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to add chat ID' });
      }
    } catch (error) {
      console.error('Error adding chat ID:', error);
      setMessage({ type: 'error', text: 'Failed to add chat ID' });
    }
  };

  const removeChatId = async (chatId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/telegram/remove-chat', 
        { chatId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Chat ID removed successfully' });
        fetchTelegramData();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to remove chat ID' });
      }
    } catch (error) {
      console.error('Error removing chat ID:', error);
      setMessage({ type: 'error', text: 'Failed to remove chat ID' });
    }
  };

  const showDeleteConfirmation = (chatId, firstName, lastName) => {
    setConfirmDelete({ 
      show: true, 
      chatId, 
      userName: `${firstName || 'Unknown'} ${lastName || ''}`.trim() 
    });
  };

  const hideDeleteConfirmation = () => {
    setConfirmDelete({ show: false, chatId: null, userName: '' });
  };

  const confirmDeleteChat = async () => {
    if (confirmDelete.chatId) {
      await removeChatId(confirmDelete.chatId);
      hideDeleteConfirmation();
    }
  };

  const setupWebhook = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/telegram/setup-webhook', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Webhook setup completed' });
        fetchTelegramData();
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to setup webhook' });
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      setMessage({ type: 'error', text: 'Failed to setup webhook' });
    }
  };

  const sendTestMessage = async () => {
    if (!testChatId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a chat ID' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/telegram/test-message', 
        { 
          chatId: testChatId,
          message: testMessage || '🧪 Test message from Crypto Market Monitor bot'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Test message sent successfully' });
        setTestChatId('');
        setTestMessage('');
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to send test message' });
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setMessage({ type: 'error', text: 'Failed to send test message' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Telegram Bot Management</h2>
        
        {/* Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Bot Status</h3>
            <p className="text-2xl font-bold text-blue-900">
              {status?.success ? '✅ Active' : '❌ Inactive'}
            </p>
            {status?.botName && (
              <p className="text-sm text-blue-600">Bot: {status.botName}</p>
            )}
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Active Subscribers</h3>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            <p className="text-sm text-green-600">Total: {stats.total}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Webhook</h3>
            <p className="text-2xl font-bold text-purple-900">
              {process.env.REACT_APP_TELEGRAM_WEBHOOK_URL ? '✅ Set' : '❌ Not Set'}
            </p>
            <button
              onClick={setupWebhook}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              Setup Webhook
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Add Chat ID */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Chat ID</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newChatId}
            onChange={(e) => setNewChatId(e.target.value)}
            placeholder="Enter Telegram chat ID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 telegram-form-input"
          />
          <button
            onClick={addChatId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          To get a chat ID, start a conversation with the bot and use /start command, or use @userinfobot on Telegram
        </p>
      </div>

      {/* Test Message */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Send Test Message</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
              placeholder="Chat ID"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 telegram-form-input"
            />
          </div>
          <div className="flex gap-4">
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test message (optional)"
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 telegram-form-input"
            />
          </div>
          <button
            onClick={sendTestMessage}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Send Test Message
          </button>
        </div>
      </div>

              {/* Subscribers List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscribers ({subscribers?.length || 0})</h3>
          
          {(!subscribers || subscribers.length === 0) ? (
            <p className="text-gray-500">No subscribers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chat ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {subscriber?.firstName || 'Unknown'} {subscriber?.lastName || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{subscriber?.username || 'No username'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscriber?.chatId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscriber?.subscribed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscriber?.subscribed ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {subscriber?.subscribedAt 
                          ? new Date(subscriber.subscribedAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => showDeleteConfirmation(subscriber?.chatId, subscriber?.firstName, subscriber?.lastName)}
                          className="text-red-600 hover:text-red-900"
                          disabled={!subscriber?.chatId}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Recent Subscribers */}
              {stats.recentSubscribers && stats.recentSubscribers.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Subscribers</h3>
          <div className="space-y-2">
                              {stats.recentSubscribers.map((subscriber, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <span className="font-medium">{subscriber?.firstName || 'Unknown'} {subscriber?.lastName || ''}</span>
                        <span className="text-gray-500 ml-2">@{subscriber?.username || 'No username'}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {subscriber?.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={hideDeleteConfirmation}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirm Deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to remove <strong>{confirmDelete.userName}</strong> 
                  (Chat ID: {confirmDelete.chatId}) from Telegram notifications?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={hideDeleteConfirmation}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteChat}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramManagement;
