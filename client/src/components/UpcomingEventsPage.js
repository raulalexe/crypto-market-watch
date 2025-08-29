import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, Filter, Search, CalendarDays, Target, Info } from 'lucide-react';
import axios from 'axios';

const UpcomingEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    impact: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterAndSortEvents();
  }, [events, filters, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEvents = () => {
    let filtered = [...events];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // Apply impact filter
    if (filters.impact !== 'all') {
      filtered = filtered.filter(event => event.impact === filters.impact);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.source.toLowerCase().includes(searchLower)
      );
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getEventIcon = (category) => {
    switch (category) {
      case 'fed':
        return <DollarSign className="w-5 h-5" />;
      case 'crypto':
        return <TrendingUp className="w-5 h-5" />;
      case 'regulation':
        return <AlertTriangle className="w-5 h-5" />;
      case 'earnings':
        return <Users className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getDaysUntilText = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  };

  const getTimeUntilText = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffTime = eventDate - now;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 0) return 'Past';
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours`;
    return `${Math.floor(diffMinutes / 1440)} days`;
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'fed':
        return 'Federal Reserve';
      case 'crypto':
        return 'Cryptocurrency';
      case 'regulation':
        return 'Regulation';
      case 'earnings':
        return 'Earnings';
      default:
        return category;
    }
  };

  const getImpactLabel = (impact) => {
    switch (impact) {
      case 'high':
        return 'High Impact';
      case 'medium':
        return 'Medium Impact';
      case 'low':
        return 'Low Impact';
      default:
        return impact;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crypto-blue mx-auto mb-4"></div>
          <p className="text-slate-400">Loading upcoming events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchEvents}
            className="bg-crypto-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    total: events.length,
    highImpact: events.filter(e => e.impact === 'high').length,
    thisWeek: events.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length,
    nextMonth: events.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      const diffDays = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-8 h-8 text-crypto-blue" />
            <h1 className="text-3xl font-bold text-white">Upcoming Impactful Events</h1>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Stay ahead of market-moving events with our comprehensive calendar of upcoming Federal Reserve meetings, 
            crypto milestones, regulatory updates, and major earnings reports.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-crypto-blue" />
              <div>
                <p className="text-slate-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-red-400" />
              <div>
                <p className="text-slate-400 text-sm">High Impact</p>
                <p className="text-2xl font-bold text-white">{stats.highImpact}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3">
              <CalendarDays className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Next Month</p>
                <p className="text-2xl font-bold text-white">{stats.nextMonth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-crypto-blue" />
            <h2 className="text-lg font-semibold text-white">Filters & Search</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-crypto-blue"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
            >
              <option value="all">All Categories</option>
              <option value="fed">Federal Reserve</option>
              <option value="crypto">Cryptocurrency</option>
              <option value="regulation">Regulation</option>
              <option value="earnings">Earnings</option>
            </select>

            {/* Impact Filter */}
            <select
              value={filters.impact}
              onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
            >
              <option value="all">All Impact Levels</option>
              <option value="high">High Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="low">Low Impact</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
            >
              <option value="date">Sort by Date</option>
              <option value="impact">Sort by Impact</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No events match your filters</p>
              <button 
                onClick={() => setFilters({ category: 'all', impact: 'all', search: '' })}
                className="mt-4 text-crypto-blue hover:text-blue-400 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-lg ${getImpactColor(event.impact)}`}>
                          {getEventIcon(event.category)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(event.impact)}`}>
                            {getImpactLabel(event.impact)}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                            {getCategoryLabel(event.category)}
                          </span>
                        </div>
                        
                        <p className="text-slate-400 mb-3">{event.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Info className="w-4 h-4" />
                            <span>{event.source}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(event.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          timeZoneName: 'short'
                        })}
                      </div>
                      <div className="text-sm text-crypto-blue font-medium mt-1">
                        {getDaysUntilText(event.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsPage;
