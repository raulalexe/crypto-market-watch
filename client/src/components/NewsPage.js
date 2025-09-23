import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Activity,
  Building,
  Settings,
  ExternalLink,
  Clock,
  Filter,
  RefreshCw,
  Calendar
} from 'lucide-react';
import axios from 'axios';

const NewsPage = () => {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get('/api/crypto-news', { headers });
      setNewsData(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching crypto news:', err);
      setError('Failed to load crypto news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hack': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'regulation': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'exchange': return <Building className="w-4 h-4 text-green-400" />;
      case 'institutional': return <Building className="w-4 h-4 text-purple-400" />;
      case 'technical': return <Settings className="w-4 h-4 text-yellow-400" />;
      case 'market': return <Activity className="w-4 h-4 text-orange-400" />;
      default: return <Newspaper className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriceImpactIcon = (priceImpact) => {
    switch (priceImpact) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getSignificanceColor = (significance) => {
    if (significance >= 0.8) return 'text-red-400';
    if (significance >= 0.6) return 'text-orange-400';
    if (significance >= 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getFilteredEvents = () => {
    if (!newsData || !newsData.events) return [];
    
    if (filterCategory === 'all') {
      return newsData.events;
    }
    
    return newsData.events.filter(event => 
      event.analysis?.category === filterCategory
    );
  };

  const categories = [
    { value: 'all', label: 'All News', count: newsData?.eventCount || 0 },
    { value: 'hack', label: 'Security', icon: AlertTriangle },
    { value: 'regulation', label: 'Regulation', icon: Shield },
    { value: 'exchange', label: 'Exchange', icon: Building },
    { value: 'institutional', label: 'Institutional', icon: Building },
    { value: 'technical', label: 'Technical', icon: Settings },
    { value: 'market', label: 'Market', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-slate-400">Loading crypto news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Newspaper className="mr-3 w-8 h-8 text-purple-400" />
                Crypto News Analysis
              </h1>
              <p className="mt-2 text-slate-400">
                AI-analyzed cryptocurrency news events with market impact assessment
              </p>
            </div>
            <button
              onClick={fetchNews}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 flex items-center text-sm text-slate-500">
              <Clock className="mr-1 w-4 h-4" />
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {categories.map(category => {
              const Icon = category.icon;
              const isActive = filterCategory === category.value;
              const categoryEvents = category.value === 'all' 
                ? newsData?.events || []
                : (newsData?.events || []).filter(event => event.analysis?.category === category.value);
              
              return (
                <button
                  key={category.value}
                  onClick={() => setFilterCategory(category.value)}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {Icon && <Icon className="mr-1.5 w-3 h-3" />}
                  {category.label}
                  <span className="ml-1.5 px-1.5 py-0.5 bg-slate-600 text-xs rounded">
                    {categoryEvents.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* News Events */}
        {newsData && newsData.hasEvents ? (
          <div className="space-y-6">
            {getFilteredEvents().map((event, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getCategoryIcon(event.analysis?.category)}
                      <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                        {event.analysis?.category || 'General'}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{event.source}</span>
                      <span className="text-slate-500">•</span>
                      <div className="flex items-center text-xs text-slate-500">
                        <Calendar className="mr-1 w-3 h-3" />
                        {new Date(event.publishedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Impact Score */}
                  <div className="ml-4 text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {getPriceImpactIcon(event.analysis?.priceImpact)}
                      <span className={`text-sm font-medium ${getSignificanceColor(event.analysis?.significance)}`}>
                        {((event.analysis?.significance || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Significance</p>
                  </div>
                </div>

                {/* AI Analysis */}
                {event.analysis && (
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-white mb-3">AI Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Market Impact</p>
                        <p className="text-sm text-white font-medium">
                          {((event.analysis.marketImpact || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Price Impact</p>
                        <div className="flex items-center">
                          {getPriceImpactIcon(event.analysis.priceImpact)}
                          <span className="ml-1 text-sm text-white capitalize">
                            {event.analysis.priceImpact || 'Neutral'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Confidence</p>
                        <p className="text-sm text-white font-medium">
                          {((event.analysis.confidence || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {event.analysis.affectedCryptos && event.analysis.affectedCryptos.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-400 mb-2">Affected Cryptocurrencies</p>
                        <div className="flex flex-wrap gap-1">
                          {event.analysis.affectedCryptos.map((crypto, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-600 text-xs text-white rounded">
                              {crypto}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.analysis.keyPoints && event.analysis.keyPoints.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Key Points</p>
                        <ul className="space-y-1">
                          {event.analysis.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start">
                              <span className="text-purple-400 mr-2">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Source Link */}
                {event.url && (
                  <div className="flex justify-end">
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-200"
                    >
                      Read Full Article
                      <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}

            {getFilteredEvents().length === 0 && (
              <div className="text-center py-12">
                <Newspaper className="mx-auto w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400">No events found for the selected category</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Newspaper className="mx-auto w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No News Events</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              No significant crypto news events detected and analyzed by AI in the last 12 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
