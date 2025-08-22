import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const triggerDataCollection = async () => {
    try {
      setLoading(true);
      await axios.post('/api/collect-data');
      await fetchDashboardData();
    } catch (err) {
      console.error('Error triggering data collection:', err);
      setError('Failed to trigger data collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onRefreshClick={fetchDashboardData}
          onCollectDataClick={triggerDataCollection}
          loading={loading}
        />
        
        <div className="flex">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
          />
          
          <main className="flex-1 p-4 md:p-6">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    data={dashboardData}
                    loading={loading}
                    error={error}
                    onRefresh={fetchDashboardData}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;