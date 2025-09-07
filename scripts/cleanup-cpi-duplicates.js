#!/usr/bin/env node

/**
 * Script to clean up duplicate CPI events in the database
 * This addresses the issue where CPI Data Release events are duplicated multiple times
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function cleanupCPIDuplicates() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking for CPI duplicate events...');
    
    // First, let's see what CPI events we have
    const checkQuery = `
      SELECT id, title, date, source, category, impact, created_at
      FROM upcoming_events 
      WHERE (title ILIKE '%cpi%' OR title ILIKE '%consumer price index%')
      ORDER BY date, created_at
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log(`Found ${checkResult.rows.length} CPI-related events:`);
    
    checkResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Title: "${row.title}", Date: ${row.date}, Source: ${row.source}`);
    });
    
    if (checkResult.rows.length <= 1) {
      console.log('✅ No CPI duplicates found. Database is clean.');
      return;
    }
    
    // Group events by month to identify duplicates
    const eventsByMonth = {};
    checkResult.rows.forEach(row => {
      const dateStr = row.date instanceof Date ? row.date.toISOString() : row.date;
      const monthKey = dateStr.substring(0, 7); // YYYY-MM format
      if (!eventsByMonth[monthKey]) {
        eventsByMonth[monthKey] = [];
      }
      eventsByMonth[monthKey].push(row);
    });
    
    console.log('\n📊 Events grouped by month:');
    Object.keys(eventsByMonth).forEach(month => {
      console.log(`${month}: ${eventsByMonth[month].length} events`);
    });
    
    // Clean up duplicates, keeping only the oldest event for each month
    let totalDeleted = 0;
    
    for (const [month, events] of Object.entries(eventsByMonth)) {
      if (events.length > 1) {
        console.log(`\n🧹 Cleaning up ${events.length} duplicate events for ${month}...`);
        
        // Sort by created_at (oldest first) and keep the first one
        events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const keepEvent = events[0];
        const deleteEvents = events.slice(1);
        
        console.log(`Keeping event ID ${keepEvent.id} (${keepEvent.title} on ${keepEvent.date})`);
        
        // Delete the duplicate events
        for (const event of deleteEvents) {
          const deleteQuery = 'DELETE FROM upcoming_events WHERE id = $1';
          await pool.query(deleteQuery, [event.id]);
          console.log(`Deleted duplicate event ID ${event.id} (${event.title} on ${event.date})`);
          totalDeleted++;
        }
      }
    }
    
    console.log(`\n✅ Cleanup completed! Deleted ${totalDeleted} duplicate CPI events.`);
    
    // Verify the cleanup
    const verifyResult = await pool.query(checkQuery);
    console.log(`\n📋 Remaining CPI events: ${verifyResult.rows.length}`);
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Title: "${row.title}", Date: ${row.date}, Source: ${row.source}`);
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up CPI duplicates:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupCPIDuplicates()
    .then(() => {
      console.log('🎉 CPI duplicate cleanup script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 CPI duplicate cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupCPIDuplicates };
