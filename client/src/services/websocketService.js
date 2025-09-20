import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://www.crypto-market-watch.xyz'
        : 'http://localhost:3001';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        // Debug logging removed for production
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Authenticate with token
        this.socket.emit('authenticate', { token });
        resolve();
      });

      this.socket.on('authenticated', (data) => {
        // Debug logging removed for production
        this.setupEventListeners();
      });

      this.socket.on('auth_error', (error) => {
        console.error('❌ WebSocket authentication failed:', error);
        reject(new Error(error.message));
      });

      this.socket.on('disconnect', (reason) => {
        // Debug logging removed for production
        this.isConnected = false;
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  setupEventListeners() {
    // Alerts updates
    this.socket.on('alerts_update', (data) => {
      this.emit('alerts_update', data);
    });

    this.socket.on('new_alert', (data) => {
      this.emit('new_alert', data);
    });

    // Dashboard updates
    this.socket.on('dashboard_update', (data) => {
      this.emit('dashboard_update', data);
    });

    // Subscription updates
    this.socket.on('subscription_update', (data) => {
      this.emit('subscription_update', data);
    });

    // Market data updates
    this.socket.on('market_data_update', (data) => {
      this.emit('market_data_update', data);
    });

    // Inflation data updates
    this.socket.on('inflation_data_update', (data) => {
      this.emit('inflation_data_update', data);
    });

    // Events updates
    this.socket.on('events_update', (data) => {
      this.emit('events_update', data);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    // Debug logging removed for production
    
    setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.connect(token).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  subscribe(dataType) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { dataType });
    }
  }

  unsubscribe(dataType) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', { dataType });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Utility methods
  isConnectedToServer() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getConnectionState() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
export default new WebSocketService();
