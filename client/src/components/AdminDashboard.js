import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Brain, 
  TrendingUp, 
  Users, 
  BarChart3, 
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  MessageCircle,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import ToastNotification from './ToastNotification';
import TelegramManagement from './TelegramManagement';
import AdminEmailInterface from './AdminEmailInterface';

import { Link } from 'react-router-dom';

const AdminDashboard = ({ isAuthenticated, userData }) => {
  const [activeTab, setActiveTab] = useState('collections');
  const [collectionsData, setCollectionsData] = useState([]);
  const [aiAnalysisData, setAiAnalysisData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRawData, setShowRawData] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [exporting, setExporting] = useState({});
  const [alert, setAlert] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsFilter, setEventsFilter] = useState('all'); // 'all', 'upcoming', 'past'

  const tabs = [
    { id: 'collections', name: 'Database Collections', icon: Database },
    { id: 'ai-analysis', name: 'AI Analysis', icon: Brain },
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'events', name: 'Events Management', icon: Calendar },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'email', name: 'Email Interface', icon: Mail },
    { id: 'telegram', name: 'Telegram Bot', icon: MessageCircle }
  ];

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
  };

  const collections = [
    { id: 'market_data', name: 'Market Data', description: 'Real-time cryptocurrency market data' },
    { id: 'ai_analysis', name: 'AI Analysis', description: 'AI-generated market analysis and predictions' },
    { id: 'fear_greed', name: 'Fear & Greed', description: 'Market sentiment indicators' },
    { id: 'trending_narratives', name: 'Trending Narratives', description: 'Popular market narratives and trends' },
    { id: 'upcoming_events', name: 'Upcoming Events', description: 'Scheduled market events and announcements' },
    { id: 'users', name: 'Users', description: 'User accounts and subscription data' },
    { id: 'subscriptions', name: 'Subscriptions', description: 'User subscription information' },
    { id: 'error_logs', name: 'Error Logs', description: 'System error logs and debugging information' }
  ];

  useEffect(() => {
    fetchAdminData();
    fetchAlerts();
    fetchEvents();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [collectionsResponse, aiResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/collections', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/ai-analysis', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      ]);

      if (!collectionsResponse.ok || !aiResponse.ok || !usersResponse.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const collectionsData = await collectionsResponse.json();
      const aiData = await aiResponse.json();
      const usersData = await usersResponse.json();

      setCollectionsData(collectionsData);
      setAiAnalysisData(aiData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchEvents = async (filter = 'all') => {
    try {
      let endpoint = '/api/admin/events/all';
      if (filter === 'upcoming') {
        endpoint = '/api/admin/events';
      } else if (filter === 'past') {
        endpoint = '/api/admin/events/past';
      }
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showAlert('Failed to fetch events', 'error');
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingUser(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
      showAlert(`User ${userEmail} deleted successfully`, 'success');
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert(`Failed to delete user: ${error.message}`, 'error');
    } finally {
      setDeletingUser(null);
    }
  };

  const activateUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to activate user ${userEmail}? They will be able to log in without email verification.`)) {
      return;
    }

    try {
      setDeletingUser(userId); // Reuse the loading state
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate user');
      }

      const result = await response.json();
      
      // Update user in local state
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === userId 
            ? { ...user, emailVerified: true }
            : user
        );
        return updatedUsers;
      });

      showAlert(`User ${userEmail} activated successfully`, 'success');
    } catch (error) {
      console.error('Error activating user:', error);
      showAlert(`Failed to activate user: ${error.message}`, 'error');
    } finally {
      setDeletingUser(null);
    }
  };

  const deactivateUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate user ${userEmail}? They will not be able to log in until they verify their email again.`)) {
      return;
    }

    try {
      setDeletingUser(userId); // Reuse the loading state
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate user');
      }

      const result = await response.json();
      
      // Update user in local state
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.id === userId 
            ? { ...user, emailVerified: false }
            : user
        );
        return updatedUsers;
      });

      showAlert(`User ${userEmail} deactivated successfully`, 'success');
    } catch (error) {
      console.error('Error deactivating user:', error);
      showAlert(`Failed to deactivate user: ${error.message}`, 'error');
    } finally {
      setDeletingUser(null);
    }
  };



  const exportData = async (collectionName) => {
    console.log('🚀 exportData function called with:', collectionName);
    try {
      setExporting(prev => ({ ...prev, [collectionName]: true }));
      console.log('🔄 Starting export for collection:', collectionName);
      
      const authToken = localStorage.getItem('authToken');
      console.log('🔑 Auth token exists:', !!authToken);
      console.log('🔑 Auth token length:', authToken ? authToken.length : 0);
      console.log('🔑 User data:', userData);
      console.log('🔑 Is authenticated:', isAuthenticated);
      
      const response = await fetch(`/api/admin/export/${collectionName}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('📡 Export response status:', response.status);
      console.log('📡 Export response headers:', response.headers);
      console.log('📡 Export response ok:', response.ok);
      console.log('📡 Export response type:', response.type);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Export failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to export data: ${response.status} - ${errorText}`);
      }

      console.log('✅ Export successful, processing response...');
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📄 Received JSON data, records:', data.length);
        console.log('📄 Sample data:', data.slice(0, 2));
        
        // Create JSON blob with proper formatting
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        console.log('📦 Blob created, size:', blob.size, 'bytes');
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${collectionName}_export.json`;
        a.style.display = 'none';
        console.log('🔗 Download link created:', {
          href: a.href,
          download: a.download,
          display: a.style.display
        });
        
        // Add to DOM and trigger download
        document.body.appendChild(a);
        console.log('🔗 Download link created, triggering click...');
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          console.log('🔗 About to trigger download click...');
          a.click();
          console.log('✅ Click triggered');
          
          // Cleanup
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log('🧹 Cleanup completed');
          }, 1000);
        }, 100);
        
        console.log('✅ Download process initiated for:', collectionName);
        
        // Show success message
        setTimeout(() => {
          console.log('🎉 Export completed successfully!');
          showAlert(`✅ Export successful! Downloading ${collectionName}_export.json`, 'success');
        }, 500);
      } else {
        console.error('❌ Unexpected content type:', contentType);
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('❌ Error exporting data:', err);
      showAlert(`Failed to export data: ${err.message}`, 'error');
    } finally {
      setExporting(prev => ({ ...prev, [collectionName]: false }));
    }
  };

  const filteredCollections = collectionsData.filter(item => {
    if (selectedCollection !== 'all' && item.collection !== selectedCollection) {
      return false;
    }
    if (searchTerm && !JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredAiData = aiAnalysisData.filter(item => {
    if (searchTerm && !JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderCollectionsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">All Collections</option>
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            />
          </div>
        </div>
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showRawData ? 'Hide Raw' : 'Show Raw'}
        </button>
      </div>

      <div className="grid gap-4">
        {filteredCollections.map((item, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white capitalize">
                  {item.collection.replace('_', ' ')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {collections.find(c => c.id === item.collection)?.description || 'Database collection'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                  {item.count} records
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Export button clicked for:', item.collection);
                    exportData(item.collection);
                  }}
                  disabled={exporting[item.collection]}
                  className={`p-2 rounded-lg transition-colors ${
                    exporting[item.collection] 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-crypto-blue hover:bg-blue-600'
                  }`}
                  title={`Export ${item.collection} data`}
                >
                  {exporting[item.collection] ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            
            {showRawData ? (
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            ) : (
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">
                  Sample data (showing first 3 records):
                </div>
                <div className="space-y-2">
                  {item.data.slice(0, 3).map((record, recordIndex) => (
                    <div key={recordIndex} className="text-sm text-gray-300">
                      <div className="font-mono">
                        {JSON.stringify(record, null, 2)}
                      </div>
                    </div>
                  ))}
                  {item.data.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      ... and {item.data.length - 3} more records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAiAnalysisTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search AI analysis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showRawData ? 'Hide Raw' : 'Show Raw'}
        </button>
      </div>

      <div className="grid gap-4">
        {filteredAiData.map((analysis, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  AI Analysis #{analysis.id || index + 1}
                </h3>
                <p className="text-gray-400 text-sm">
                  {analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : 'No timestamp'}
                </p>
              </div>
              <span className="text-xs bg-crypto-blue px-2 py-1 rounded text-white">
                AI Generated
              </span>
            </div>
            
            {showRawData ? (
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            ) : (
              <div className="bg-gray-900 p-4 rounded-lg space-y-4">
                {/* Overall Analysis */}
                {(analysis.overall_direction || analysis.overall_confidence) && (
                  <div className="border-b border-gray-700 pb-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Overall Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {analysis.overall_direction && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Direction:</div>
                          <div className="text-sm text-white font-medium">{analysis.overall_direction}</div>
                        </div>
                      )}
                      {analysis.overall_confidence && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Confidence:</div>
                          <div className="text-sm text-white font-medium">{analysis.overall_confidence}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Multi-Timeframe Analysis */}
                {(analysis.short_term || analysis.medium_term || analysis.long_term) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Multi-Timeframe Analysis</h4>
                    
                    {analysis.short_term && (
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs font-semibold text-blue-400 mb-1">Short Term (1-7 days)</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Direction:</span>
                            <span className="text-white ml-1">{analysis.short_term.market_direction}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-white ml-1">{analysis.short_term.confidence}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {analysis.short_term.reasoning?.substring(0, 100)}...
                        </div>
                      </div>
                    )}

                    {analysis.medium_term && (
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs font-semibold text-yellow-400 mb-1">Medium Term (1-4 weeks)</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Direction:</span>
                            <span className="text-white ml-1">{analysis.medium_term.market_direction}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-white ml-1">{analysis.medium_term.confidence}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {analysis.medium_term.reasoning?.substring(0, 100)}...
                        </div>
                      </div>
                    )}

                    {analysis.long_term && (
                      <div className="bg-gray-800 p-3 rounded">
                        <div className="text-xs font-semibold text-green-400 mb-1">Long Term (1-6 months)</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Direction:</span>
                            <span className="text-white ml-1">{analysis.long_term.market_direction}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-white ml-1">{analysis.long_term.confidence}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {analysis.long_term.reasoning?.substring(0, 100)}...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legacy Fields (if no multi-timeframe data) */}
                {!analysis.short_term && !analysis.medium_term && !analysis.long_term && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Legacy Analysis</h4>
                    {analysis.market_direction && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Direction:</div>
                        <div className="text-sm text-white">{analysis.market_direction}</div>
                      </div>
                    )}
                    {analysis.confidence && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Confidence:</div>
                        <div className="text-sm text-white">{analysis.confidence}%</div>
                      </div>
                    )}
                    {analysis.reasoning && (
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Reasoning:</div>
                        <div className="text-sm text-gray-400">{analysis.reasoning}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Collections</p>
            <p className="text-2xl font-bold text-white">{collectionsData.length}</p>
          </div>
          <Database className="w-8 h-8 text-crypto-blue" />
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">AI Analysis</p>
            <p className="text-2xl font-bold text-white">{aiAnalysisData.length}</p>
          </div>
          <Brain className="w-8 h-8 text-crypto-blue" />
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Records</p>
            <p className="text-2xl font-bold text-white">
              {collectionsData.reduce((sum, collection) => sum + collection.count, 0)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-crypto-blue" />
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Active Users</p>
            <p className="text-2xl font-bold text-white">
              {collectionsData.find(c => c.collection === 'users')?.count || 0}
            </p>
          </div>
          <Users className="w-8 h-8 text-crypto-blue" />
        </div>
      </div>

             <div className="bg-gray-800 p-6 rounded-lg col-span-1 md:col-span-2 lg:col-span-1">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-lg font-semibold text-white">Market Alerts</h3>
           <Link 
             to="/app/alerts" 
             className="text-crypto-blue hover:text-blue-400 transition-colors text-sm flex items-center gap-1"
           >
             View All
             <AlertTriangle className="w-4 h-4" />
           </Link>
         </div>
         
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-400">High Severity</span>
             <span className="text-xs bg-red-500 px-2 py-1 rounded text-white">
               {alerts.filter(a => a.severity === 'high').length}
             </span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-400">Medium Severity</span>
             <span className="text-xs bg-yellow-500 px-2 py-1 rounded text-white">
               {alerts.filter(a => a.severity === 'medium').length}
             </span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-400">Low Severity</span>
             <span className="text-xs bg-blue-500 px-2 py-1 rounded text-white">
               {alerts.filter(a => a.severity === 'low').length}
             </span>
           </div>
           
           {alerts.length > 0 && (
             <div className="mt-4 pt-3 border-t border-gray-700">
               <div className="text-xs text-gray-400 mb-2">Recent Alerts:</div>
               <div className="space-y-2">
                 {alerts.slice(0, 3).map(alert => (
                   <div key={alert.id} className="text-xs text-gray-300 truncate">
                     {alert.message}
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       </div>
    </div>
  );

  const renderEventsTab = () => {
    const filteredEvents = events.filter(event => {
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

    const handleEventsFilterChange = (filter) => {
      setEventsFilter(filter);
      fetchEvents(filter);
    };

    const formatEventDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getEventStatus = (event) => {
      const now = new Date();
      const eventDate = new Date(event.date);
      if (eventDate > now) {
        return { status: 'upcoming', color: 'text-blue-400', bg: 'bg-blue-900/20' };
      } else {
        return { status: 'past', color: 'text-gray-400', bg: 'bg-gray-900/20' };
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={eventsFilter}
                onChange={(e) => handleEventsFilterChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => fetchEvents(eventsFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Refresh events list (admin function)"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Events ({filteredEvents.length})
            </h3>
            <div className="text-sm text-gray-400">
              Filter: {eventsFilter === 'all' ? 'All Events' : eventsFilter === 'upcoming' ? 'Upcoming Only' : 'Past Only'}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => {
                const eventStatus = getEventStatus(event);
                return (
                  <div key={event.id} className={`p-4 rounded-lg border ${eventStatus.bg} border-gray-700`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${eventStatus.color} ${eventStatus.bg}`}>
                            {eventStatus.status}
                          </span>
                          {event.ignored && (
                            <span className="px-2 py-1 rounded text-xs font-medium text-red-400 bg-red-900/20">
                              Ignored
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Date:</span>
                            <div className="text-white">{formatEventDate(event.date)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Category:</span>
                            <div className="text-white capitalize">{event.category || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Source:</span>
                            <div className="text-white">{event.source || 'N/A'}</div>
                          </div>
                        </div>
                        
                        {event.description && (
                          <div className="mt-2">
                            <span className="text-gray-400 text-sm">Description:</span>
                            <div className="text-gray-300 text-sm mt-1">{event.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    const filteredUsers = users.filter(user => {
      if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <div className="text-sm text-gray-400">
              {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {user.emailVerified ? (
                            <UserCheck className="w-5 h-5 text-green-400" />
                          ) : (
                            <UserX className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-400">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.emailVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                        {user.isAdmin && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.plan === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                          user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.plan}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                          user.subscriptionStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* Activation/Deactivation Button */}
                        {!user.isAdmin && (
                          <button
                            onClick={() => user.emailVerified ? deactivateUser(user.id, user.email) : activateUser(user.id, user.email)}
                            disabled={deletingUser === user.id}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                              user.emailVerified 
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            title={user.emailVerified ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.emailVerified ? (
                              <>
                                <UserX className="w-3 h-3" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Activate
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          disabled={deletingUser === user.id || user.isAdmin}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.isAdmin 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title={user.isAdmin ? 'Cannot delete admin users' : 'Delete user'}
                        >
                          {deletingUser === user.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          {deletingUser === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-crypto-blue" />
          <span className="text-white">Loading admin data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-crypto-blue hover:bg-blue-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage and monitor database collections and AI analysis</p>
        </div>



        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-crypto-blue text-crypto-blue'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'collections' && renderCollectionsTab()}
          {activeTab === 'ai-analysis' && renderAiAnalysisTab()}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'email' && <AdminEmailInterface />}
          {activeTab === 'telegram' && <TelegramManagement />}
        </div>
      </div>
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default AdminDashboard;
