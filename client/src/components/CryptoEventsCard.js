import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CryptoEventsCard = ({ cryptoEvents }) => {
  if (!cryptoEvents || !cryptoEvents.hasEvents) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Newspaper className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">AI News Analysis</h3>
        </div>
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Newspaper className="w-12 h-12 text-crypto-blue/50" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">No Recent Events</h4>
          <p className="text-slate-400 max-w-md mx-auto">
            No significant crypto news events detected and analyzed by AI in the last 2 hours.
          </p>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hack':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'regulation':
        return <Shield className="w-4 h-4 text-yellow-400" />;
      case 'market':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'institutional':
        return <Building className="w-4 h-4 text-blue-400" />;
      case 'technical':
        return <Settings className="w-4 h-4 text-green-400" />;
      case 'exchange':
        return <TrendingUp className="w-4 h-4 text-orange-400" />;
      default:
        return <Newspaper className="w-4 h-4 text-slate-400" />;
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
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  const getPriceImpactIcon = (impact) => {
    switch (impact) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriceImpactColor = (impact) => {
    switch (impact) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatTimeAgo = (publishedAt) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInMinutes = Math.floor((now - published) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Newspaper className="w-6 h-6 text-crypto-blue" />
            <h3 className="text-lg font-semibold text-white">AI News Analysis</h3>
          </div>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Last 2 hours</span>
        </div>
      </div>

      <div className="space-y-4">
        {cryptoEvents.events.slice(0, 5).map((event, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${getCategoryColor(event.analysis.category)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getCategoryIcon(event.analysis.category)}
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {event.analysis.category}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTimeAgo(event.publishedAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getPriceImpactIcon(event.analysis.priceImpact)}
                <span className={`text-sm font-medium ${getPriceImpactColor(event.analysis.priceImpact)}`}>
                  {event.analysis.priceImpact}
                </span>
              </div>
            </div>

            <h4 className="text-white font-medium mb-2 line-clamp-2">
              {event.title}
            </h4>

            {event.description && (
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span>Source: {event.source}</span>
                {event.analysis.affectedCryptos && event.analysis.affectedCryptos.length > 0 && (
                  <span>
                    Affects: {event.analysis.affectedCryptos.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">
                  Impact: {Math.round(event.analysis.marketImpact * 100)}%
                </span>
                <span className="text-xs text-slate-500">
                  Confidence: {Math.round(event.analysis.confidence * 100)}%
                </span>
              </div>
            </div>

            {event.analysis.keyPoints && event.analysis.keyPoints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <ul className="text-xs text-slate-400 space-y-1">
                  {event.analysis.keyPoints.slice(0, 2).map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start space-x-2">
                      <span className="text-slate-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.url && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <a 
                  href={event.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-crypto-blue hover:text-crypto-blue/80"
                >
                  <span>Read more</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {cryptoEvents.hasMoreEvents && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing 3 of {cryptoEvents.eventCount} events
            </p>
            <Link 
              to="/news" 
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
            >
              See More
              <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          Events detected and analyzed by AI from crypto news sources
        </p>
      </div>
    </div>
  );
};

export default CryptoEventsCard;
