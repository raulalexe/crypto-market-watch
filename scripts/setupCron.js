const cron = require('node-cron');
const runDataCollection = require('./collectData');

// Smart scheduling based on market hours
const setupCronJobs = () => {
  console.log('Setting up smart cron jobs for data collection...');
  
  // Market hours: 9 AM - 5 PM UTC (crypto markets are 24/7 but more active during these hours)
  // Weekdays: Every hour during market hours, every 3 hours off-hours
  // Weekends: Every 4 hours
  
  // Market hours job (every hour during 9 AM - 5 PM UTC, weekdays)
  const marketHoursJob = cron.schedule('0 9-17 * * 1-5', async () => {
    console.log('Market hours cron job triggered: Starting data collection...');
    try {
      await runDataCollection();
      console.log('Market hours cron job completed successfully');
    } catch (error) {
      console.error('Market hours cron job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
  
  // Off-hours job (every 3 hours outside market hours, weekdays)
  const offHoursJob = cron.schedule('0 */3 * * 1-5', async () => {
    const hour = new Date().getHours();
    // Only run if outside market hours (9-17)
    if (hour < 9 || hour >= 17) {
      console.log('Off-hours cron job triggered: Starting data collection...');
      try {
        await runDataCollection();
        console.log('Off-hours cron job completed successfully');
      } catch (error) {
        console.error('Off-hours cron job failed:', error);
      }
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
  
  // Weekend job (every 4 hours)
  const weekendJob = cron.schedule('0 */4 * * 0,6', async () => {
    console.log('Weekend cron job triggered: Starting data collection...');
    try {
      await runDataCollection();
      console.log('Weekend cron job completed successfully');
    } catch (error) {
      console.error('Weekend cron job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
  
  console.log('Smart cron jobs set up successfully');
  console.log('Schedule:');
  console.log('- Weekdays 9 AM - 5 PM UTC: Every hour');
  console.log('- Weekdays off-hours: Every 3 hours');
  console.log('- Weekends: Every 4 hours');
  
  return {
    marketHoursJob,
    offHoursJob,
    weekendJob
  };
};

// Start cron jobs if this script is run directly
if (require.main === module) {
  const jobs = setupCronJobs();
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('Stopping cron jobs...');
    jobs.marketHoursJob.stop();
    jobs.offHoursJob.stop();
    jobs.weekendJob.stop();
    process.exit(0);
  });
  
  console.log('Cron jobs are running. Press Ctrl+C to stop.');
}

module.exports = setupCronJobs;