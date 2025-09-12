const { getUserByEmail, insertSubscription } = require('../server/database');

async function fixRailwaySubscription() {
  try {
    console.log('🔧 Fixing Stripe subscription on Railway...');
    
    // List all users to find the right one
    const { dbAdapter } = require('../server/database');
    const users = await dbAdapter.all('SELECT id, email, stripe_customer_id FROM users ORDER BY id');
    
    console.log('👥 Found users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Stripe: ${user.stripe_customer_id || 'None'}`);
    });
    
    // Find user with Stripe customer ID (they completed checkout)
    const userWithStripe = users.find(u => u.stripe_customer_id);
    if (!userWithStripe) {
      console.log('❌ No user found with Stripe customer ID');
      return;
    }
    
    console.log(`\n👤 Found user with Stripe ID: ${userWithStripe.email}`);
    
    // Check if they already have a subscription
    const existingSub = await dbAdapter.get(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = ?',
      [userWithStripe.id, 'active']
    );
    
    if (existingSub) {
      console.log('✅ User already has an active subscription:', existingSub.plan_type);
      return;
    }
    
    // Create subscription
    const subscriptionData = {
      user_id: userWithStripe.id,
      plan_type: 'pro',
      stripe_customer_id: userWithStripe.stripe_customer_id,
      stripe_subscription_id: 'sub_manual_fix_' + Date.now(),
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    
    console.log('📝 Creating Pro subscription...');
    const subscriptionId = await insertSubscription(subscriptionData);
    console.log('✅ Subscription created with ID:', subscriptionId);
    
    // Send upgrade email
    console.log('📧 Sending upgrade email...');
    const EmailService = require('../server/services/emailService');
    const emailService = new EmailService();
    
    const subscriptionDetails = {
      current_period_start: subscriptionData.current_period_start,
      current_period_end: subscriptionData.current_period_end,
      payment_method: 'stripe',
      payment_id: subscriptionData.stripe_subscription_id,
      plan_name: 'Pro Plan'
    };
    
    const emailSent = await emailService.sendUpgradeEmail(userWithStripe.email, subscriptionDetails);
    if (emailSent) {
      console.log('✅ Upgrade email sent successfully');
    } else {
      console.log('❌ Failed to send upgrade email');
    }
    
    console.log('🎉 Subscription fix completed!');
    console.log('User should now have Pro access and receive the upgrade email.');
    
  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
  }
}

fixRailwaySubscription();
