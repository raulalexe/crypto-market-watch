/**
 * Altcoin Season Index Cron Job
 * 
 * Runs independently 2-4 times per day to collect Altcoin Season Index
 * This metric doesn't change frequently, so it doesn't need to run with regular data collection
 */

const cron = require('node-cron');
const AltcoinSeasonService = require('./altcoinSeasonService');

class AltcoinSeasonCron {
  constructor() {
    this.altcoinSeasonService = new AltcoinSeasonService();
    this.isRunning = false;
    this.lastRun = null;
    this.schedules = [
      '0 6 * * *',   // 6:00 AM UTC (daily)
      '0 12 * * *',  // 12:00 PM UTC (daily)
      '0 18 * * *',  // 6:00 PM UTC (daily)
      '0 0 * * *'    // 12:00 AM UTC (daily) - 4 times per day
    ];
    this.jobs = [];
  }

  /**
   * Start the Altcoin Season Index cron jobs
   */
  start() {
    console.log('🚀 Starting Altcoin Season Index cron jobs...');
    console.log('📅 Schedule: 4 times per day (6 AM, 12 PM, 6 PM, 12 AM UTC)');
    
    this.schedules.forEach((schedule, index) => {
      const job = cron.schedule(schedule, async () => {
        await this.runAltcoinSeasonCollection();
      }, {
        scheduled: true,
        timezone: 'UTC'
      });
      
      this.jobs.push(job);
      console.log(`✅ Altcoin Season Index job ${index + 1} scheduled: ${schedule}`);
    });

    console.log('🎉 Altcoin Season Index cron jobs started successfully!');
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    console.log('🛑 Stopping Altcoin Season Index cron jobs...');
    
    this.jobs.forEach((job, index) => {
      job.stop();
      console.log(`✅ Altcoin Season Index job ${index + 1} stopped`);
    });
    
    this.jobs = [];
    console.log('🎉 All Altcoin Season Index cron jobs stopped!');
  }

  /**
   * Run Altcoin Season Index collection
   */
  async runAltcoinSeasonCollection() {
    if (this.isRunning) {
      console.log('⚠️ Altcoin Season Index collection already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    try {
      console.log('📊 Starting Altcoin Season Index collection...');
      console.log(`🕐 Collection started at: ${startTime.toISOString()}`);
      
      const result = await this.altcoinSeasonService.getAltcoinSeasonIndex();
      
      if (result) {
        await this.altcoinSeasonService.storeResult(result);
        this.lastRun = new Date();
        
        console.log('✅ Altcoin Season Index collection completed successfully!');
        console.log(`📊 Index: ${result.index.toFixed(2)}% (${result.season})`);
        console.log(`🕐 Collection completed at: ${this.lastRun.toISOString()}`);
        console.log(`⏱️ Duration: ${this.lastRun - startTime}ms`);
      } else {
        console.log('⚠️ Altcoin Season Index collection completed but no data was collected');
      }
      
    } catch (error) {
      console.error('❌ Altcoin Season Index collection failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get status of the cron jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      jobsCount: this.jobs.length,
      schedules: this.schedules,
      nextRuns: this.jobs.map((job, index) => ({
        job: index + 1,
        schedule: this.schedules[index],
        nextRun: job.nextDate()?.toISOString() || 'Not scheduled'
      }))
    };
  }

  /**
   * Force run Altcoin Season Index collection (for testing or manual triggers)
   */
  async forceRun() {
    console.log('🔧 Force running Altcoin Season Index collection...');
    await this.runAltcoinSeasonCollection();
  }
}

module.exports = AltcoinSeasonCron;
