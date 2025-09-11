class PPINotificationService {
  constructor() {
    this.lastPPIDate = null;
    this.checkInterval = null;
    this.listeners = [];
  }

  // Start monitoring for PPI data releases
  startMonitoring() {
    // Check every 5 minutes for new PPI data
    this.checkInterval = setInterval(() => {
      this.checkForPPIRelease();
    }, 5 * 60 * 1000);

    // Initial check
    this.checkForPPIRelease();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check for new PPI data release
  async checkForPPIRelease() {
    try {
      const response = await fetch('/api/inflation/latest');
      const data = await response.json();

      if (data.ppi && data.ppi.date) {
        const currentPPIDate = data.ppi.date;
        
        // Check if this is new PPI data
        if (this.lastPPIDate !== currentPPIDate) {
          this.lastPPIDate = currentPPIDate;
          
          // Check if this is today's data (indicating a fresh release)
          const today = new Date().toISOString().split('T')[0];
          const ppiDate = new Date(currentPPIDate).toISOString().split('T')[0];
          
          if (ppiDate === today) {
            // This is a fresh PPI release, notify listeners
            this.notifyListeners({
              type: 'PPI_RELEASE',
              data: data.ppi,
              expectations: data.expectations,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking for PPI release:', error);
    }
  }

  // Add listener for PPI release notifications
  addListener(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error notifying PPI listener:', error);
      }
    });
  }

  // Check if PPI data was released today
  async wasPPIReleasedToday() {
    try {
      const response = await fetch('/api/inflation/latest');
      const data = await response.json();

      if (data.ppi && data.ppi.date) {
        const today = new Date().toISOString().split('T')[0];
        const ppiDate = new Date(data.ppi.date).toISOString().split('T')[0];
        
        return ppiDate === today;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking PPI release date:', error);
      return false;
    }
  }

  // Get latest PPI data
  async getLatestPPIData() {
    try {
      const response = await fetch('/api/inflation/latest');
      const data = await response.json();
      
      return data.ppi || null;
    } catch (error) {
      console.error('Error fetching PPI data:', error);
      return null;
    }
  }

  // Get market expectations for PPI
  async getPPIExpectations() {
    try {
      const response = await fetch('/api/inflation/expectations');
      const data = await response.json();
      
      return data.ppi || null;
    } catch (error) {
      console.error('Error fetching PPI expectations:', error);
      return null;
    }
  }
}

// Create singleton instance
const ppiNotificationService = new PPINotificationService();

export default ppiNotificationService;
