// Service Worker for Push Notifications
const CACHE_NAME = 'crypto-market-monitor-v1';
const STATIC_CACHE = 'static-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/favicon.ico'
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Error parsing push data:', error);
      data = {
        title: 'Market Alert',
        body: 'New market alert received',
        icon: '/favicon.ico'
      };
    }
  }

  const options = {
    body: data.body || 'New market alert',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'market-alert',
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'view',
        title: 'View Alert',
        icon: '/favicon.ico'
      },
      {
        action: 'acknowledge',
        title: 'Acknowledge',
        icon: '/favicon.ico'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.severity === 'high' ? [200, 100, 200] : [100, 50, 100],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Market Alert', options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the alerts page
    event.waitUntil(
      clients.openWindow('/app/alerts')
    );
  } else if (event.action === 'acknowledge') {
    // Acknowledge the alert
    const alertId = event.notification.data.alertId;
    if (alertId) {
      event.waitUntil(
        acknowledgeAlert(alertId)
      );
    }
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync tasks
      syncData()
    );
  }
});

// Helper function to acknowledge alert
async function acknowledgeAlert(alertId) {
  try {
    // Get the auth token from storage
    const token = await getAuthToken();
    
    if (token) {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('Alert acknowledged successfully');
      } else {
        console.error('Failed to acknowledge alert');
      }
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
  }
}

// Helper function to get auth token
async function getAuthToken() {
  try {
    // Try to get token from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      if (client.url) {
        // Send message to client to get token
        const response = await client.postMessage({
          type: 'GET_AUTH_TOKEN'
        });
        return response;
      }
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
}

// Helper function for background sync
async function syncData() {
  try {
    // Sync any pending data when connection is restored
    console.log('Performing background sync...');
    
    // You can add offline data sync logic here
    // For example, sync pending alert acknowledgments
    
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker loaded successfully');
