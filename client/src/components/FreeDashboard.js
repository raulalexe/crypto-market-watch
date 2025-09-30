import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, 
  Lock, 
  BarChart3, 
  Brain,
  Newspaper,
  Activity,
  DollarSign,
  Zap
} from 'lucide-react';
import websocketService from '../services/websocketService';
import Header from './Header';

const FreeDashboard = () => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch limited preview data
    fetchPreviewData();
    
    // Set up WebSocket for live updates (adds excitement)
    const handleDashboardUpdate = (data) => {
      if (data.data) {
        setPreviewData(data.data);
        setLoading(false);
      }
    };

    websocketService.on('dashboard_update', handleDashboardUpdate);

    return () => {
      websocketService.off('dashboard_update', handleDashboardUpdate);
    };
  }, []);

  const fetchPreviewData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use only real data - no fallbacks
  const getRealAIAnalysis = () => {
    // Check multiple possible fields for AI analysis
    const analysis = previewData?.aiAnalysis?.overall_reasoning || 
                    previewData?.aiAnalysis?.analysis ||
                    previewData?.aiAnalysis?.providers?.venice?.overall_reasoning;
    
    if (analysis) {
      return analysis.slice(0, 150) + "...";
    }
    return "AI analysis data loading...";
  };

  const getRealNews = () => {
    if (previewData?.cryptoEvents?.events?.length) {
      const event = previewData.cryptoEvents.events[0];
      return `Latest: "${event.title?.slice(0, 60)}..." - Impact: ${Math.round((parseFloat(event.analysis?.marketImpact) || 0) * 100)}%`;
    }
    return "Latest crypto news loading...";
  };

  const getRealBTCPrice = () => {
    // Try different sources for BTC price
    const btcData = previewData?.layer1Data?.BTC || previewData?.marketData?.bitcoin;
    
    if (btcData?.price) {
      const price = parseFloat(btcData.price);
      const change = parseFloat(btcData.change_24h) || 0;
      const changeColor = change >= 0 ? 'text-green-400' : 'text-red-400';
      const changeSign = change >= 0 ? '+' : '';
      return {
        display: `$${price.toLocaleString()} (${changeSign}${change.toFixed(1)}%)`,
        color: changeColor
      };
    }
    return { display: "BTC price loading...", color: "text-gray-400" };
  };

  const getRealFearGreed = () => {
    if (previewData?.fearGreed?.value) {
      const value = previewData.fearGreed.value;
      const classification = previewData.fearGreed.classification || 'Unknown';
      return `${value} (${classification})`;
    }
    return "Fear & Greed loading...";
  };

  const getRealBTCDominance = () => {
    if (previewData?.advancedMetrics?.bitcoinDominance?.value) {
      return `${parseFloat(previewData.advancedMetrics.bitcoinDominance.value).toFixed(1)}%`;
    }
    return "BTC Dom loading...";
  };

  const getRealAISignal = () => {
    if (previewData?.aiAnalysis?.overall_direction) {
      const direction = previewData.aiAnalysis.overall_direction;
      const confidence = previewData.aiAnalysis.overall_confidence;
      const directionColor = direction === 'BULLISH' ? 'text-green-400' : 
                           direction === 'BEARISH' ? 'text-red-400' : 'text-yellow-400';
      return {
        display: `${direction} (${confidence}%)`,
        color: directionColor
      };
    }
    return {
      display: "AI signal loading...",
      color: "text-gray-400"
    };
  };

  const features = [
    {
      icon: Brain,
      title: "AI Market Analysis",
      description: "Real-time AI insights and predictions",
      preview: getRealAIAnalysis(),
      color: "text-purple-400"
    },
    {
      icon: BarChart3,
      title: "Advanced Metrics",
      description: "Bitcoin dominance, market sentiment, derivatives",
      preview: previewData ? `BTC Dominance: ${getRealBTCDominance()} • Fear & Greed: ${getRealFearGreed()}` : "Advanced metrics loading...",
      color: "text-blue-400"
    },
    {
      icon: Newspaper,
      title: "AI News Analysis",
      description: "Crypto events analyzed for market impact",
      preview: getRealNews(),
      color: "text-green-400"
    },
    {
      icon: Activity,
      title: "Layer 1 Blockchains",
      description: "Performance metrics for major blockchains",
      preview: previewData?.layer1Data ? 
        `${Object.keys(previewData.layer1Data).length} blockchains tracked` : 
        "Layer 1 data loading...",
      color: "text-orange-400"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header 
        onAuthClick={() => {
          window.location.href = '/app?auth=login';
        }}
        loading={false}
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-crypto-blue/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-crypto-blue to-purple-400 bg-clip-text text-transparent mb-6">
              Crypto Market Intelligence
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Real-time AI analysis, advanced metrics, and market insights. 
              See what's happening in crypto markets right now.
            </p>
            
            {/* Live Market Ticker - Real Data Only */}
            <div className="inline-flex items-center bg-slate-800/50 rounded-lg px-6 py-3 mb-8">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-slate-300">LIVE</span>
                </div>
                <div className="text-white">
                  BTC: <span className={`font-semibold ${getRealBTCPrice().color}`}>
                    {getRealBTCPrice().display}
                  </span>
                </div>
                <div className="text-white">
                  Fear & Greed: <span className="text-crypto-blue font-semibold">
                    {getRealFearGreed()}
                  </span>
                </div>
                <div className="text-white">
                  BTC Dom: <span className="text-orange-400 font-semibold">
                    {getRealBTCDominance()}
                  </span>
                </div>
                <div className="text-white">
                  <span className="text-purple-400">AI Signal:</span> 
                  <span className={`font-semibold ml-1 ${getRealAISignal().color}`}>
                    {getRealAISignal().display}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/app?auth=signup" 
                className="inline-flex items-center px-8 py-4 bg-crypto-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-lg"
              >
                <Star className="w-5 h-5 mr-2" />
                Start Free Account
              </Link>
              <Link 
                to="/app?auth=login" 
                className="inline-flex items-center px-8 py-4 border border-slate-600 hover:border-crypto-blue text-white font-semibold rounded-lg transition-colors text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-crypto-blue/50 transition-colors">
              <div className="flex items-center mb-4">
                <feature.icon className={`w-8 h-8 ${feature.color} mr-3`} />
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">{feature.description}</p>
              <div className="bg-slate-900 rounded p-3 text-sm">
                <div className="text-slate-400 mb-1">Preview:</div>
                <div className="text-white">{feature.preview}</div>
              </div>
              <div className="mt-4 text-center">
                <Link 
                  to="/app?auth=signup" 
                  className="inline-flex items-center text-crypto-blue hover:text-blue-400 text-sm font-medium"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Unlock Full Data
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Why Crypto Market Watch?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-crypto-blue to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-300">Advanced AI models analyze market sentiment, news, and trends in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Updates</h3>
              <p className="text-slate-300">Live WebSocket feeds ensure you never miss important market movements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Free Forever</h3>
              <p className="text-slate-300">Core features are completely free. Premium features for advanced users</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-crypto-blue/20 to-purple-600/20 border border-crypto-blue/30 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Join thousands of traders and investors who rely on our AI-powered insights. 
            Get started with your free account in seconds.
          </p>
          <Link 
            to="/app?auth=signup" 
            className="inline-flex items-center px-8 py-4 bg-crypto-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            <Star className="w-5 h-5 mr-2" />
            Create Free Account
          </Link>
          <div className="mt-4 text-sm text-slate-400">
            No credit card required • Free forever • Upgrade anytime
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeDashboard;
