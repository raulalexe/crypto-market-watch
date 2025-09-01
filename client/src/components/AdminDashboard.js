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
  MessageCircle
} from 'lucide-react';
import ToastNotification from './ToastNotification';
import TelegramManagement from './TelegramManagement';

import { Link } from 'react-router-dom';

const AdminDashboard = ({ isAuthenticated, userData }) => {
  const [activeTab, setActiveTab] = useState('collections');
  const [collectionsData, setCollectionsData] = useState([]);
  const [aiAnalysisData, setAiAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRawData, setShowRawData] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [exporting, setExporting] = useState({});
  const [alert, setAlert] = useState(null);

  const tabs = [
    { id: 'collections', name: 'Database Collections', icon: Database },
    { id: 'ai-analysis', name: 'AI Analysis', icon: Brain },
    { id: 'overview', name: 'Overview', icon: BarChart3 },
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
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [collectionsResponse, aiResponse] = await Promise.all([
        fetch('/api/admin/collections', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }),
        fetch('/api/admin/ai-analysis', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      ]);

      if (!collectionsResponse.ok || !aiResponse.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const collectionsData = await collectionsResponse.json();
      const aiData = await aiResponse.json();

      setCollectionsData(collectionsData);
      setAiAnalysisData(aiData);
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage and monitor database collections and AI analysis</p>
        </div>



        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-crypto-blue text-crypto-blue'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
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
          {activeTab === 'telegram' && <TelegramManagement />}
        </div>
      </div>
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default AdminDashboard;
