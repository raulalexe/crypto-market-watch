import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, XCircle, Copy, Clock, AlertCircle, ExternalLink } from 'lucide-react';

const TelegramConnection = () => {
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTelegramStatus();
  }, []);

  const loadTelegramStatus = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in.' });
        return;
      }

      const response = await fetch('/api/telegram/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTelegramStatus(data.status);
      } else {
        console.error('Failed to load Telegram status:', response.status);
        setMessage({ type: 'error', text: 'Failed to load Telegram status' });
      }
    } catch (error) {
      console.error('Error loading Telegram status:', error);
      setMessage({ type: 'error', text: 'Error loading Telegram status' });
    } finally {
      setLoading(false);
    }
  };

  const generateVerificationCode = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in.' });
        return;
      }

      const response = await fetch('/api/telegram/generate-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTelegramStatus(prev => ({
          ...prev,
          hasValidCode: true,
          code: data.code,
          expiresAt: new Date(data.expiresAt)
        }));
        setMessage({ 
          type: 'success', 
          text: `Verification code generated! It expires in 10 minutes.` 
        });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: `Failed to generate code: ${errorData.error}` });
      }
    } catch (error) {
      console.error('Error generating verification code:', error);
      setMessage({ type: 'error', text: 'Error generating verification code' });
    } finally {
      setGenerating(false);
    }
  };

  const disconnectTelegram = async () => {
    setDisconnecting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in.' });
        return;
      }

      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setTelegramStatus(prev => ({
          ...prev,
          verified: false,
          chatId: null,
          hasValidCode: false,
          code: null,
          expiresAt: null
        }));
        setMessage({ type: 'success', text: 'Telegram account disconnected successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: `Failed to disconnect: ${errorData.error}` });
      }
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      setMessage({ type: 'error', text: 'Error disconnecting Telegram' });
    } finally {
      setDisconnecting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Code copied to clipboard!' });
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
        Telegram Connection
      </h3>

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

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-700/50 rounded-lg space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
              telegramStatus?.verified ? 'bg-green-500' : 'bg-slate-500'
            }`}></div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium">
                {telegramStatus?.verified ? 'Connected' : 'Not Connected'}
              </h4>
              <p className="text-slate-400 text-sm break-words">
                {telegramStatus?.verified 
                  ? `Chat ID: ${telegramStatus.chatId}` 
                  : 'Connect your Telegram account to receive notifications'
                }
              </p>
            </div>
          </div>
          {telegramStatus?.verified && (
            <button
              onClick={disconnectTelegram}
              disabled={disconnecting}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded flex items-center justify-center w-full sm:w-auto"
            >
              {disconnecting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Verification Process */}
      {!telegramStatus?.verified && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h4 className="text-white font-medium mb-2 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-400" />
              How to Connect Telegram
            </h4>
            <ol className="text-sm text-slate-300 space-y-2">
              <li>1. Click "Generate Code" below to get a verification code</li>
              <li>2. Open Telegram and start a conversation with the Crypto Market Watch bot</li>
              <li className="break-words">   Bot: <code className="bg-slate-700 px-2 py-1 rounded">@crypto_market_watch_bot</code></li>
              <li>3. Send the command: <code className="bg-slate-700 px-2 py-1 rounded">/verify YOUR_CODE</code></li>
              <li>4. Your account will be linked and you'll receive notifications</li>
            </ol>
          </div>

          {/* Verification Code Section */}
          {telegramStatus?.hasValidCode ? (
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h4 className="text-white font-medium mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                Verification Code Generated
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                <div className="bg-slate-700 px-4 py-2 rounded-lg font-mono text-lg text-white text-center sm:text-left break-all">
                  {telegramStatus.code}
                </div>
                <button
                  onClick={() => copyToClipboard(telegramStatus.code)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </button>
              </div>
              <div className="flex items-center text-sm text-slate-400">
                <Clock className="w-4 h-4 mr-1" />
                Expires in: {getTimeRemaining(telegramStatus.expiresAt)}
              </div>
              <div className="mt-3 p-3 bg-slate-700/50 rounded">
                <p className="text-sm text-slate-300">
                  <strong>Next step:</strong> Go to Telegram and send:
                </p>
                <p className="text-sm text-slate-300 mt-1 break-all">
                  <code className="bg-slate-600 px-2 py-1 rounded">/verify {telegramStatus.code}</code>
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={generateVerificationCode}
              disabled={generating}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center justify-center"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Code...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Generate Verification Code
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Bot Information */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Bot Information</h4>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• Bot handles market alerts and notifications</p>
          <p>• Commands: /start, /verify, /help, /status</p>
          <p>• Verification codes expire in 10 minutes</p>
          <p>• Only verified accounts receive notifications</p>
        </div>
      </div>
    </div>
  );
};

export default TelegramConnection;
