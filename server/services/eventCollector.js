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
          date: this.getNextCPIDate(),
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
    // FOMC meetings typically occur every 6 weeks
    const now = moment();
    const nextMeeting = moment().add(6, 'weeks').startOf('week').add(2, 'days'); // Tuesday
    return nextMeeting.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextFedSpeech() {
    // Fed speeches are typically weekly
    const nextSpeech = moment().add(1, 'week').startOf('week').add(3, 'days'); // Thursday
    return nextSpeech.format('YYYY-MM-DD HH:mm:ss');
  }

  getNextCPIDate() {
    // CPI is typically released around the 13th of each month
    const now = moment();
    let nextCPI = moment().date(13);
    if (nextCPI.isBefore(now)) {
      nextCPI = nextCPI.add(1, 'month');
    }
    return nextCPI.format('YYYY-MM-DD HH:mm:ss');
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
