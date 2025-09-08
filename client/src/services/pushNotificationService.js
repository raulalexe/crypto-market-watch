class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    this.isSubscribed = false;
  }

  // Initialize push notifications
  async initialize() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return { success: false, error: 'Push notifications not supported' };
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            this.showUpdateNotification();
          }
        });
      });

      return { success: true, isSubscribed: this.isSubscribed };
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return { success: false, error: 'Push notifications not supported' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return { success: true, permission };
      } else if (permission === 'denied') {
        console.log('Notification permission denied');
        return { success: false, error: 'Permission denied' };
      } else {
        console.log('Notification permission dismissed');
        return { success: false, error: 'Permission dismissed' };
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.isSupported || !this.registration) {
      return { success: false, error: 'Push notifications not supported or not initialized' };
    }

    try {
      // Check authentication first
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        return { success: false, error: 'Authentication required. Please log in to enable push notifications.' };
      }

      // Get VAPID public key from server
      const response = await fetch('/api/push/vapid-public-key', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication required. Please log in to enable push notifications.' };
        }
        throw new Error('Failed to get VAPID public key');
      }

      const { publicKey } = await response.json();

      // Convert VAPID key to Uint8Array
      const vapidPublicKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push manager
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
          }
        })
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to subscribe on server');
      }

      this.isSubscribed = true;
      console.log('Successfully subscribed to push notifications');
      
      return { success: true, subscription: this.subscription };
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.isSupported || !this.subscription) {
      return { success: false, error: 'Not subscribed to push notifications' };
    }

    try {
      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Remove subscription from server
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            endpoint: this.subscription.endpoint
          })
        });
        
        if (!response.ok && response.status === 401) {
          console.log('Authentication expired during unsubscribe');
        }
      }

      this.subscription = null;
      this.isSubscribed = false;
      console.log('Successfully unsubscribed from push notifications');
      
      return { success: true };
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current subscription status
  async getSubscriptionStatus() {
    if (!this.isSupported) {
      return { supported: false };
    }

    if (!this.registration) {
      await this.initialize();
    }

    const subscription = await this.registration.pushManager.getSubscription();
    const permission = Notification.permission;

    return {
      supported: true,
      isSubscribed: !!subscription,
      permission,
      subscription
    };
  }

  // Show notification manually (for testing)
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      return { success: false, error: 'Notifications not supported' };
    }

    // Check if we have permission
    if (Notification.permission !== 'granted') {
      return { success: false, error: 'Notification permission not granted' };
    }

    try {
      const defaultOptions = {
        body: 'Test notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false
      };

      const notificationOptions = { ...defaultOptions, ...options };
      
      // Try to use service worker first, fall back to direct notification
      if (this.registration && this.registration.active) {
        await this.registration.showNotification(title, notificationOptions);
      } else {
        // Fall back to direct notification API
        const notification = new Notification(title, notificationOptions);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return { success: true };
    } catch (error) {
      console.error('Error showing notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Show update notification when new service worker is available
  showUpdateNotification() {
    this.showNotification('Update Available', {
      body: 'A new version is available. Click to update.',
      tag: 'update-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'update',
          title: 'Update Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    });
  }

  // Handle service worker update
  async handleUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page when new service worker takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  // Utility function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility function to convert ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Get auth token for service worker
  getAuthToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  }

  // Listen for messages from service worker
  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'GET_AUTH_TOKEN') {
        const token = this.getAuthToken();
        event.ports[0].postMessage(token);
      }
    });
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
