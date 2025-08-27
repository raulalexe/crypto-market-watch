const EventCollector = require('./server/services/eventCollector');

async function testEvents() {
  try {
    console.log('🔍 Testing upcoming events...');
    
    const eventCollector = new EventCollector();
    
    // Test collecting events
    console.log('📅 Collecting upcoming events...');
    const events = await eventCollector.collectUpcomingEvents();
    console.log(`✅ Collected ${events.length} events`);
    
    // Test getting events from database
    console.log('📊 Getting events from database...');
    const dbEvents = await eventCollector.getUpcomingEvents(10);
    console.log(`✅ Retrieved ${dbEvents.length} events from database`);
    
    if (dbEvents.length > 0) {
      console.log('\n📋 Sample events:');
      dbEvents.slice(0, 3).forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.category}) - ${event.impact} impact`);
        console.log(`   Date: ${event.date}`);
        console.log(`   Source: ${event.source}`);
        console.log('');
      });
    }
    
    // Test events summary
    console.log('📈 Getting events summary...');
    const summary = await eventCollector.getEventsSummary();
    console.log('Events Summary:', summary);
    
  } catch (error) {
    console.error('❌ Error testing events:', error.message);
  }
}

testEvents();
