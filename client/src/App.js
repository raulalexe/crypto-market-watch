import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams, useNavigate } from 'react-router-dom';
import pushNotificationService from './services/pushNotificationService';
import authService from './services/authService';
import websocketService from './services/websocketService';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import AuthModal from './components/AuthModal';
import UmamiAnalytics from './components/UmamiAnalytics';

import About from './components/About';
import MarketingAbout from './components/MarketingAbout';
import ErrorLogs from './components/ErrorLogs';
import DataExport from './components/DataExport';
import AlertsPage from './components/AlertsPage';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import CustomAlertThresholds from './components/CustomAlertThresholds';
import HistoricalData from './components/HistoricalData';
import SubscriptionPlans from './components/SubscriptionPlans';

import AdminDashboard from './components/AdminDashboard';
import AuthRequired from './components/AuthRequired';
import NewsPage from './components/NewsPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import Profile from './components/Profile';
import ContactForm from './components/ContactForm';
import UpcomingEventsPage from './components/UpcomingEventsPage';
import MarketingPage from './components/MarketingPage';
import PricesPage from './components/PricesPage';
import UnsubscribeSuccess from './components/UnsubscribeSuccess';
import PasswordReset from './components/PasswordReset';
import EmailConfirmSuccess from './components/EmailConfirmSuccess';
import EmailConfirmError from './components/EmailConfirmError';
import PPIReleasePopup from './components/PPIReleasePopup';
import ppiNotificationService from './services/ppiNotificationService';
import RenewalReminder from './components/RenewalReminder';
import WebSocketMaintenanceScreen from './components/WebSocketMaintenanceScreen';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ppiPopupOpen, setPpiPopupOpen] = useState(false);
  const [ppiData, setPpiData] = useState(null);
  const [ppiExpectations, setPpiExpectations] = useState(null);

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

  useEffect(() => {
    // Check for existing auth token using auth service
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
      fetchUserData();
      
      // Initialize WebSocket connection for authenticated users
      const token = localStorage.getItem('authToken');
      if (token) {
        websocketService.connect(token).catch(error => {
          console.error('WebSocket connection failed:', error);
        });
      }
    }
    
    fetchDashboardData();
    
    // Initialize push notifications
    initializePushNotifications();
    
    // PPI notification service disabled - using WebSocket for real-time updates
    // const unsubscribePPI = ppiNotificationService.addListener((notification) => {
    //   if (notification.type === 'PPI_RELEASE') {
    //     setPpiData(notification.data);
    //     setPpiExpectations(notification.expectations);
    //     setPpiPopupOpen(true);
    //   }
    // });
    
    // Start monitoring for PPI releases
    // ppiNotificationService.startMonitoring();
    
    // WebSocket will handle real-time updates, no need for polling
    
    return () => {
      // unsubscribePPI();
      // ppiNotificationService.stopMonitoring();
    };
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

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    await fetchUserData();
    
    // Initialize WebSocket connection after successful authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      websocketService.connect(token).catch(error => {
        console.error('WebSocket connection failed after auth:', error);
      });
    }
    
    // Clear auth parameters from URL after successful authentication
    const url = new URL(window.location);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url.toString());
    
    // Check if user is admin and refresh page to ensure all components update properly
    if (token) {
      try {
        const response = await axios.get('/api/subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // If user is admin, refresh the page to ensure all UI components update
        if (response.data && response.data.role === 'admin') {
          console.log('Admin user detected, refreshing page to update UI...');
          window.location.reload();
          return;
        }
      } catch (error) {
        console.error('Error checking user role after login:', error);
      }
    }
    
    fetchDashboardData();
    // Scroll to top of the page after successful authentication
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    // Reload the page to clear any cached data and ensure clean state
    window.location.reload();
  };

  // Component to handle URL parameters and auth modal state
  const AppRoutes = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Handle auth query parameters
    useEffect(() => {
      const authParam = searchParams.get('auth');
      if (authParam === 'register' || authParam === 'signup' || authParam === 'login') {
        setAuthModalOpen(true);
        // Scroll to top when modal opens due to URL parameter
        window.scrollTo(0, 0);
      }
      // Don't automatically close modal when no auth param - let it be controlled by other components
    }, [searchParams]);

    // Function to close modal and clear URL parameters
    const handleCloseModal = () => {
      setAuthModalOpen(false);
      // Navigate to the same path without the auth parameter
      const currentPath = window.location.pathname;
      navigate(currentPath, { replace: true });
      // Scroll to top of the page
      window.scrollTo(0, 0);
    };

    // Always show full dashboard for all users (freemium removed)

    return (
      <>
        {/* Always show Header/Sidebar for all users */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onAuthClick={() => {
            window.location.href = '/app?auth=login';
          }}
          onLogoutClick={handleLogout}
          loading={loading}
          isAuthenticated={isAuthenticated}
          userData={userData}
          setAuthModalOpen={setAuthModalOpen}
        />
        
        <div className="flex min-h-screen">
          {/* Always show Sidebar for all users */}
          <Sidebar 
            userData={userData} 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
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
                path="news" 
                element={<NewsPage />} 
              />
              <Route 
                path="prices" 
                element={<PricesPage />} 
              />
              <Route 
                path="advanced-analytics" 
                element={<AdvancedAnalytics userData={userData} />} 
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
                <p>© 2025 Crypto Market Watch. All rights reserved.</p>
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
        
        <AuthModal 
          isOpen={authModalOpen}
          onClose={handleCloseModal}
          onAuthSuccess={handleAuthSuccess}
          initialMode={searchParams.get('auth') === 'register' || searchParams.get('auth') === 'signup' ? 'signup' : 'login'}
        />
        
        {/* Renewal Reminder */}
        {isAuthenticated && userData && (
          <RenewalReminder 
            userData={userData}
            onRenewalComplete={() => {
              fetchUserData(); // Refresh user data after renewal
            }}
          />
        )}
      </>
    );
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
      <UmamiAnalytics />
      <div className="min-h-screen bg-slate-900">
                {/* Marketing page as index - no header/sidebar */}
        <Routes>
          <Route path="/" element={<MarketingPage />} />

          <Route path="/about" element={<MarketingAbout />} />
          <Route path="/unsubscribe-success" element={<UnsubscribeSuccess />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/auth/confirm-success" element={<EmailConfirmSuccess />} />
          <Route path="/auth/confirm-error" element={<EmailConfirmError />} />
          

          
          {/* App routes with header and sidebar */}
          <Route path="/app/*" element={
            <WebSocketMaintenanceScreen>
              <AppRoutes />
            </WebSocketMaintenanceScreen>
          } />
        </Routes>
      </div>
      
      {/* PPI Release Popup */}
      <PPIReleasePopup
        isOpen={ppiPopupOpen}
        onClose={() => setPpiPopupOpen(false)}
        ppiData={ppiData}
        expectations={ppiExpectations}
      />
    </Router>
  );
}

export default App;