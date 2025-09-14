const moment = require('moment');
const EventCollector = require('./eventCollector');
const AlertService = require('./alertService');

class EventNotificationService {
  constructor() {
    this.eventCollector = new EventCollector();
    this.alertService = new AlertService();
    this.notificationWindow = 3; // Days before event to send notification
  }

  // Check for upcoming events and create notifications
  async checkUpcomingEventNotifications() {
    try {
      console.log('🔔 Checking for upcoming event notifications...');
      
      // Get users with notification preferences
      const { getUsersWithNotifications } = require('../database');
      const users = await getUsersWithNotifications();
      
      if (users.length === 0) {
        console.log('📢 No users with notification preferences found');
        return [];
      }

      // Get upcoming events
      const events = await this.eventCollector.getUpcomingEvents(50);
      const now = moment();
      const notificationsCreated = [];

      for (const event of events) {
        const eventDate = moment(event.date);
        const daysUntilEvent = eventDate.diff(now, 'days');
        const hoursUntilEvent = eventDate.diff(now, 'hours');

        // Filter users who want notifications for this event
        const eligibleUsers = users.filter(user => {
          // Check if user has event notifications enabled
          if (!user.eventNotifications) return false;
          
          // Check if event is within user's notification windows (multi-select)
          const userWindows = user.eventNotificationWindows || [3];
          if (daysUntilEvent < 0 || !userWindows.includes(daysUntilEvent)) return false;
          
          // Check impact filter
          if (user.eventImpactFilter === 'high' && event.impact !== 'high') return false;
          if (user.eventImpactFilter === 'high_medium' && event.impact === 'low') return false;
          
          return true;
        });

        if (eligibleUsers.length > 0) {
          const notification = await this.createEventNotification(event, daysUntilEvent, hoursUntilEvent, eligibleUsers);
          if (notification) {
            notificationsCreated.push(notification);
          }
        }
      }

      console.log(`🔔 Created ${notificationsCreated.length} event notifications`);
      return notificationsCreated;
    } catch (error) {
      console.error('❌ Error checking event notifications:', error);
      return [];
    }
  }

  // Create a notification for a specific event
  async createEventNotification(event, daysUntilEvent, hoursUntilEvent, eligibleUsers = null) {
    try {
      // Calculate time remaining
      const timeRemaining = this.formatTimeRemaining(daysUntilEvent, hoursUntilEvent);
      
      // Create alert message (without time - time will be calculated dynamically in frontend)
      const alert = {
        type: 'UPCOMING_EVENT',
        message: `${event.title} is likely to impact the market. ${event.description}`,
        severity: this.getEventSeverity(event.impact),
        metric: 'event',
        value: event.impact,
        eventId: event.id,
        eventDate: event.date,
        eventTitle: event.title,
        eventCategory: event.category
      };

      // Check if this notification already exists (avoid duplicates)
      const wasInserted = await this.alertService.insertAlertIfNotExists(alert, 86400000); // 24 hour window
      
      if (wasInserted) {
        console.log(`🔔 Created notification for event: ${event.title} (${timeRemaining} away) for ${eligibleUsers ? eligibleUsers.length : 'all'} users`);
        
        // Send notifications to users (if eligibleUsers provided, filter to only those users)
        if (eligibleUsers) {
          await this.alertService.sendNotificationsToUsers(alert, eligibleUsers);
        } else {
          await this.alertService.sendNotifications(alert);
        }
        
        return alert;
      } else {
        console.log(`🔔 Notification already exists for event: ${event.title}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error creating event notification:', error);
      return null;
    }
  }

  // Format time remaining in a user-friendly way
  formatTimeRemaining(days, hours) {
    if (days > 0) {
      const remainingHours = hours % 24;
      if (remainingHours > 0) {
        return `${days} days and ${remainingHours} hours`;
      } else {
        return `${days} days`;
      }
    } else {
      return `${hours} hours`;
    }
  }

  // Get severity level based on event impact
  getEventSeverity(impact) {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  // Get events that are approaching (for dashboard display)
  async getApproachingEvents() {
    try {
      const events = await this.eventCollector.getUpcomingEvents(20);
      const now = moment();
      const approachingEvents = [];

      for (const event of events) {
        const eventDate = moment(event.date);
        const daysUntilEvent = eventDate.diff(now, 'days');
        
        // Events within the next 7 days
        if (daysUntilEvent >= 0 && daysUntilEvent <= 7) {
          approachingEvents.push({
            ...event,
            daysUntil: daysUntilEvent,
            hoursUntil: eventDate.diff(now, 'hours'),
            timeRemaining: this.formatTimeRemaining(daysUntilEvent, eventDate.diff(now, 'hours'))
          });
        }
      }

      return approachingEvents.sort((a, b) => a.daysUntil - b.daysUntil);
    } catch (error) {
      console.error('❌ Error getting approaching events:', error);
      return [];
    }
  }

  // Test the notification service
  async testEventNotifications() {
    try {
      console.log('🧪 Testing event notification service...');
      
      const events = await this.eventCollector.getUpcomingEvents(5);
      if (events.length === 0) {
        console.log('⚠️ No upcoming events found for testing');
        return false;
      }

      // Create a test notification for the next event
      const nextEvent = events[0];
      const now = moment();
      const eventDate = moment(nextEvent.date);
      const daysUntilEvent = eventDate.diff(now, 'days');
      const hoursUntilEvent = eventDate.diff(now, 'hours');

      console.log(`🧪 Creating test notification for: ${nextEvent.title}`);
      console.log(`🧪 Event date: ${nextEvent.date}`);
      console.log(`🧪 Days until event: ${daysUntilEvent}`);
      console.log(`🧪 Hours until event: ${hoursUntilEvent}`);

      const testNotification = await this.createEventNotification(nextEvent, daysUntilEvent, hoursUntilEvent);
      
      if (testNotification) {
        console.log('✅ Test notification created successfully');
        return true;
      } else {
        console.log('❌ Test notification failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing event notifications:', error);
      return false;
    }
  }
}

module.exports = EventNotificationService;
