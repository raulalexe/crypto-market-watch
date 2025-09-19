require('dotenv').config({ path: '.env.local' });
const { db } = require('../server/database');
const subscriptionManager = require('../server/services/subscriptionManager');
const emailService = require('../server/services/brevoEmailService');

async function checkSubscriptionExpiry() {
  try {
    console.log('🕐 Starting subscription expiry check...');
    
    // Get all active subscriptions
    const subscriptions = await db.query(`
      SELECT s.*, u.email, u.email_notifications, u.push_notifications, u.telegram_notifications
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' 
      AND s.current_period_end IS NOT NULL
      AND s.plan_type != 'admin'
    `);
    
    console.log(`📊 Found ${subscriptions.rows.length} active subscriptions to check`);
    
    let expiredCount = 0;
    let reminderCount = 0;
    
    for (const subscription of subscriptions.rows) {
      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // Check if subscription is expired
      if (now > endDate) {
        // Mark as expired
        await db.query(`
          UPDATE subscriptions 
          SET status = 'expired', updated_at = NOW()
          WHERE id = $1
        `, [subscription.id]);
        
        console.log(`❌ Subscription expired for user ${subscription.user_id} (${subscription.email})`);
        expiredCount++;
        
        // Send expiration email
        if (subscription.email_notifications) {
          try {
            await emailService.sendSubscriptionExpiredEmail(
              subscription.plan_type,
              subscription.email
            );
            console.log(`📧 Expiration email sent to ${subscription.email}`);
          } catch (error) {
            console.error(`❌ Failed to send expiration email to ${subscription.email}:`, error);
          }
        }
      }
      // Check if subscription expires within 7 days
      else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        console.log(`⚠️  Subscription expires in ${daysUntilExpiry} days for user ${subscription.user_id} (${subscription.email})`);
        
        // Send renewal reminder
        if (subscription.email_notifications) {
          try {
            await emailService.sendRenewalReminderEmail(
              subscription.plan_type,
              daysUntilExpiry,
              subscription.email
            );
            console.log(`📧 Renewal reminder sent to ${subscription.email}`);
            reminderCount++;
          } catch (error) {
            console.error(`❌ Failed to send renewal reminder to ${subscription.email}:`, error);
          }
        }
      }
    }
    
    console.log(`✅ Subscription expiry check completed:`);
    console.log(`   - Expired subscriptions: ${expiredCount}`);
    console.log(`   - Renewal reminders sent: ${reminderCount}`);
    
  } catch (error) {
    console.error('❌ Error checking subscription expiry:', error);
  } finally {
    await db.end();
  }
}

// Run the check
checkSubscriptionExpiry();
