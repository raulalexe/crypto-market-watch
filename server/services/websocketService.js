const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socketId mapping
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://www.crypto-market-watch.xyz']
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          if (!token) {
            socket.emit('auth_error', { message: 'No token provided' });
            return;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.userId;
          
          // Store user mapping
          this.connectedClients.set(userId, socket.id);
          socket.userId = userId;
          
          // Join user-specific room
          socket.join(`user_${userId}`);
          
          console.log(`✅ User ${userId} authenticated via WebSocket`);
          socket.emit('authenticated', { userId, message: 'Successfully authenticated' });
          
          // Send initial data
          this.sendInitialData(socket, userId);
          
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          socket.emit('auth_error', { message: 'Invalid token' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
          console.log(`🔌 User ${socket.userId} disconnected`);
        }
      });

      // Handle subscription to specific data types
      socket.on('subscribe', (data) => {
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
      this.io.to(`user_${userId}`).emit('dashboard_update', { data });
      this.io.to('data_dashboard').emit('dashboard_update', { data });
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
}

module.exports = new WebSocketService();
