import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';

const UpcomingEventsCard = ({ events }) => {
  const [expanded, setExpanded] = useState(false);

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
        return <DollarSign className="w-4 h-4" />;
      case 'crypto':
        return <TrendingUp className="w-4 h-4" />;
      case 'regulation':
        return <AlertTriangle className="w-4 h-4" />;
      case 'earnings':
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getDaysUntilText = (daysUntil) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil < 7) return `${daysUntil} days`;
    if (daysUntil < 30) return `${Math.floor(daysUntil / 7)} weeks`;
    return `${Math.floor(daysUntil / 30)} months`;
  };

  const getTimeUntilText = (timeUntil) => {
    if (timeUntil < 60) return `${timeUntil} minutes`;
    if (timeUntil < 1440) return `${Math.floor(timeUntil / 60)} hours`;
    return `${Math.floor(timeUntil / 1440)} days`;
  };

  // Sort events by date (closest first)
  const sortedEvents = events?.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    return aTime - bTime;
  }) || [];

  // Filter to show only upcoming events
  const upcomingEvents = sortedEvents.filter(event => {
    const eventTime = new Date(event.date).getTime();
    const now = new Date().getTime();
    return eventTime > now;
  });

  // Get high impact events for summary
  const highImpactEvents = upcomingEvents.filter(event => event.impact === 'high');
  const mediumImpactEvents = upcomingEvents.filter(event => event.impact === 'medium');

  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
        </div>
        <div className="text-slate-400 text-center py-8">
          No upcoming events available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Upcoming Events</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">High Impact</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{highImpactEvents.length}</div>
          <div className="text-xs text-red-300">Events</div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">Medium Impact</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{mediumImpactEvents.length}</div>
          <div className="text-xs text-yellow-300">Events</div>
        </div>
        
        <div className="bg-slate-700/20 border border-slate-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{upcomingEvents.length}</div>
          <div className="text-xs text-slate-300">Upcoming</div>
        </div>
      </div>

      {/* Events List */}
      {expanded && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Event Details</h4>
          {upcomingEvents.slice(0, 10).map((event, index) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
            const timeUntil = Math.ceil((eventDate - now) / (1000 * 60));

            return (
              <div key={index} className={`border rounded-lg p-3 ${getImpactColor(event.impact)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getEventIcon(event.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-white">{event.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(event.impact)}`}>
                          {event.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{eventDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{eventDate.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{getDaysUntilText(daysUntil)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">
                      {event.category.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {upcomingEvents.length > 10 && (
            <div className="text-center text-sm text-slate-400 py-2">
              +{upcomingEvents.length - 10} more events
            </div>
          )}
        </div>
      )}

      {/* Quick View of Next High Impact Event */}
      {!expanded && highImpactEvents.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Next High Impact Event</span>
          </div>
          <div className="text-sm text-white font-medium mb-1">{highImpactEvents[0].title}</div>
          <div className="text-xs text-red-300">
            {new Date(highImpactEvents[0].date).toLocaleDateString()} • {getDaysUntilText(Math.ceil((new Date(highImpactEvents[0].date) - new Date()) / (1000 * 60 * 60 * 24)))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingEventsCard;
