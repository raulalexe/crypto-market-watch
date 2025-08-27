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
  Filter,
  Search,
  CheckCircle
} from 'lucide-react';
import AlertCard from './AlertCard';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('collections');
  const [collectionsData, setCollectionsData] = useState([]);
  const [aiAnalysisData, setAiAnalysisData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRawData, setShowRawData] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [alerts, setAlerts] = useState([]);

  const tabs = [
    { id: 'collections', name: 'Database Collections', icon: Database },
    { id: 'ai-analysis', name: 'AI Analysis', icon: Brain },
    { id: 'alerts', name: 'Alerts', icon: TrendingUp },
    { id: 'overview', name: 'Overview', icon: BarChart3 }
  ];

  const collections = [
    { id: 'market_data', name: 'Market Data', description: 'Real-time cryptocurrency market data' },
    { id: 'ai_analysis', name: 'AI Analysis', description: 'AI-generated market analysis and predictions' },
    { id: 'fear_greed', name: 'Fear & Greed', description: 'Market sentiment indicators' },
    { id: 'trending_narratives', name: 'Trending Narratives', description: 'Popular market narratives and trends' },
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

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const exportData = async (collectionName) => {
    try {
          const response = await fetch(`/api/admin/export/${collectionName}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data');
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
                  onClick={() => exportData(item.collection)}
                  className="p-2 bg-crypto-blue hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
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

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Market Alerts</h3>
          <p className="text-gray-400 text-sm">Monitor and manage system-generated market alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-500 px-2 py-1 rounded text-white">
            {alerts.filter(a => a.severity === 'high').length} High
          </span>
          <span className="text-xs bg-yellow-500 px-2 py-1 rounded text-white">
            {alerts.filter(a => a.severity === 'medium').length} Medium
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-2">No alerts found</div>
            <div className="text-sm text-gray-500">Market conditions are stable</div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
                alert.severity === 'high' ? 'border-red-500' :
                alert.severity === 'medium' ? 'border-yellow-500' :
                'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.severity === 'high' ? 'bg-red-500 text-white' :
                      alert.severity === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{alert.type}</span>
                  </div>
                  <p className="text-white mb-2">{alert.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Metric: {alert.metric}</span>
                    {alert.value && (
                      <span>Value: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</span>
                    )}
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="ml-4 p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  title="Acknowledge alert"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))
        )}
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

        {/* Alert Card for Admin */}
        <div className="mb-6">
          <AlertCard alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
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
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'overview' && renderOverviewTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
