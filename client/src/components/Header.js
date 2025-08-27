import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, RefreshCw, TrendingUp, Bell } from 'lucide-react';
import AlertPopup from './AlertPopup';

const Header = ({ onMenuClick, onRefreshClick, onAuthClick, onLogoutClick, loading, isAuthenticated }) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);
  const [lastSeenAlertId, setLastSeenAlertId] = useState(null);

  // Load last seen alert ID from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastSeenAlertId');
    if (stored) {
      setLastSeenAlertId(parseInt(stored));
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/alerts?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedAlerts = data.alerts || [];
        setAlerts(fetchedAlerts);
        
        // Calculate unread count based on last seen alert ID
        if (lastSeenAlertId) {
          const unread = fetchedAlerts.filter(alert => 
            alert.id > lastSeenAlertId && !alert.acknowledged
          ).length;
          setUnreadCount(unread);
        } else {
          // If no last seen ID, count all unacknowledged alerts
          const unread = fetchedAlerts.filter(alert => !alert.acknowledged).length;
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch alerts on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
      // Set up interval to fetch alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, lastSeenAlertId]);

  const handleAlertClick = () => {
    setIsAlertPopupOpen(true);
    // Mark alerts as seen by updating last seen alert ID
    if (alerts.length > 0) {
      const maxId = Math.max(...alerts.map(alert => alert.id));
      setLastSeenAlertId(maxId);
      localStorage.setItem('lastSeenAlertId', maxId.toString());
      setUnreadCount(0);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors md:hidden"
          >
            <Menu className="w-6 h-6 text-slate-300" />
          </button>
          
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <TrendingUp className="w-8 h-8 text-crypto-green" />
            <h1 className="text-xl font-bold text-white">Crypto Market Monitor</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <>
              <button
                onClick={onRefreshClick}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleAlertClick}
                className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </>
          )}
          
          {isAuthenticated ? (
            <button
              onClick={onLogoutClick}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/landing"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                About
              </Link>
              <button
                onClick={onAuthClick}
                className="px-4 py-2 bg-crypto-green text-black rounded-lg hover:bg-green-400 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Alert Popup */}
      <AlertPopup
        isOpen={isAlertPopupOpen}
        onClose={() => setIsAlertPopupOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        unreadCount={unreadCount}
      />
    </header>
  );
};

export default Header;