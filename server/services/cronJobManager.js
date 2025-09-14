const cron = require('node-cron');
const { getInflationReleases } = require('../database');
const dataCollector = require('./dataCollector');
const emailService = require('./brevoEmailService');

class CronJobManager {
  constructor() {
    this.jobs = new Map();
    this.lastInflationCheck = null;
    this.lastEventsCheck = null;
    this.sentNotifications = new Set(); // Track sent notifications to avoid duplicates
  }

  // Setup all cron jobs
  setupCronJobs() {
    if (process.env.ENABLE_CRON_JOBS !== 'true') {
      console.log('⏭️ Skipping cron job setup (ENABLE_CRON_JOBS not set to true)');
      return;
    }

    console.log('🕐 Setting up enhanced cron job system...');

    // 1. Main data collection (every 30 minutes) - excludes inflation and events
    this.setupMainDataCollection();

    // 2. Inflation data collection (daily at 6 AM, with special handling for release dates)
    this.setupInflationDataCollection();

    // 3. Events calendar collection (daily at 7 AM)
    this.setupEventsCalendarCollection();

    // 4. Email notifications (daily at 8 AM)
    this.setupEmailNotifications();

    console.log('✅ Enhanced cron job system set up successfully');
  }

  // Main data collection (excludes inflation and events)
  setupMainDataCollection() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🕐 Main data collection cron job triggered...');
      try {
        // Collect core data only (no events, no emails)
        const dataCollectorInstance = new dataCollector();
        await dataCollectorInstance.collectCoreData();
        
        console.log('✅ Main data collection completed');
      } catch (error) {
        console.error('❌ Main data collection error:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('mainDataCollection', job);
    console.log('📅 Main data collection: Every hour (core data only, no events/emails)');
  }

  // Inflation data collection with release date awareness
  setupInflationDataCollection() {
    const job = cron.schedule('0 6 * * *', async () => {
      console.log('📊 Inflation data collection cron job triggered...');
      try {
        const shouldCollect = await this.shouldCollectInflationData();
        
        if (shouldCollect) {
          console.log('📊 Collecting inflation data...');
          await dataCollector.collectInflationData();
          
          // Send email notification about updated inflation data
          await this.sendInflationDataNotification();
          
          this.lastInflationCheck = new Date();
          console.log('✅ Inflation data collection completed');
        } else {
          console.log('⏭️ Skipping inflation data collection (not a release date)');
        }
      } catch (error) {
        console.error('❌ Inflation data collection error:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('inflationDataCollection', job);
    console.log('📅 Inflation data collection: Daily at 6 AM (with release date awareness)');
  }

  // Events calendar collection
  setupEventsCalendarCollection() {
    const job = cron.schedule('0 7 * * *', async () => {
      console.log('📅 Events calendar collection cron job triggered...');
      try {
        await dataCollector.collectEconomicCalendarData();
        this.lastEventsCheck = new Date();
        console.log('✅ Events calendar collection completed');
      } catch (error) {
        console.error('❌ Events calendar collection error:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('eventsCalendarCollection', job);
    console.log('📅 Events calendar collection: Daily at 7 AM');
  }

  // Email notifications with duplicate prevention
  setupEmailNotifications() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('📧 Email notifications cron job triggered...');
      try {
        await this.sendEventReminders();
        console.log('✅ Email notifications completed');
      } catch (error) {
        console.error('❌ Email notifications error:', error);
      }
    }, {
      scheduled: false
    });

    job.start();
    this.jobs.set('emailNotifications', job);
    console.log('📧 Email notifications: Daily at 9 AM');
  }

  // Check if we should collect inflation data based on release dates
  async shouldCollectInflationData() {
    try {
      // Get upcoming inflation releases
      const releases = await getInflationReleases(7); // Next 7 days
      
      if (!releases || releases.length === 0) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if there's a release today or in the next 2 days
      const upcomingReleases = releases.filter(release => {
        const releaseDate = new Date(release.date);
        releaseDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 2;
      });

      if (upcomingReleases.length > 0) {
        console.log(`📅 Found ${upcomingReleases.length} upcoming inflation releases, collecting data`);
        return true;
      }

      // Also collect if we haven't collected in the last 24 hours
      if (!this.lastInflationCheck) {
        return true;
      }

      const hoursSinceLastCheck = (new Date() - this.lastInflationCheck) / (1000 * 60 * 60);
      return hoursSinceLastCheck >= 24;
    } catch (error) {
      console.error('Error checking inflation release dates:', error);
      return true; // Default to collecting if we can't check
    }
  }

  // Send inflation data notification email
  async sendInflationDataNotification() {
    try {
      console.log('📧 Sending inflation data update notification...');
      
      // Get users who want inflation notifications
      const { getUsersWithNotifications } = require('../database');
      const users = await getUsersWithNotifications();
      
      const inflationUsers = users.filter(user => 
        user.notification_preferences?.inflation_updates === true
      );

      if (inflationUsers.length === 0) {
        console.log('📧 No users subscribed to inflation notifications');
        return;
      }

      // Send notification to each user
      for (const user of inflationUsers) {
        try {
          await emailService.sendInflationDataUpdate(user.email, {
            name: user.name || 'User',
            latestData: await this.getLatestInflationData()
          });
          console.log(`📧 Inflation notification sent to ${user.email}`);
        } catch (error) {
          console.error(`❌ Failed to send inflation notification to ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error sending inflation data notifications:', error);
    }
  }

  // Clear notification cache (call this when new data is collected)
  clearNotificationCache() {
    this.sentNotifications.clear();
    console.log('🧹 Notification cache cleared');
  }

  // Get latest inflation data for email
  async getLatestInflationData() {
    try {
      const { getLatestInflationData } = require('../database');
      return await getLatestInflationData();
    } catch (error) {
      console.error('Error getting latest inflation data:', error);
      return null;
    }
  }

  // Send event reminders with duplicate prevention
  async sendEventReminders() {
    try {
      console.log('📧 Sending event reminders...');
      
      const { getUsersWithNotifications } = require('../database');
      const users = await getUsersWithNotifications();
      
      const eventUsers = users.filter(user => 
        user.notification_preferences?.event_reminders === true
      );

      if (eventUsers.length === 0) {
        console.log('📧 No users subscribed to event reminders');
        return;
      }

      // Get approaching events
      const { getApproachingEvents } = require('../database');
      const approachingEvents = await getApproachingEvents();

      for (const user of eventUsers) {
        try {
          await this.sendEventReminderToUser(user, approachingEvents);
        } catch (error) {
          console.error(`❌ Failed to send event reminder to ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error sending event reminders:', error);
    }
  }

  // Send event reminder to specific user with duplicate prevention
  async sendEventReminderToUser(user, events) {
    const today = new Date();
    
    // Create a more specific notification key that includes the event ID and timeframe
    const relevantEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      // Check if user wants notifications for this timeframe
      const preferences = user.notification_preferences || {};
      return (
        (daysUntilEvent === 3 && preferences.three_days_before) ||
        (daysUntilEvent === 1 && preferences.one_day_before) ||
        (daysUntilEvent === 0 && preferences.day_of_event)
      );
    });

    if (relevantEvents.length === 0) {
      console.log(`📧 No relevant events for ${user.email}`);
      return;
    }

    // Check for each event individually to prevent duplicates
    const eventsToSend = [];
    for (const event of relevantEvents) {
      const eventDate = new Date(event.date);
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      const notificationKey = `event_${user.id}_${event.id || event.title}_${daysUntilEvent}days`;
      
      // Check if we already sent a notification for this specific event and timeframe
      if (this.sentNotifications.has(notificationKey)) {
        console.log(`📧 Event reminder already sent to ${user.email} for ${event.title} (${daysUntilEvent} days)`);
        continue;
      }

      eventsToSend.push(event);
      
      // Mark as sent immediately to prevent duplicates
      this.sentNotifications.add(notificationKey);
    }

    if (eventsToSend.length === 0) {
      console.log(`📧 No new events to send to ${user.email}`);
      return;
    }

    // Send email
    await emailService.sendEventReminder(user.email, {
      name: user.name || 'User',
      events: eventsToSend
    });

    console.log(`📧 Event reminder sent to ${user.email} for ${eventsToSend.length} events`);
  }

  // Stop all cron jobs
  stopAllJobs() {
    console.log('🛑 Stopping all cron jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`✅ Stopped ${name} job`);
    });
    this.jobs.clear();
  }

  // Get job status
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        lastRun: job.lastDate,
        nextRun: job.nextDate
      };
    });
    return status;
  }
}

module.exports = CronJobManager;
