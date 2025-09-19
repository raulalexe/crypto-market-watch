/**
 * Renewal Email Templates
 * 
 * Table-based email templates for subscription renewal reminders and expiration notifications
 */

const BaseEmailTemplate = require('./base-template');

class RenewalEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate renewal reminder email HTML
   */
  generateRenewalReminderHTML(planType, daysUntilExpiry) {
    const title = `Subscription Renewal Reminder - ${planType}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        ⚠️ Renewal Reminder
      </h1>
      <p style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Your ${planType} subscription will expire in <strong style="color: #f59e0b;">${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</strong>. To continue enjoying all the premium features, please renew your subscription.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #f59e0b; font-weight: 600;">Don't lose access to your premium features!</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>What you'll lose if you don't renew:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <strong style="color: #f59e0b; font-size: 16px; display: block; margin-bottom: 8px;">Advanced Analytics</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Premium market analysis and AI insights will be disabled</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <strong style="color: #f59e0b; font-size: 16px; display: block; margin-bottom: 8px;">Priority Alerts</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Custom alerts and notifications will stop working</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #f59e0b; border-radius: 8px;">
            <strong style="color: #f59e0b; font-size: 16px; display: block; margin-bottom: 8px;">Premium Features</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Access to exclusive tools and indicators will be restricted</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" class="cta-button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">Renew Now</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Renewing is quick and easy! Simply click the button above or visit your account settings to continue your subscription.</p>
            <p>Thank you for being a valued Crypto Market Watch user!</p>
          </td>
        </tr>
      </table>
    `;

    // Footer content
    const footerContent = this.generateFooter();

    return this.generateBaseHTML(title, headerContent, bodyContent, footerContent);
  }

  /**
   * Generate subscription expired email HTML
   */
  generateSubscriptionExpiredHTML(planType) {
    const title = `Subscription Expired - ${planType}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        ❌ Subscription Expired
      </h1>
      <p style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Your ${planType} subscription has expired
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Your ${planType} subscription has expired. You now have limited access to Crypto Market Watch features.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #dc2626; font-weight: 600;">Premium features are no longer available</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>What's changed:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Limited Access</strong>
            <span style="color: #cbd5e1; font-size: 14px;">You can still view basic market data but advanced features are disabled</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Alerts Disabled</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Custom alerts and notifications are no longer active</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Premium Tools</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Advanced analytics and exclusive features are no longer accessible</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" class="cta-button" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white;">Reactivate Subscription</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Don't worry! You can reactivate your subscription at any time to regain access to all premium features.</p>
            <p>We hope to see you back soon!</p>
          </td>
        </tr>
      </table>
    `;

    // Footer content
    const footerContent = this.generateFooter();

    return this.generateBaseHTML(title, headerContent, bodyContent, footerContent);
  }

  /**
   * Generate renewal reminder text version
   */
  generateRenewalReminderText(planType, daysUntilExpiry) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
Subscription Renewal Reminder - ${planType}

Your ${planType} subscription will expire in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. To continue enjoying all the premium features, please renew your subscription.

Don't lose access to your premium features!

What you'll lose if you don't renew:
- Advanced Analytics: Premium market analysis and AI insights will be disabled
- Priority Alerts: Custom alerts and notifications will stop working
- Premium Features: Access to exclusive tools and indicators will be restricted

Renew now: ${frontendUrl}/subscription

Renewing is quick and easy! Simply visit your account settings to continue your subscription.

Thank you for being a valued Crypto Market Watch user!

Visit our website: ${websiteUrl}

Crypto Market Watch
    `.trim();
  }

  /**
   * Generate subscription expired text version
   */
  generateSubscriptionExpiredText(planType) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
Subscription Expired - ${planType}

Your ${planType} subscription has expired. You now have limited access to Crypto Market Watch features.

Premium features are no longer available.

What's changed:
- Limited Access: You can still view basic market data but advanced features are disabled
- Alerts Disabled: Custom alerts and notifications are no longer active
- Premium Tools: Advanced analytics and exclusive features are no longer accessible

Reactivate your subscription: ${frontendUrl}/subscription

Don't worry! You can reactivate your subscription at any time to regain access to all premium features.

We hope to see you back soon!

Visit our website: ${websiteUrl}

Crypto Market Watch
    `.trim();
  }
}

module.exports = RenewalEmailTemplate;
