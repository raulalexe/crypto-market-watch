const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socketId mapping
    this.broadcastTimeouts = new Map(); // userId -> timeout mapping for debouncing
    this.connectionTimestamps = new Map(); // socketId -> timestamp mapping
    this.idleTimeout = 30 * 60 * 1000; // 30 minutes idle timeout
    this.cleanupInterval = 5 * 60 * 1000; // Check every 5 minutes
    this.cleanupTimer = null;
  }

  initialize(server) {
    // Build allowed origins for production
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://www.crypto-market-watch.xyz']
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // Add Railway URLs if available
    if (process.env.RAILWAY_STATIC_URL) {
      allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }

    this.io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      maxHttpBufferSize: 1e6, // 1MB limit
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      upgradeTimeout: 10000, // 10 seconds
      allowEIO3: true
    });

    this.setupEventHandlers();
    this.startIdleConnectionCleanup();
    console.log('🔌 WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id} (Total connections: ${this.io.engine.clientsCount})`);
      
      // Track connection timestamp
      this.connectionTimestamps.set(socket.id, Date.now());
      
      // Monitor connection count
      if (this.io.engine.clientsCount > 50) {
        console.warn(`⚠️ High WebSocket connection count: ${this.io.engine.clientsCount}`);
      }

      // Track activity for all socket events
      const updateActivity = () => {
        this.connectionTimestamps.set(socket.id, Date.now());
      };

      // Handle authentication
      socket.on('authenticate', async (data) => {
        updateActivity(); // Track activity
        try {
          const { token } = data;
          if (!token) {
            console.log('❌ WebSocket auth: No token provided');
            socket.emit('auth_error', { 
              message: 'No token provided',
              code: 'NO_TOKEN'
            });
            return;
          }

          console.log('🔐 WebSocket auth: Verifying token...');
          console.log('🔐 WebSocket JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'NOT SET');
          
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.userId;
          
          console.log('🔐 WebSocket token decoded, userId:', userId);
          
          // Verify user exists in database
          const { getUserById } = require('../database');
          const user = await getUserById(userId);
          
          if (!user) {
            console.log('❌ WebSocket auth: User not found for userId:', userId);
            socket.emit('auth_error', { 
              message: 'User not found',
              code: 'USER_NOT_FOUND',
              userId: userId
            });
            return;
          }
          
          // Store user mapping
          this.connectedClients.set(userId, socket.id);
          socket.userId = userId;
          
          // Join user-specific room
          socket.join(`user_${userId}`);
          
          console.log(`✅ User ${userId} (${user.email}) authenticated via WebSocket`);
          socket.emit('authenticated', { 
            userId, 
            email: user.email,
            message: 'Successfully authenticated' 
          });
          
          // Send initial data
          this.sendInitialData(socket, userId);
          
        } catch (error) {
          console.error('❌ WebSocket authentication error:', error.name, error.message);
          
          let errorResponse = {
            message: 'Authentication failed',
            code: 'AUTH_FAILED'
          };
          
          if (error.name === 'TokenExpiredError') {
            errorResponse = {
              message: 'Token expired',
              code: 'TOKEN_EXPIRED',
              expiredAt: error.expiredAt
            };
          } else if (error.name === 'JsonWebTokenError') {
            errorResponse = {
              message: 'Invalid token',
              code: 'INVALID_TOKEN',
              reason: error.message
            };
          } else {
            errorResponse.reason = error.message;
          }
          
          socket.emit('auth_error', errorResponse);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        // Clean up connection timestamp
        this.connectionTimestamps.delete(socket.id);
        
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
          
          // Clear any pending broadcast timeouts for this user
          const timeoutKey = `dashboard_${socket.userId}`;
          if (this.broadcastTimeouts.has(timeoutKey)) {
            clearTimeout(this.broadcastTimeouts.get(timeoutKey));
            this.broadcastTimeouts.delete(timeoutKey);
          }
          
          console.log(`🔌 User ${socket.userId} disconnected (Remaining connections: ${this.io.engine.clientsCount - 1})`);
        } else {
          console.log(`🔌 Anonymous client disconnected (Remaining connections: ${this.io.engine.clientsCount - 1})`);
        }
      });

      // Handle subscription to specific data types
      socket.on('subscribe', (data) => {
        updateActivity(); // Track activity
        const { dataType } = data;
        if (dataType && socket.userId) {
          socket.join(`data_${dataType}`);
          console.log(`📊 User ${socket.userId} subscribed to ${dataType}`);
        }
      });

      // Handle unsubscription
      socket.on('unsubscribe', (data) => {
        const { dataType } = data;
        if (dataType && socket.userId) {
          socket.leave(`data_${dataType}`);
          console.log(`📊 User ${socket.userId} unsubscribed from ${dataType}`);
        }
      });
    });
  }

  async sendInitialData(socket, userId) {
    try {
      // Send recent alerts
      const alerts = await this.getRecentAlerts(userId);
      socket.emit('alerts_update', { alerts });

      // Send subscription status
      const subscription = await this.getSubscriptionStatus(userId);
      socket.emit('subscription_update', { subscription });

    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  async getRecentAlerts(userId) {
    try {
      const { getAlerts } = require('../database');
      const alerts = await getAlerts(userId, 20);
      return alerts;
    } catch (error) {
      console.error('Error fetching alerts for WebSocket:', error);
      return [];
    }
  }

  async getSubscriptionStatus(userId) {
    try {
      const { getUserById } = require('../database');
      const user = await getUserById(userId);
      return {
        plan: user?.plan || 'free',
        status: user?.emailVerified ? 'active' : 'inactive',
        isAdmin: user?.isAdmin || false
      };
    } catch (error) {
      console.error('Error fetching subscription status for WebSocket:', error);
      return { plan: 'free', status: 'inactive', isAdmin: false };
    }
  }

  // Broadcast methods for different data types
  broadcastAlerts(userId, alerts) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('alerts_update', { alerts });
      this.io.to('data_alerts').emit('alerts_update', { alerts });
    }
  }

  broadcastNewAlert(alert) {
    if (this.io) {
      this.io.emit('new_alert', { alert });
    }
  }

  broadcastDashboardUpdate(userId, data) {
    if (this.io) {
      
      // Debounce broadcasts to prevent rapid successive updates
      const timeoutKey = `dashboard_${userId}`;
      
      // Clear existing timeout
      if (this.broadcastTimeouts.has(timeoutKey)) {
        clearTimeout(this.broadcastTimeouts.get(timeoutKey));
      }
      
      // Set new timeout for debounced broadcast
      const timeout = setTimeout(() => {
        this.io.to(`user_${userId}`).emit('dashboard_update', { data });
        this.io.to('data_dashboard').emit('dashboard_update', { data });
        this.broadcastTimeouts.delete(timeoutKey);
      }, 100); // 100ms debounce
      
      this.broadcastTimeouts.set(timeoutKey, timeout);
    }
  }

  broadcastSubscriptionUpdate(userId, subscription) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit('subscription_update', { subscription });
    }
  }

  broadcastMarketData(data) {
    if (this.io) {
      this.io.emit('market_data_update', { data });
      this.io.to('data_market').emit('market_data_update', { data });
    }
  }

  broadcastInflationData(data) {
    if (this.io) {
      this.io.emit('inflation_data_update', { data });
      this.io.to('data_inflation').emit('inflation_data_update', { data });
    }
  }

  broadcastEventUpdate(events) {
    if (this.io) {
      this.io.emit('events_update', { events });
      this.io.to('data_events').emit('events_update', { events });
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedClients.size;
  }

  // Get all connected user IDs
  getConnectedUserIds() {
    return Array.from(this.connectedClients.keys());
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  // Send message to all users
  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Start idle connection cleanup timer
  startIdleConnectionCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.cleanupInterval);
    
    console.log(`🕒 Started idle connection cleanup (checking every ${this.cleanupInterval / 1000 / 60} minutes)`);
  }

  // Clean up idle connections
  cleanupIdleConnections() {
    if (!this.io) return;
    
    const now = Date.now();
    const idleConnections = [];
    
    // Find idle connections
    for (const [socketId, timestamp] of this.connectionTimestamps.entries()) {
      const idleTime = now - timestamp;
      if (idleTime > this.idleTimeout) {
        idleConnections.push(socketId);
      }
    }
    
    // Disconnect idle connections
    if (idleConnections.length > 0) {
      console.log(`🧹 Cleaning up ${idleConnections.length} idle WebSocket connections`);
      
      for (const socketId of idleConnections) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(`⏰ Disconnecting idle connection: ${socketId} (idle for ${Math.round((now - this.connectionTimestamps.get(socketId)) / 1000 / 60)} minutes)`);
          socket.disconnect(true); // Force disconnect
        }
        this.connectionTimestamps.delete(socketId);
      }
    }
  }

  // Stop cleanup timer
  stopIdleConnectionCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('🛑 Stopped idle connection cleanup');
    }
  }

  // Get connection statistics
  getConnectionStats() {
    const now = Date.now();
    const stats = {
      totalConnections: this.connectionTimestamps.size,
      idleConnections: 0,
      activeConnections: 0,
      oldestConnection: null,
      newestConnection: null
    };
    
    let oldestTime = now;
    let newestTime = 0;
    
    for (const [socketId, timestamp] of this.connectionTimestamps.entries()) {
      const idleTime = now - timestamp;
      if (idleTime > this.idleTimeout) {
        stats.idleConnections++;
      } else {
        stats.activeConnections++;
      }
      
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        stats.oldestConnection = Math.round((now - timestamp) / 1000 / 60);
      }
      
      if (timestamp > newestTime) {
        newestTime = timestamp;
        stats.newestConnection = Math.round((now - timestamp) / 1000 / 60);
      }
    }
    
    return stats;
  }
}

module.exports = new WebSocketService();
