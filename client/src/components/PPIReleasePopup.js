import React, { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Activity, DollarSign, AlertTriangle } from 'lucide-react';

const PPIReleasePopup = ({ isOpen, onClose, ppiData, expectations }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen || !ppiData) return null;

  const getMoMColor = (value) => {
    if (value > 0) return 'text-red-400';
    if (value < 0) return 'text-green-400';
    return 'text-slate-400';
  };

  const getMoMIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getMarketImpact = () => {
    const ppiMoM = parseFloat(ppiData.ppiMoM);
    const coreMoM = parseFloat(ppiData.corePPIMoM);
    
    if (ppiMoM > 0.3 || coreMoM > 0.3) {
      return {
        sentiment: 'Bearish',
        color: 'text-red-400',
        icon: <TrendingUp className="w-4 h-4" />,
        description: 'Higher producer prices may lead to increased consumer inflation'
      };
    } else if (ppiMoM < -0.2 || coreMoM < -0.2) {
      return {
        sentiment: 'Bullish',
        color: 'text-green-400',
        icon: <TrendingDown className="w-4 h-4" />,
        description: 'Lower producer prices may ease consumer inflation pressure'
      };
    } else {
      return {
        sentiment: 'Neutral',
        color: 'text-slate-400',
        icon: <Activity className="w-4 h-4" />,
        description: 'Producer prices remain stable'
      };
    }
  };

  const marketImpact = getMarketImpact();

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">PPI Data Released</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PPI Data */}
        <div className="space-y-4">
          {/* Headline PPI */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Headline PPI</h4>
              <div className={`flex items-center space-x-1 ${getMoMColor(ppiData.ppiMoM)}`}>
                {getMoMIcon(ppiData.ppiMoM)}
                <span className="text-sm font-medium">
                  {ppiData.ppiMoM > 0 ? '+' : ''}{ppiData.ppiMoM}%
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              Index: {ppiData.ppi} | YoY: {ppiData.ppiYoY}%
            </div>
          </div>

          {/* Core PPI */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">Core PPI</h4>
              <div className={`flex items-center space-x-1 ${getMoMColor(ppiData.corePPIMoM)}`}>
                {getMoMIcon(ppiData.corePPIMoM)}
                <span className="text-sm font-medium">
                  {ppiData.corePPIMoM > 0 ? '+' : ''}{ppiData.corePPIMoM}%
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              Index: {ppiData.corePPI} | YoY: {ppiData.corePPIYoY}%
            </div>
          </div>

          {/* Market Impact */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h4 className="text-white font-medium">Market Impact</h4>
            </div>
            <div className={`flex items-center space-x-2 mb-2 ${marketImpact.color}`}>
              {marketImpact.icon}
              <span className="font-medium">{marketImpact.sentiment}</span>
            </div>
            <div className="text-sm text-slate-300">
              {marketImpact.description}
            </div>
          </div>

          {/* Expectations vs Actual */}
          {expectations && expectations.ppi && (
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">vs. Expectations</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">PPI MoM Expected:</span>
                  <span className="text-slate-400">{expectations.ppi.headline.consensus}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Core PPI MoM Expected:</span>
                  <span className="text-slate-400">{expectations.ppi.core.consensus}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">PPI YoY Expected:</span>
                  <span className="text-slate-400">{expectations.ppi.yoy.consensus}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-slate-400 text-center">
            Data for: {new Date(ppiData.date).toLocaleDateString()}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Navigate to inflation data page
              window.location.href = '/app/dashboard';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PPIReleasePopup;
