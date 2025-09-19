/**
 * Upgrade Email Template
 * 
 * Table-based email template for subscription upgrade notifications
 */

const BaseEmailTemplate = require('./base-template');

class UpgradeEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate upgrade email HTML
   */
  generateHTML(userName, userEmail = null, planType = 'Pro', subscriptionDetails = {}) {
    const displayName = userName || 'there';
    const title = `Welcome to ${planType}! - Crypto Market Watch`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #0f172a; padding: 30px 20px; text-align: center; margin: 0;">
        🎉 Welcome to ${planType}!
      </h1>
      <p style="background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #0f172a; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Your upgrade is complete and you're ready to go!
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Hi <strong style="color: #00ff88;">${displayName}</strong>,</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #00ff88; font-weight: 600;">Congratulations! Your ${planType} subscription is now active.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Thank you for upgrading to ${planType}! You now have access to all the premium features that will help you stay ahead of the crypto market.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Your ${planType} benefits:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Advanced Analytics</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Access to premium market analysis, AI insights, and advanced charting tools</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Priority Alerts</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Get instant notifications for critical market movements and opportunities</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Exclusive Features</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Access to premium indicators, backtesting tools, and market sentiment analysis</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">24/7 Support</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Priority customer support and direct access to our expert team</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button" style="background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #0f172a;">Access Your Dashboard</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Ready to explore your new features? Log in to your dashboard and discover everything ${planType} has to offer!</p>
          </td>
        </tr>
      </table>
      
      ${subscriptionDetails.billingCycle ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #cbd5e1;">
              <strong style="color: #3b82f6;">Subscription Details:</strong><br>
              Plan: ${planType}<br>
              Billing: ${subscriptionDetails.billingCycle}<br>
              ${subscriptionDetails.nextBillingDate ? `Next billing: ${subscriptionDetails.nextBillingDate}` : ''}
            </p>
          </td>
        </tr>
      </table>
      ` : ''}
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>If you have any questions about your new subscription or need help getting started, don't hesitate to contact our support team.</p>
            <p>Thank you for choosing Crypto Market Watch!</p>
          </td>
        </tr>
      </table>
    `;

    // Footer content
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    const footerContent = this.generateFooter(unsubscribeUrl);

    return this.generateBaseHTML(title, headerContent, bodyContent, footerContent);
  }

  /**
   * Generate upgrade email text version
   */
  generateText(userName, userEmail = null, planType = 'Pro', subscriptionDetails = {}) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Welcome to ${planType}! - Crypto Market Watch

Hi ${displayName},

Congratulations! Your ${planType} subscription is now active.

Thank you for upgrading to ${planType}! You now have access to all the premium features that will help you stay ahead of the crypto market.

Your ${planType} benefits:
- Advanced Analytics: Access to premium market analysis, AI insights, and advanced charting tools
- Priority Alerts: Get instant notifications for critical market movements and opportunities
- Exclusive Features: Access to premium indicators, backtesting tools, and market sentiment analysis
- 24/7 Support: Priority customer support and direct access to our expert team

Ready to explore your new features? Log in to your dashboard: ${frontendUrl}/dashboard

${subscriptionDetails.billingCycle ? `
Subscription Details:
Plan: ${planType}
Billing: ${subscriptionDetails.billingCycle}
${subscriptionDetails.nextBillingDate ? `Next billing: ${subscriptionDetails.nextBillingDate}` : ''}
` : ''}

If you have any questions about your new subscription or need help getting started, don't hesitate to contact our support team.

Thank you for choosing Crypto Market Watch!

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }
}

module.exports = UpgradeEmailTemplate;
