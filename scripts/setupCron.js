const cron = require('node-cron');
const runDataCollection = require('./collectData');

// Set up cron job to run every 3 hours
const setupCronJobs = () => {
  console.log('Setting up cron jobs for data collection...');
  
  // Run every 3 hours (at 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00)
  const dataCollectionJob = cron.schedule('0 */3 * * *', async () => {
    console.log('Cron job triggered: Starting data collection...');
    try {
      await runDataCollection();
      console.log('Cron job completed successfully');
    } catch (error) {
      console.error('Cron job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
  
  console.log('Cron jobs set up successfully');
  console.log('Data collection will run every 3 hours');
  
  return {
    dataCollectionJob
  };
};

// Start cron jobs if this script is run directly
if (require.main === module) {
  const jobs = setupCronJobs();
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('Stopping cron jobs...');
    jobs.dataCollectionJob.stop();
    process.exit(0);
  });
  
  console.log('Cron jobs are running. Press Ctrl+C to stop.');
}

module.exports = setupCronJobs;