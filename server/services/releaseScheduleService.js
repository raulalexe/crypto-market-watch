const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
const AlertService = require('./alertService');
const TelegramService = require('./telegramService');
const EmailService = require('./emailService');

class ReleaseScheduleService {
  constructor() {
    this.alertService = new AlertService();
    this.telegramService = new TelegramService();
    this.emailService = new EmailService();
    
    // Calendar file path
    this.calendarPath = path.join(__dirname, '../data/release_calendar.json');
    
    // Notification settings
    this.notificationIntervals = [60, 30, 15, 5]; // minutes before release
    
    // Initialize calendar
    this.initializeCalendar();
  }

  async initializeCalendar() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.calendarPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      // Check if calendar file exists, if not create with default data
      try {
        await fs.access(this.calendarPath);
      } catch (error) {
        await this.createDefaultCalendar();
      }
    } catch (error) {
      console.error('Error initializing release calendar:', error);
    }
  }

  async createDefaultCalendar() {
    const defaultCalendar = {
      lastUpdated: moment().format('YYYY-MM-DD'),
      releases: this.generateDefaultReleases(),
      settings: {
        notificationIntervals: this.notificationIntervals,
        enabled: true,
        autoUpdate: true
      }
    };
    
    await fs.writeFile(this.calendarPath, JSON.stringify(defaultCalendar, null, 2));
    console.log('Created default release calendar');
  }

  generateDefaultReleases() {
    const releases = [];
    const currentYear = moment().year();
    
    // Generate CPI releases for current and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        // CPI is typically released around the 13th of each month
        const releaseDate = moment(`${year}-${month.toString().padStart(2, '0')}-13`);
        
        // Adjust for weekends (move to next business day)
        const dayOfWeek = releaseDate.day();
        if (dayOfWeek === 0) { // Sunday
          releaseDate.add(1, 'day');
        } else if (dayOfWeek === 6) { // Saturday
          releaseDate.add(2, 'days');
        }
        
        releases.push({
          id: `cpi_${year}_${month}`,
          type: 'CPI',
          source: 'BLS',
          title: `Consumer Price Index (CPI) - ${moment(releaseDate).format('MMMM YYYY')}`,
          date: releaseDate.format('YYYY-MM-DD'),
          time: '08:30',
          timezone: 'America/New_York',
          impact: 'high',
          description: 'Monthly inflation data from Bureau of Labor Statistics',
          url: 'https://www.bls.gov/schedule/news_release/cpi.htm',
          notificationsSent: []
        });
      }
    }
    
    // Generate PCE releases for current and next year
    for (let year = currentYear; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        // PCE is typically released around the 28th of each month
        const releaseDate = moment(`${year}-${month.toString().padStart(2, '0')}-28`);
        
        // Adjust for weekends
        const dayOfWeek = releaseDate.day();
        if (dayOfWeek === 0) { // Sunday
          releaseDate.add(1, 'day');
        } else if (dayOfWeek === 6) { // Saturday
          releaseDate.add(2, 'days');
        }
        
        releases.push({
          id: `pce_${year}_${month}`,
          type: 'PCE',
          source: 'BEA',
          title: `Personal Consumption Expenditures (PCE) - ${moment(releaseDate).format('MMMM YYYY')}`,
          date: releaseDate.format('YYYY-MM-DD'),
          time: '08:30',
          timezone: 'America/New_York',
          impact: 'high',
          description: 'Monthly inflation data from Bureau of Economic Analysis',
          url: 'https://www.bea.gov/data/personal-consumption-expenditures-price-index',
          notificationsSent: []
        });
      }
    }
    
    return releases;
  }

  async loadCalendar() {
    try {
      const data = await fs.readFile(this.calendarPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading release calendar:', error);
      return null;
    }
  }

  async saveCalendar(calendar) {
    try {
      calendar.lastUpdated = moment().format('YYYY-MM-DD');
      await fs.writeFile(this.calendarPath, JSON.stringify(calendar, null, 2));
    } catch (error) {
      console.error('Error saving release calendar:', error);
    }
  }

  async getUpcomingReleases(limit = 10) {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar) return [];
      
      const now = moment();
      const upcoming = calendar.releases
        .filter(release => {
          const releaseDateTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
          return releaseDateTime.isAfter(now);
        })
        .sort((a, b) => {
          const dateA = moment(`${a.date} ${a.time}`, 'YYYY-MM-DD HH:mm');
          const dateB = moment(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm');
          return dateA - dateB;
        })
        .slice(0, limit);
      
      return upcoming;
    } catch (error) {
      console.error('Error getting upcoming releases:', error);
      return [];
    }
  }

  async getNextHighImpactRelease() {
    try {
      const upcoming = await this.getUpcomingReleases(50);
      return upcoming.find(release => release.impact === 'high') || null;
    } catch (error) {
      console.error('Error getting next high impact release:', error);
      return null;
    }
  }

  async checkAndSendNotifications() {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar || !calendar.settings.enabled) return;
      
      const now = moment();
      const releases = await this.getUpcomingReleases(50);
      
      for (const release of releases) {
        const releaseDateTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
        const minutesUntilRelease = releaseDateTime.diff(now, 'minutes');
        
        // Check each notification interval
        for (const interval of calendar.settings.notificationIntervals) {
          if (minutesUntilRelease <= interval && minutesUntilRelease > interval - 5) {
            // Check if we already sent this notification
            const notificationKey = `${interval}min`;
            if (!release.notificationsSent.includes(notificationKey)) {
              await this.sendReleaseNotification(release, interval);
              
              // Mark as sent
              release.notificationsSent.push(notificationKey);
              await this.saveCalendar(calendar);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking and sending notifications:', error);
    }
  }

  async sendReleaseNotification(release, minutesUntil) {
    try {
      const message = this.formatReleaseNotification(release, minutesUntil);
      
      // Send to all notification channels
      await Promise.allSettled([
        this.telegramService.sendMessage(message),
        this.emailService.sendReleaseAlert(release, minutesUntil),
        this.alertService.createAlert({
          type: 'RELEASE_SCHEDULE',
          title: `Economic Data Release in ${minutesUntil} minutes`,
          message: message,
          severity: 'high',
          data: release
        })
      ]);
      
      console.log(`Sent release notification for ${release.type} in ${minutesUntil} minutes`);
    } catch (error) {
      console.error('Error sending release notification:', error);
    }
  }

  formatReleaseNotification(release, minutesUntil) {
    const releaseTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
    
    return `🚨 ECONOMIC DATA RELEASE ALERT 🚨

${release.title}
📅 Date: ${releaseTime.format('dddd, MMMM Do YYYY')}
⏰ Time: ${releaseTime.format('h:mm A')} (${minutesUntil} minutes from now)
📊 Impact: ${release.impact.toUpperCase()}
📝 Description: ${release.description}

💡 STRATEGY TIPS:
• Consider hedging positions with correlated instruments
• Take partial profits if in long positions
• Lower leverage before release
• Set wider stop-loss buffers

🔗 More info: ${release.url}`;
  }

  async addCustomRelease(releaseData) {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar) return false;
      
      const newRelease = {
        id: `custom_${Date.now()}`,
        ...releaseData,
        notificationsSent: [],
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      calendar.releases.push(newRelease);
      await this.saveCalendar(calendar);
      
      return true;
    } catch (error) {
      console.error('Error adding custom release:', error);
      return false;
    }
  }

  async updateRelease(releaseId, updates) {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar) return false;
      
      const releaseIndex = calendar.releases.findIndex(r => r.id === releaseId);
      if (releaseIndex === -1) return false;
      
      calendar.releases[releaseIndex] = {
        ...calendar.releases[releaseIndex],
        ...updates,
        updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      await this.saveCalendar(calendar);
      return true;
    } catch (error) {
      console.error('Error updating release:', error);
      return false;
    }
  }

  async deleteRelease(releaseId) {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar) return false;
      
      calendar.releases = calendar.releases.filter(r => r.id !== releaseId);
      await this.saveCalendar(calendar);
      
      return true;
    } catch (error) {
      console.error('Error deleting release:', error);
      return false;
    }
  }

  async getReleaseStats() {
    try {
      const calendar = await this.loadCalendar();
      if (!calendar) return null;
      
      const now = moment();
      const upcoming = calendar.releases.filter(release => {
        const releaseDateTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
        return releaseDateTime.isAfter(now);
      });
      
      const past = calendar.releases.filter(release => {
        const releaseDateTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
        return releaseDateTime.isBefore(now);
      });
      
      return {
        total: calendar.releases.length,
        upcoming: upcoming.length,
        past: past.length,
        nextRelease: upcoming[0] || null,
        highImpactUpcoming: upcoming.filter(r => r.impact === 'high').length,
        lastUpdated: calendar.lastUpdated
      };
    } catch (error) {
      console.error('Error getting release stats:', error);
      return null;
    }
  }

  // Start the notification checker
  startNotificationChecker() {
    // Check every 5 minutes
    setInterval(() => {
      this.checkAndSendNotifications();
    }, 5 * 60 * 1000);
    
    console.log('Release schedule notification checker started');
  }
}

module.exports = ReleaseScheduleService;