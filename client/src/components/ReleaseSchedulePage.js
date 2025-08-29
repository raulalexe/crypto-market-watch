import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { 
  CalendarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const ReleaseSchedulePage = () => {
  const [releases, setReleases] = useState([]);
  const [nextRelease, setNextRelease] = useState(null);
  const [stats, setStats] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [positionData, setPositionData] = useState({
    currentExposure: 10000,
    currentLeverage: 3.0,
    currentStopLoss: 5.0
  });

  useEffect(() => {
    fetchReleaseData();
    const interval = setInterval(fetchReleaseData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchReleaseData = async () => {
    try {
      setLoading(true);
      const [releasesRes, nextReleaseRes, statsRes, strategyRes] = await Promise.all([
        axios.get('/api/releases?limit=20'),
        axios.get('/api/releases/next-high-impact'),
        axios.get('/api/releases/stats'),
        axios.get('/api/releases/strategy')
      ]);

      setReleases(releasesRes.data);
      setNextRelease(nextReleaseRes.data);
      setStats(statsRes.data);
      setStrategy(strategyRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching release data:', err);
      setError('Failed to load release schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'extreme': return 'text-red-600 bg-red-50 border-red-200';
      case 'emergency': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeUntil = (releaseDate, releaseTime) => {
    const releaseDateTime = moment(`${releaseDate} ${releaseTime}`, 'YYYY-MM-DD HH:mm');
    const now = moment();
    const diff = releaseDateTime.diff(now, 'minutes');
    
    if (diff <= 0) return 'Released';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return `${Math.floor(diff / 1440)}d ${Math.floor((diff % 1440) / 60)}h`;
  };

  const getMinutesUntil = (releaseDate, releaseTime) => {
    const releaseDateTime = moment(`${releaseDate} ${releaseTime}`, 'YYYY-MM-DD HH:mm');
    return releaseDateTime.diff(moment(), 'minutes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading release schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <button 
            onClick={fetchReleaseData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Economic Release Schedule
          </h1>
          <p className="text-gray-600">
            Track BLS CPI and BEA PCE releases with strategic trading recommendations
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Releases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Impact</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.highImpactUpcoming}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <InformationCircleIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {moment(stats.lastUpdated).format('MMM D, YYYY')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next High Impact Release Alert */}
        {nextRelease && strategy?.hasUpcomingRelease && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mt-1" />
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Next High-Impact Release: {nextRelease.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-red-700">
                      <CalendarIcon className="h-4 w-4 inline mr-1" />
                      {moment(`${nextRelease.date} ${nextRelease.time}`, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do YYYY')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      {moment(`${nextRelease.date} ${nextRelease.time}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">
                      <ChartBarIcon className="h-4 w-4 inline mr-1" />
                      {strategy.minutesUntil} minutes remaining
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(strategy.urgency)}`}>
                    {strategy.urgency.toUpperCase()} URGENCY
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(nextRelease.impact)}`}>
                    {nextRelease.impact.toUpperCase()} IMPACT
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Recommendations */}
        {strategy?.hasUpcomingRelease && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-2" />
                Strategy Recommendations
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline-based recommendations */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline Actions</h3>
                  <div className="space-y-4">
                    {strategy.recommendations
                      .filter(rec => rec.timeline !== 'general' && rec.timeline !== 'release_specific')
                      .map((rec, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{rec.timeline}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(rec.urgency)}`}>
                              {rec.urgency}
                            </span>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {rec.actions.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Hedging options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Hedging Options</h3>
                  <div className="space-y-3">
                    {strategy.hedgingOptions?.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{option.instrument}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            option.correlation === 'high' ? 'bg-red-100 text-red-800' :
                            option.correlation === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {option.correlation} correlation
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Position Management */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
              Position Management
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Exposure ($)
                </label>
                <input
                  type="number"
                  value={positionData.currentExposure}
                  onChange={(e) => setPositionData(prev => ({ ...prev, currentExposure: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Leverage (x)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={positionData.currentLeverage}
                  onChange={(e) => setPositionData(prev => ({ ...prev, currentLeverage: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stop Loss (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={positionData.currentStopLoss}
                  onChange={(e) => setPositionData(prev => ({ ...prev, currentStopLoss: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {nextRelease && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Recommendations for {nextRelease.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Suggested Exposure:</p>
                    <p className="font-medium text-gray-900">
                      ${(positionData.currentExposure * 0.5).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Suggested Leverage:</p>
                    <p className="font-medium text-gray-900">
                      {Math.min(positionData.currentLeverage * 0.5, 2.0).toFixed(1)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stop Loss Buffer:</p>
                    <p className="font-medium text-gray-900">
                      {(positionData.currentStopLoss * 2.0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Releases Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
              Upcoming Releases
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {releases.map((release) => {
                  const minutesUntil = getMinutesUntil(release.date, release.time);
                  const isUrgent = minutesUntil <= 60;
                  
                  return (
                    <tr 
                      key={release.id}
                      className={`hover:bg-gray-50 cursor-pointer ${isUrgent ? 'bg-red-50' : ''}`}
                      onClick={() => setSelectedRelease(release)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {release.type}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {release.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {release.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm').format('MMM D, YYYY')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm').format('h:mm A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          minutesUntil <= 30 ? 'bg-red-100 text-red-800' :
                          minutesUntil <= 60 ? 'bg-orange-100 text-orange-800' :
                          minutesUntil <= 1440 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {formatTimeUntil(release.date, release.time)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(release.impact)}`}>
                          {release.impact.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {release.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Release Details Modal */}
        {selectedRelease && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedRelease.title}
                  </h3>
                  <button
                    onClick={() => setSelectedRelease(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{selectedRelease.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date & Time</p>
                      <p className="text-gray-900">
                        {moment(`${selectedRelease.date} ${selectedRelease.time}`, 'YYYY-MM-DD HH:mm').format('dddd, MMMM Do YYYY h:mm A')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Timezone</p>
                      <p className="text-gray-900">{selectedRelease.timezone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Impact</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(selectedRelease.impact)}`}>
                        {selectedRelease.impact.toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Source</p>
                      <p className="text-gray-900">{selectedRelease.source}</p>
                    </div>
                  </div>
                  
                  {selectedRelease.url && (
                    <div>
                      <p className="text-sm text-gray-600">More Information</p>
                      <a 
                        href={selectedRelease.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View official release schedule
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseSchedulePage;