import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import NarrativesCard from './NarrativesCard';
import Layer1Card from './Layer1Card';
import AdvancedMetricsCard from './AdvancedMetricsCard';
import AIAnalysisCard from './AIAnalysisCard';
import DataCollectionCard from './DataCollectionCard';
import BacktestCard from './BacktestCard';
import UpcomingEventsCard from './UpcomingEventsCard';
import AlertCard from './AlertCard';
import InflationDataCard from './InflationDataCard';
import MoneySupplyCard from './MoneySupplyCard';

const Dashboard = ({ isAuthenticated, userData }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataCollectionExpanded, setDataCollectionExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/dashboard?t=${Date.now()}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/alerts?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the acknowledged alert from the list
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/app/subscription');
  };

  const renderSubscriptionButton = () => {
    const subscriptionStatus = dashboardData?.subscriptionStatus;
    const isLaunchPhase = process.env.REACT_APP_LAUNCH_PHASE === 'true';
    
    // Check if user is admin from userData props (more reliable than dashboardData)
    const isAdminUser = userData && (userData.role === 'admin' || userData.isAdmin === true);
    
    if (isAdminUser) {
      // Admin user - show ADMIN badge
      return (
        <div className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>ADMIN</span>
        </div>
      );
    }
    
    if (!subscriptionStatus) {
      // No subscription - show upgrade to Pro
      if (isLaunchPhase) {
        return (
          <div className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Coming Soon</span>
          </div>
        );
      }
      return (
        <button
          onClick={handleUpgradeClick}
          className="bg-crypto-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>Upgrade to Pro</span>
        </button>
      );
    }

    if (subscriptionStatus.plan === 'admin') {
      // Admin user - show ADMIN badge (fallback check)
      return (
        <div className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>ADMIN</span>
        </div>
      );
    }

    if (subscriptionStatus.plan === 'pro') {
      // Pro user - show upgrade to Premium+
      return (
        <button
          onClick={handleUpgradeClick}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>Upgrade to Premium+</span>
        </button>
      );
    }

    // Premium+ or other plans - show current plan
    return (
      <div className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2">
        <Zap className="w-5 h-5" />
        <span>{subscriptionStatus.planName || subscriptionStatus.plan}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with Subscription Button */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Market Dashboard</h1>
          <p className="text-gray-400">Real-time cryptocurrency market insights and analysis</p>
        </div>
        <div className="md:self-end">
          {renderSubscriptionButton()}
        </div>
      </div>

      {/* Dashboard Cards - Single Column Layout */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Data Collection Card - Admin only */}
        {userData?.isAdmin && (
          <DataCollectionCard 
            lastCollectionTime={dashboardData?.lastCollectionTime}
            onCollectData={fetchDashboardData}
            expanded={dataCollectionExpanded}
            onToggleExpanded={() => setDataCollectionExpanded(!dataCollectionExpanded)}
          />
        )}
        
        <AIAnalysisCard data={dashboardData?.aiAnalysis} />
        
        {/* Inflation Data Card */}
        <InflationDataCard userData={userData} />
        
        {/* Money Supply Card */}
        <MoneySupplyCard />
        
        {/* Alert Card - Show for all users, component handles upgrade prompts */}
        <AlertCard 
          alerts={alerts} 
          onAcknowledge={handleAcknowledgeAlert} 
          userData={userData}
        />
        
        {/* Other Cards */}
        <UpcomingEventsCard events={dashboardData?.upcomingEvents} />
        <NarrativesCard data={dashboardData?.trendingNarratives} />
        <AdvancedMetricsCard data={dashboardData?.advancedMetrics} />
        <BacktestCard data={dashboardData?.backtestResults} />
        <Layer1Card data={dashboardData?.layer1Data} />

      </div>
    </div>
  );
};

export default Dashboard;