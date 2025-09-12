const { getUserByEmail, insertSubscription } = require('../server/database');

async function fixStripeSubscription() {
  try {
    console.log('🔧 Fixing Stripe subscription for raul@palm-tree-tech.xyz...');
    
    // Find the user
    const user = await getUserByEmail('raul@palm-tree-tech.xyz');
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', user.email);
    console.log('💳 Stripe Customer ID:', user.stripe_customer_id);
    
    // Create a manual subscription entry
    const subscriptionData = {
      user_id: user.id,
      plan_type: 'pro',
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: 'sub_manual_fix_' + Date.now(), // Temporary ID
      status: 'active',
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
    
    console.log('📝 Creating subscription...');
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
    
    const emailSent = await emailService.sendUpgradeEmail(user.email, subscriptionDetails);
    if (emailSent) {
      console.log('✅ Upgrade email sent successfully');
    } else {
      console.log('❌ Failed to send upgrade email');
    }
    
    console.log('🎉 Subscription fix completed!');
    console.log('You should now have Pro access and receive the upgrade email.');
    
  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
  }
}

fixStripeSubscription();
