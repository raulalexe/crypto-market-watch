/**
 * Email Confirmation Template
 * 
 * Table-based email template for email confirmation emails
 */

const BaseEmailTemplate = require('./base-template');

class ConfirmationEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate email confirmation HTML
   */
  generateHTML(confirmationUrl, userEmail = null) {
    const title = 'Confirm Your Email - Crypto Market Watch';
    
    // Header content
    const headerContent = `
      <h1>📧 Confirm Your Email</h1>
      <p>Please verify your email address to activate your account</p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="padding: 0 10px;">
            <p>Thank you for signing up! To complete your registration and start using Crypto Market Watch, please confirm your email address by clicking the button below:</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td align="center" style="padding: 30px 10px;">
            <a href="${confirmationUrl}" class="cta-button" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; max-width: 280px; width: 100%;">Confirm Email Address</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="background: #334155; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; padding: 20px 10px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">
              <strong>Button not working?</strong> Copy and paste this link into your browser:
            </p>
            <p style="margin: 8px 0 0; font-size: 14px;">
              <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all; max-width: 100%; overflow-wrap: break-word;">${confirmationUrl}</a>
            </p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="padding: 0 10px;">
            <p>Once confirmed, you'll have access to:</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="background: #334155; padding: 20px 10px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Real-time Market Data</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Live cryptocurrency prices, market caps, and trading volumes</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="background: #334155; padding: 20px 10px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">AI-Powered Analysis</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Intelligent market insights and automated predictions</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="background: #334155; padding: 20px 10px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Smart Alerts</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Custom notifications for price movements and market events</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 100%;">
        <tr>
          <td style="padding: 0 10px;">
            <p>This confirmation link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
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
   * Generate email confirmation text version
   */
  generateText(confirmationUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Confirm Your Email - Crypto Market Watch

Thank you for signing up! To complete your registration and start using Crypto Market Watch, please confirm your email address by clicking the link below:

${confirmationUrl}

Once confirmed, you'll have access to:
- Real-time Market Data: Live cryptocurrency prices, market caps, and trading volumes
- AI-Powered Analysis: Intelligent market insights and automated predictions  
- Smart Alerts: Custom notifications for price movements and market events

This confirmation link will expire in 24 hours for security reasons.

If you didn't create an account with us, you can safely ignore this email.

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }
}

module.exports = ConfirmationEmailTemplate;
