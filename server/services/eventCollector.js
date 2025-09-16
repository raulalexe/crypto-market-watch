const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const { insertUpcomingEvent, getUpcomingEvents } = require('../database');

class EventCollector {
  constructor() {
    this.events = [];
  }

  // Collect upcoming events from various sources
  async collectUpcomingEvents() {
    try {
      console.log('Collecting upcoming events...');
      
      // Get actual CPI release date from BLS
      const cpiReleaseDate = await this.getNextCPIDate();
      
      const events = [
        // Federal Reserve Events
        {
          title: 'FOMC Meeting',
          description: 'Federal Open Market Committee meeting to discuss monetary policy',
          category: 'fed',
          impact: 'high',
          date: this.getNextFOMCMeeting(),
          source: 'Federal Reserve'
        },
        {
          title: 'Fed Chair Powell Speech',
          description: 'Federal Reserve Chair Jerome Powell public remarks',
          category: 'fed',
          impact: 'medium',
          date: this.getNextFedSpeech(),
          source: 'Federal Reserve'
        },
        {
          title: 'CPI Data Release',
          description: 'Consumer Price Index inflation data release',
          category: 'fed',
          impact: 'high',
          date: cpiReleaseDate,
          source: 'Bureau of Labor Statistics'
        },
        {
          title: 'Non-Farm Payrolls',
          description: 'Employment situation report',
          category: 'fed',
          impact: 'high',
          date: this.getNextNFPDate(),
          source: 'Bureau of Labor Statistics'
        },

        // Crypto Events
        {
          title: 'Bitcoin Halving',
          description: 'Bitcoin block reward halving event',
          category: 'crypto',
          impact: 'high',
          date: this.getNextBitcoinHalving(),
          source: 'Bitcoin Network'
        },
        {
          title: 'Ethereum Network Upgrade',
          description: 'Major Ethereum network upgrade',
          category: 'crypto',
          impact: 'medium',
          date: this.getNextEthereumUpgrade(),
          source: 'Ethereum Foundation'
        },

        // Regulatory Events
        {
          title: 'SEC Crypto Regulation Update',
          description: 'SEC announcement on cryptocurrency regulations',
          category: 'regulation',
          impact: 'high',
          date: this.getNextSECMeeting(),
          source: 'SEC'
        },
        {
          title: 'CFTC Crypto Hearing',
          description: 'CFTC hearing on cryptocurrency derivatives',
          category: 'regulation',
          impact: 'medium',
          date: this.getNextCFTCHearing(),
          source: 'CFTC'
        },

        // Major Company Events
        {
          title: 'Tesla Earnings',
          description: 'Tesla quarterly earnings report',
          category: 'earnings',
          impact: 'medium',
          date: this.getNextTeslaEarnings(),
          source: 'Tesla Inc.'
        },
        {
          title: 'MicroStrategy Bitcoin Purchase',
          description: 'Potential MicroStrategy Bitcoin acquisition',
          category: 'crypto',
          impact: 'medium',
          date: this.getNextMicroStrategyEvent(),
          source: 'MicroStrategy'
        }
      ];

      // Filter events that are in the future
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const now = new Date();
        return eventDate > now;
      });

      // Save events to database
      for (const event of upcomingEvents) {
        await this.saveEvent(event);
      }

      console.log(`Collected ${upcomingEvents.length} upcoming events`);
      return upcomingEvents;
    } catch (error) {
      console.error('Error collecting upcoming events:', error.message);
      return [];
    }
  }

  // Save event to database
  async saveEvent(event) {
    try {
      await insertUpcomingEvent(
        event.title,
        event.description,
        event.category,
        event.impact,
        event.date,
        event.source
      );
    } catch (error) {
      console.error('Error saving event:', error.message);
    }
  }

  // Get upcoming events from database
  async getUpcomingEvents(limit = 20) {
    try {
      const events = await getUpcomingEvents(limit);
      return events || [];
    } catch (error) {
      console.error('Error getting upcoming events:', error.message);
      return [];
    }
  }

  // Helper methods to calculate event dates
  getNextFOMCMeeting() {
    // FOMC meetings are scheduled for specific dates in 2025
    const now = moment();
    
    // Known FOMC meeting dates for 2025
    const fomcDates = [
      '2025-01-28 14:00:00', // January 28-29, 2025
      '2025-03-18 14:00:00', // March 18-19, 2025
      '2025-04-29 14:00:00', // April 29-30, 2025
      '2025-06-10 14:00:00', // June 10-11, 2025
      '2025-07-29 14:00:00', // July 29-30, 2025
      '2025-09-16 14:00:00', // September 16-17, 2025 (TODAY/TOMORROW)
      '2025-10-28 14:00:00', // October 28-29, 2025
      '2025-12-16 14:00:00'  // December 16-17, 2025
    ];
    
    // Find the next FOMC meeting after now
    for (const dateStr of fomcDates) {
      const meetingDate = moment(dateStr);
      if (meetingDate.isAfter(now)) {
        console.log(`📅 Next FOMC meeting: ${meetingDate.format('YYYY-MM-DD HH:mm:ss')}`);
        return meetingDate.format('YYYY-MM-DD HH:mm:ss');
      }
    }
    
    // Fallback: if all dates have passed, use the next year's first meeting
    const nextYearFirstMeeting = moment('2026-01-28 14:00:00');
    console.log(`📅 Using next year's first FOMC meeting: ${nextYearFirstMeeting.format('YYYY-MM-DD HH:mm:ss')}`);
    return nextYearFirstMeeting.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextFedSpeech() {
    // Fed speeches are typically weekly
    const nextSpeech = moment().add(1, 'week').startOf('week').add(3, 'days'); // Thursday
    return nextSpeech.format('YYYY-MM-DD HH:mm:ss');
  }

  async getNextCPIDate() {
    try {
      // Try to fetch actual release schedule from BLS
      const releaseDate = await this.fetchBLSReleaseSchedule('CPI');
      if (releaseDate) {
        return releaseDate;
      }
    } catch (error) {
      console.log('⚠️ Failed to fetch BLS release schedule, using fallback calculation');
    }
    
    // Fallback: Calculate 2nd Tuesday of each month (more robust)
    const now = moment();
    
    // Known CPI release dates for 2025 (as backup)
    const knownReleaseDates = [
      '2025-01-14 08:30:00', // January 14, 2025
      '2025-02-12 08:30:00', // February 12, 2025
      '2025-03-12 08:30:00', // March 12, 2025
      '2025-04-10 08:30:00', // April 10, 2025
      '2025-05-14 08:30:00', // May 14, 2025
      '2025-06-12 08:30:00', // June 12, 2025
      '2025-07-10 08:30:00', // July 10, 2025
      '2025-08-13 08:30:00', // August 13, 2025
      '2025-09-11 08:30:00', // September 11, 2025
      '2025-10-10 08:30:00', // October 10, 2025
      '2025-11-12 08:30:00', // November 12, 2025
      '2025-12-11 08:30:00'  // December 11, 2025
    ];
    
    // Check if we have a known date for current or next month
    for (const dateStr of knownReleaseDates) {
      const releaseDate = moment(dateStr);
      if (releaseDate.isAfter(now)) {
        console.log(`📅 Using known CPI release date: ${releaseDate.format('YYYY-MM-DD HH:mm:ss')}`);
        return releaseDate.format('YYYY-MM-DD HH:mm:ss');
      }
    }
    
    // Fallback: Calculate 2nd Tuesday of each month
    console.log('📅 Calculating 2nd Tuesday fallback...');
    
    // Get the 2nd Tuesday of current month
    const firstDay = moment().startOf('month');
    const firstTuesday = firstDay.clone().day(2); // First Tuesday
    const secondTuesday = firstTuesday.clone().add(1, 'week'); // Second Tuesday
    
    let nextCPI = secondTuesday.hour(8).minute(30).second(0).millisecond(0);
    
    // If the 2nd Tuesday has passed this month, move to next month
    if (nextCPI.isBefore(now)) {
      const nextMonth = moment().add(1, 'month').startOf('month');
      const nextFirstTuesday = nextMonth.clone().day(2);
      const nextSecondTuesday = nextFirstTuesday.clone().add(1, 'week');
      nextCPI = nextSecondTuesday.hour(8).minute(30).second(0).millisecond(0);
    }
    
    console.log(`📅 Calculated CPI release date: ${nextCPI.format('YYYY-MM-DD HH:mm:ss')}`);
    return nextCPI.format('YYYY-MM-DD HH:mm:ss');
  }

  async fetchBLSReleaseSchedule(dataType) {
    try {
      // Try multiple sources for release schedule
      const sources = [
        'https://usinflationcalculator.com/inflation/consumer-price-index-release-schedule/',
        'https://www.bls.gov/schedule/news_release/cpi.htm',
        'https://www.federalreserve.gov/calendar.htm',
        'https://www.tradingeconomics.com/calendar'
      ];
      
      for (const url of sources) {
        try {
          // Use curl workaround for Railway Akamai edge issue
          const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 "${url}"`;
          console.log(`🔧 Fetching release schedule from: ${url.split('/')[2]}`);
          
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          const { stdout, stderr } = await execAsync(curlCommand);
          
          if (stderr) {
            console.error(`⚠️ Curl stderr for ${url.split('/')[2]}: ${stderr}`);
          }
          
          if (stdout) {
            // Parse HTML to extract release dates
            const releaseDate = this.parseBLSReleaseSchedule(stdout, dataType);
            if (releaseDate) {
              console.log(`✅ Found ${dataType} release date from ${url.split('/')[2]}: ${releaseDate}`);
              return releaseDate;
            }
          }
        } catch (error) {
          console.log(`⚠️ Failed to fetch from ${url.split('/')[2]}: ${error.message}`);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching release schedule:', error.message);
      return null;
    }
  }

  parseBLSReleaseSchedule(html, dataType) {
    try {
      // Look for release dates in various formats
      const datePatterns = [
        // "October 15, 2025"
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/g,
        // "Oct 15, 2025"
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/g,
        // "2025-10-15"
        /(\d{4})-(\d{1,2})-(\d{1,2})/g,
        // "10/15/2025"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
      ];
      
      const now = moment();
      let nextRelease = null;
      
      for (const pattern of datePatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            let releaseDate;
            
            // Parse different date formats
            if (match.includes(',')) {
              // "October 15, 2025" or "Oct 15, 2025"
              releaseDate = moment(match, ['MMMM D, YYYY', 'MMM D, YYYY']).hour(8).minute(30).second(0).millisecond(0);
            } else if (match.includes('-')) {
              // "2025-10-15"
              releaseDate = moment(match, 'YYYY-M-D').hour(8).minute(30).second(0).millisecond(0);
            } else if (match.includes('/')) {
              // "10/15/2025"
              releaseDate = moment(match, 'M/D/YYYY').hour(8).minute(30).second(0).millisecond(0);
            }
            
            if (releaseDate && releaseDate.isValid()) {
              // Find the next release date after today
              if (releaseDate.isAfter(now)) {
                if (!nextRelease || releaseDate.isBefore(nextRelease)) {
                  nextRelease = releaseDate;
                }
              }
            }
          }
        }
      }
      
      if (nextRelease) {
        return nextRelease.format('YYYY-MM-DD HH:mm:ss');
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing release schedule:', error.message);
      return null;
    }
  }

  getNextNFPDate() {
    // NFP is typically released on the first Friday of each month
    const now = moment();
    let nextNFP = moment().startOf('month').add(1, 'week').startOf('week').add(5, 'days'); // Friday
    if (nextNFP.isBefore(now)) {
      nextNFP = nextNFP.add(1, 'month');
    }
    return nextNFP.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextBitcoinHalving() {
    // Bitcoin halving occurs approximately every 4 years
    // Next halving is expected around April 2028
    return moment('2028-04-20').format('YYYY-MM-DD HH:mm:ss');
  }

  getNextEthereumUpgrade() {
    // Ethereum upgrades are typically every 6-12 months
    const nextUpgrade = moment().add(8, 'months');
    return nextUpgrade.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextSECMeeting() {
    // SEC meetings are typically monthly
    const nextMeeting = moment().add(1, 'month').startOf('month').add(2, 'weeks');
    return nextMeeting.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextCFTCHearing() {
    // CFTC hearings are typically quarterly
    const nextHearing = moment().add(3, 'months').startOf('month').add(2, 'weeks');
    return nextHearing.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextTeslaEarnings() {
    // Tesla earnings are typically quarterly
    const nextEarnings = moment().add(3, 'months').startOf('month').add(2, 'weeks');
    return nextEarnings.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextMicroStrategyEvent() {
    // MicroStrategy typically makes Bitcoin purchases quarterly
    const nextEvent = moment().add(3, 'months').startOf('month').add(1, 'week');
    return nextEvent.format('YYYY-MM-DD HH:mm:ss');
  }

  // Get events summary for dashboard
  async getEventsSummary() {
    try {
      const events = await this.getUpcomingEvents(50);
      
      const highImpact = events.filter(e => e.impact === 'high').length;
      const mediumImpact = events.filter(e => e.impact === 'medium').length;
      const lowImpact = events.filter(e => e.impact === 'low').length;
      
      const nextHighImpact = events
        .filter(e => e.impact === 'high')
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

      return {
        total_events: events.length,
        high_impact: highImpact,
        medium_impact: mediumImpact,
        low_impact: lowImpact,
        next_high_impact_event: nextHighImpact,
        events: events.slice(0, 10) // Return next 10 events
      };
    } catch (error) {
      console.error('Error getting events summary:', error.message);
      return {
        total_events: 0,
        high_impact: 0,
        medium_impact: 0,
        low_impact: 0,
        next_high_impact_event: null,
        events: []
      };
    }
  }
}

module.exports = EventCollector;
