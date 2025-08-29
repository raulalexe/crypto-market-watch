import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import pushNotificationService from './services/pushNotificationService';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import AuthModal from './components/AuthModal';

import About from './components/About';
import ErrorLogs from './components/ErrorLogs';
import DataExport from './components/DataExport';
import AlertsPage from './components/AlertsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import AdvancedDataExport from './components/AdvancedDataExport';
import CustomAlertThresholds from './components/CustomAlertThresholds';
import HistoricalData from './components/HistoricalData';
import SubscriptionPlans from './components/SubscriptionPlans';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import AuthRequired from './components/AuthRequired';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import Profile from './components/Profile';
import ContactForm from './components/ContactForm';
import UpcomingEventsPage from './components/UpcomingEventsPage';
import ReleaseSchedulePage from './components/ReleaseSchedulePage';
import MarketingPage from './components/MarketingPage';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUserData(null);
        return;
      }

      const response = await axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setUserData(null);
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
    // Check for existing auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    
    fetchDashboardData();
    fetchUserData();
    
    // Initialize push notifications
    initializePushNotifications();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const initializePushNotifications = async () => {
    try {
      const result = await pushNotificationService.initialize();
      if (result.success) {
        console.log('Push notifications initialized successfully');
        pushNotificationService.setupMessageListener();
      } else {
        console.log('Push notifications not available:', result.error);
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    fetchDashboardData();
    fetchUserData();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  // Check if current route is the landing page
  const isLandingPage = window.location.pathname === '/landing';

  if (loading && !dashboardData && !isLandingPage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
                {/* Marketing page as index - no header/sidebar */}
        <Routes>
          <Route path="/" element={<MarketingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          

          
          {/* App routes with header and sidebar */}
          <Route path="/app/*" element={
            <>
              <Header 
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                onRefreshClick={fetchDashboardData}
                onAuthClick={() => setAuthModalOpen(true)}
                onLogoutClick={handleLogout}
                loading={loading}
                isAuthenticated={isAuthenticated}
                userData={userData}
                setAuthModalOpen={setAuthModalOpen}
              />
              
              <div className="flex min-h-screen">
                <Sidebar 
                  isOpen={sidebarOpen} 
                  onClose={() => setSidebarOpen(false)}
                  userData={userData}
                />
                
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <Dashboard 
                          isAuthenticated={isAuthenticated}
                          userData={userData}
                        />
                      } 
                    />
                    <Route 
                      path="history" 
                      element={<HistoricalData userData={userData} />} 
                    />
                    
                    <Route 
                      path="data-export" 
                      element={<DataExport />} 
                    />
                    <Route 
                      path="alerts" 
                      element={<AlertsPage isAuthenticated={isAuthenticated} userData={userData} />} 
                    />
                    <Route 
                      path="events" 
                      element={<UpcomingEventsPage />} 
                    />
                    <Route 
                      path="releases" 
                      element={<ReleaseSchedulePage />} 
                    />
                    <Route 
                      path="advanced-analytics" 
                      element={<AdvancedAnalytics />} 
                    />
                    <Route 
                      path="advanced-export" 
                      element={<AdvancedDataExport />} 
                    />
                    <Route 
                      path="custom-alerts" 
                      element={<CustomAlertThresholds />} 
                    />
                    <Route 
                      path="errors" 
                      element={<ErrorLogs />} 
                    />
                    <Route 
                      path="subscription" 
                      element={<SubscriptionPlans setAuthModalOpen={setAuthModalOpen} />} 
                    />
                    <Route 
                      path="admin" 
                      element={<AdminDashboard isAuthenticated={isAuthenticated} userData={userData} />} 
                    />
                    <Route 
                      path="auth-required" 
                      element={<AuthRequired />} 
                    />
                    <Route 
                      path="profile" 
                      element={<Profile onProfileUpdate={fetchUserData} />} 
                    />
                    <Route 
                      path="contact" 
                      element={<ContactForm />} 
                    />
                    <Route 
                      path="privacy" 
                      element={<PrivacyPolicy />} 
                    />
                    <Route 
                      path="terms" 
                      element={<TermsAndConditions />} 
                    />
                    <Route 
                      path="about" 
                      element={<About />} 
                    />
                  </Routes>
                </main>
              </div>
              
              {/* Main Footer */}
              <footer className="bg-slate-800 border-t border-slate-700 py-6 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="text-slate-400 text-sm mb-4 md:mb-0">
                      <p>© 2024 Crypto Market Monitor. All rights reserved.</p>
                    </div>
                    <div className="flex space-x-6">
                      <Link 
                        to="/app/contact" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        Contact
                      </Link>
                      <Link 
                        to="/app/privacy" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        Privacy Policy
                      </Link>
                      <Link 
                        to="/app/terms" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        Terms & Conditions
                      </Link>
                      <Link 
                        to="/app/about" 
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        About
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </>
          } />
        </Routes>
      </div>
      
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </Router>
  );
}

export default App;