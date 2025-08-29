require('dotenv').config();
const EventNotificationService = require('./server/services/eventNotificationService');

async function testEventNotifications() {
  try {
    console.log('🧪 Testing event notification service...');
    
    const eventNotificationService = new EventNotificationService();
    
    // Test the notification service
    const result = await eventNotificationService.testEventNotifications();
    
    if (result) {
      console.log('✅ Event notification test completed successfully');
    } else {
      console.log('❌ Event notification test failed');
    }
    
    // Also test checking for upcoming event notifications
    console.log('\n🔔 Checking for upcoming event notifications...');
    const notifications = await eventNotificationService.checkUpcomingEventNotifications();
    console.log(`📢 Created ${notifications.length} notifications`);
    
    if (notifications.length > 0) {
      notifications.forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing event notifications:', error);
  }
}

testEventNotifications();
