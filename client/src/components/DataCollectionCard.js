import React, { useState } from 'react';
import { Clock, Play, CheckCircle, AlertCircle, Database } from 'lucide-react';

const DataCollectionCard = ({ onCollectData, loading, lastCollectionTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeSinceLastCollection = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const last = new Date(timestamp);
    const diffMs = now - last;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };

  const getStatusColor = (timestamp) => {
    if (!timestamp) return 'text-red-400';
    const now = new Date();
    const last = new Date(timestamp);
    const diffHours = (now - last) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'text-crypto-green';
    if (diffHours < 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (timestamp) => {
    if (!timestamp) return <AlertCircle className="w-5 h-5 text-red-400" />;
    const now = new Date();
    const last = new Date(timestamp);
    const diffHours = (now - last) / (1000 * 60 * 60);
    
    if (diffHours < 1) return <CheckCircle className="w-5 h-5 text-crypto-green" />;
    if (diffHours < 2) return <Clock className="w-5 h-5 text-yellow-400" />;
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-crypto-blue" />
            <div>
              <h3 className="text-lg font-semibold text-white">Data Collection</h3>
              <p className="text-sm text-slate-400">
                Runs every 1 hour automatically
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusIcon(lastCollectionTime)}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Last Collection</h4>
                <p className={`text-sm font-semibold ${getStatusColor(lastCollectionTime)}`}>
                  {formatTimestamp(lastCollectionTime)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {getTimeSinceLastCollection(lastCollectionTime)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Next Scheduled</h4>
                <p className="text-sm text-slate-300">
                  {(() => {
                    const now = new Date();
                    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
                    return nextHour.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                  })()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  At the top of the next hour
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Collection Schedule</h4>
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400">Frequency:</p>
                    <p className="text-white font-medium">Every 1 hour</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Method:</p>
                    <p className="text-white font-medium">Cron Jobs</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status:</p>
                    <p className="text-crypto-green font-medium">Active</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Timezone:</p>
                    <p className="text-white font-medium">UTC</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">Manual Collection</h4>
              <button
                onClick={onCollectData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Collecting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Collect Data Now</span>
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Manually trigger data collection from all sources
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCollectionCard;
