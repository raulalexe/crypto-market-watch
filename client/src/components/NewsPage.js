import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  Calendar,
  Star,
  BarChart3,
  X,
  AlertCircle
} from 'lucide-react';
import websocketService from '../services/websocketService';

const NewsPage = () => {
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImpact, setFilterImpact] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showHighImpactModal, setShowHighImpactModal] = useState(false);
  const [highImpactNews, setHighImpactNews] = useState([]);

  // Helper function to get impact score (use pre-calculated value from database)
  const getWeightedImpactScore = (event) => {
    // Use the pre-calculated impactScore from database if available
    if (event.impactScore !== undefined && event.impactScore !== null) {
      return parseFloat(event.impactScore) || 0;
    }
    
    // Fallback to calculation if impactScore is not available
    if (!event.analysis) return 0;
    const impact = parseFloat(event.analysis.marketImpact) || 0;
    const confidence = parseFloat(event.analysis.confidence) || 0;
    return (impact * 2 + confidence) / 3;
  };

  // Check for high-impact news and show modal if conditions are met
  const checkForHighImpactNews = useCallback(async (data) => {
    if (!data || !data.events) return;

    try {
      // First check if the environment variable allows popups
      const configResponse = await fetch('/api/config/popup-urgent-news');
      const configData = await configResponse.json();
      
      if (!configData.enabled) {
        return; // Don't show modal if env var is not set to true
      }

      // Check if we have high-impact events (over 70%)
      const highImpactEvents = data.events.filter(event => {
        const score = getWeightedImpactScore(event);
        const isHighImpact = score >= 0.7;
        
        // Check if the event was detected within the last 4 hours
        const detectedAt = new Date(event.detectedAt || event.publishedAt);
        const now = new Date();
        const hoursSinceDetection = (now - detectedAt) / (1000 * 60 * 60);
        const isRecent = hoursSinceDetection <= 4;
        
        return isHighImpact && isRecent;
      });

      if (highImpactEvents.length > 0) {
        setHighImpactNews(highImpactEvents);
        setShowHighImpactModal(true);
      }
    } catch (error) {
      console.error('Error checking popup config:', error);
      // Fail silently - don't show modal if there's an error
    }
  }, []); // No dependencies needed as it only uses its parameter and setState

  // Initial data fetch on component mount
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/news-events');
      const events = response.data;
      if (Array.isArray(events)) {
        // Transform the events array to match the expected format
        const newsData = {
          hasEvents: events.length > 0,
          eventCount: events.length,
          events: events,
          lastUpdate: new Date().toISOString()
        };
        
        setNewsData(newsData);
        setLastUpdate(new Date());
        
        // Check for high-impact news modal (only if env var allows)
        checkForHighImpactNews(newsData);
      }
    } catch (err) {
      console.error('Error fetching crypto news:', err);
      setError('Failed to load crypto news');
    } finally {
      setLoading(false);
    }
  }, [checkForHighImpactNews]); // Depends on checkForHighImpactNews

  useEffect(() => {
    // Load initial data
    fetchInitialData();

    // Set up WebSocket listener for real-time updates
    const handleDashboardUpdate = (data) => {
      if (data.data && data.data.cryptoEvents) {
        // For WebSocket updates, we still get the dashboard format
        setNewsData(data.data.cryptoEvents);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
        
        // Check for high-impact news modal on WebSocket updates too
        checkForHighImpactNews(data.data.cryptoEvents);
      }
    };

    websocketService.on('dashboard_update', handleDashboardUpdate);

    return () => {
      websocketService.off('dashboard_update', handleDashboardUpdate);
    };
  }, [fetchInitialData, checkForHighImpactNews]); // Add missing dependencies

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hack': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'regulation': return <Shield className="w-4 h-4 text-yellow-400" />;
      case 'market': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'institutional': return <Building className="w-4 h-4 text-blue-400" />;
      case 'technical': return <Settings className="w-4 h-4 text-green-400" />;
      case 'exchange': return <Building className="w-4 h-4 text-orange-400" />;
      case 'general': return <Newspaper className="w-4 h-4 text-slate-400" />;
      default: return <Newspaper className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'hack':
        return 'bg-red-900/20 border-red-500/30';
      case 'regulation':
        return 'bg-yellow-900/20 border-yellow-500/30';
      case 'market':
        return 'bg-purple-900/20 border-purple-500/30';
      case 'institutional':
        return 'bg-blue-900/20 border-blue-500/30';
      case 'technical':
        return 'bg-green-900/20 border-green-500/30';
      case 'exchange':
        return 'bg-orange-900/20 border-orange-500/30';
      case 'general':
        return 'bg-slate-700 border-slate-600';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  const getCategoryButtonColor = (category, isActive) => {
    if (!isActive) {
      return 'bg-slate-700 text-slate-300 hover:bg-slate-600';
    }
    
    switch (category) {
      case 'hack':
        return 'bg-red-600 text-white';
      case 'regulation':
        return 'bg-yellow-600 text-white';
      case 'market':
        return 'bg-purple-600 text-white';
      case 'institutional':
        return 'bg-blue-600 text-white';
      case 'technical':
        return 'bg-green-600 text-white';
      case 'exchange':
        return 'bg-orange-600 text-white';
      case 'general':
        return 'bg-slate-600 text-white';
      default:
        return 'bg-purple-600 text-white'; // Default for 'all'
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
    
    let filtered = newsData.events;

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(event => 
        event.analysis?.category === filterCategory
      );
    }

    // Filter by impact level
    if (filterImpact !== 'all') {
      filtered = filtered.filter(event => {
        const weightedScore = getWeightedImpactScore(event);
        switch (filterImpact) {
          case 'high':
            return weightedScore >= 0.7;
          case 'medium':
            return weightedScore >= 0.4 && weightedScore < 0.7;
          case 'low':
            return weightedScore < 0.4;
          default:
            return true;
        }
      });
    }

    // Filter by date
    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const publishedDate = new Date(event.publishedAt);
        const daysDiff = Math.floor((now - publishedDate) / (1000 * 60 * 60 * 24));
        
        switch (filterDate) {
          case 'today':
            return daysDiff === 0;
          case 'yesterday':
            return daysDiff === 1;
          case 'week':
            return daysDiff <= 7;
          default:
            return true;
        }
      });
    }

    // Sort by weighted impact score (highest first)
    return filtered.sort((a, b) => getWeightedImpactScore(b) - getWeightedImpactScore(a));
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'market', label: 'Market', icon: Activity },
    { value: 'institutional', label: 'Institutional', icon: Building },
    { value: 'regulation', label: 'Regulation', icon: Shield },
    { value: 'hack', label: 'Security', icon: AlertTriangle },
    { value: 'exchange', label: 'Exchange', icon: Building },
    { value: 'technical', label: 'Technical', icon: Settings },
    { value: 'general', label: 'General', icon: Newspaper }
  ];

  const impactLevels = [
    { value: 'all', label: 'All Impact Levels' },
    { value: 'high', label: 'High Impact (70%+)', icon: Star, color: 'bg-red-600' },
    { value: 'medium', label: 'Medium Impact (40-69%)', icon: BarChart3, color: 'bg-orange-600' },
    { value: 'low', label: 'Low Impact (<40%)', icon: Activity, color: 'bg-green-600' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' }
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
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Newspaper className="mr-3 w-8 h-8 text-purple-400" />
              Crypto News Analysis
            </h1>
            <p className="mt-2 text-slate-400">
              AI-analyzed cryptocurrency news events with market impact assessment
            </p>
          </div>
          
          {lastUpdate && (
            <div className="mt-4 flex items-center text-sm text-slate-500">
              <Clock className="mr-1 w-4 h-4" />
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </div>

        {/* Enhanced Filter Section */}
        <div className="mb-8 space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            <div className="text-sm text-slate-400">
              ({getFilteredEvents().length} of {newsData?.eventCount || 0} events)
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
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
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${getCategoryButtonColor(category.value, isActive)}`}
                    >
                      {Icon && <Icon className="mr-2 w-4 h-4" />}
                      <div className="flex-1 text-left">
                        <div>{category.label}</div>
                        <div className="text-xs opacity-70">({categoryEvents.length})</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impact Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Impact Level</label>
              <div className="space-y-2">
                {impactLevels.map(level => {
                  const Icon = level.icon;
                  const isActive = filterImpact === level.value;
                  
                  return (
                    <button
                      key={level.value}
                      onClick={() => setFilterImpact(level.value)}
                      className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive 
                          ? (level.color || 'bg-purple-600') + ' text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {Icon && <Icon className="mr-2 w-4 h-4" />}
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
              <div className="space-y-2">
                {dateRanges.map(range => {
                  const isActive = filterDate === range.value;
                  
                  return (
                    <button
                      key={range.value}
                      onClick={() => setFilterDate(range.value)}
                      className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Calendar className="mr-2 w-4 h-4" />
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(filterCategory !== 'all' || filterImpact !== 'all' || filterDate !== 'all') && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setFilterCategory('all');
                  setFilterImpact('all');
                  setFilterDate('all');
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}
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
              <div key={index} className={`rounded-lg p-6 border ${getCategoryColor(event.analysis?.category)}`}>
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
                      <span className={`text-lg font-bold ${getSignificanceColor(getWeightedImpactScore(event))}`}>
                        {(getWeightedImpactScore(event) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Impact Score</p>
                  </div>
                </div>

                {/* AI Analysis */}
                {event.analysis && (
                  <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-white mb-3">AI Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Market Impact</p>
                        <p className="text-sm text-white font-medium">
                          {((parseFloat(event.analysis.marketImpact) || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Confidence</p>
                        <p className="text-sm text-white font-medium">
                          {((parseFloat(event.analysis.confidence) || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Impact Score</p>
                        <p className={`text-sm font-bold ${getSignificanceColor(getWeightedImpactScore(event))}`}>
                          {(getWeightedImpactScore(event) * 100).toFixed(0)}%
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

        {/* High Impact News Modal */}
        {showHighImpactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-red-500/30">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <h2 className="text-xl font-bold text-white">High Impact News Alert</h2>
                </div>
                <button
                  onClick={() => setShowHighImpactModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-slate-300 mb-4">
                  {highImpactNews.length === 1 ? 'A high-impact crypto event' : `${highImpactNews.length} high-impact crypto events`} 
                  {' '}ha{highImpactNews.length === 1 ? 's' : 've'} been detected that may significantly affect the market.
                </p>

                <div className="space-y-4">
                  {highImpactNews.slice(0, 3).map((event, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(event.analysis?.category)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(event.analysis?.category)}
                          <span className="text-sm font-medium text-slate-300 capitalize">
                            {event.analysis?.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${getSignificanceColor(getWeightedImpactScore(event))}`}>
                            {(getWeightedImpactScore(event) * 100).toFixed(0)}%
                          </span>
                          <p className="text-xs text-slate-500">Impact Score</p>
                        </div>
                      </div>

                      <h4 className="text-white font-semibold mb-2 line-clamp-2">
                        {event.title}
                      </h4>

                      {event.description && (
                        <p className="text-slate-400 text-sm mb-3 line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      {event.analysis?.keyPoints && event.analysis.keyPoints.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-400 mb-2">Key Points:</p>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {event.analysis.keyPoints.slice(0, 2).map((point, pointIndex) => (
                              <li key={pointIndex} className="flex items-start space-x-2">
                                <span className="text-red-400 mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.url && (
                        <a 
                          href={event.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-red-400 hover:text-red-300"
                        >
                          Read Full Article
                          <ExternalLink className="ml-1 w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {highImpactNews.length > 3 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400">
                      {highImpactNews.length - 3} more high-impact event{highImpactNews.length - 3 !== 1 ? 's' : ''} available below.
                    </p>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowHighImpactModal(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      setShowHighImpactModal(false);
                      setFilterImpact('high');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    View All High Impact
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
