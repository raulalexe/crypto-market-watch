/**
 * Account Deleted Email Templates
 * 
 * Table-based email templates for account deletion notifications
 */

const BaseEmailTemplate = require('./base-template');

class AccountDeletedEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate account deleted by admin email HTML
   */
  generateAdminDeletedHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const title = 'Account Deleted - Crypto Market Watch';
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        🗑️ Account Deleted
      </h1>
      <p style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Your account has been removed by an administrator
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Hi <strong style="color: #dc2626;">${displayName}</strong>,</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #dc2626; font-weight: 600;">Your account has been deleted by an administrator.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>We're writing to inform you that your Crypto Market Watch account has been permanently deleted by an administrator. This action was taken in accordance with our terms of service.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>What this means:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Account Access</strong>
            <span style="color: #cbd5e1; font-size: 14px;">You can no longer access your account or any associated data</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Data Removal</strong>
            <span style="color: #cbd5e1; font-size: 14px;">All your personal data, alerts, and preferences have been permanently deleted</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #dc2626; border-radius: 8px;">
            <strong style="color: #dc2626; font-size: 16px; display: block; margin-bottom: 8px;">Subscriptions</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Any active subscriptions have been cancelled and no further charges will occur</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>If you believe this action was taken in error, please contact our support team immediately.</p>
            <p>Thank you for using Crypto Market Watch.</p>
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
   * Generate account deleted by user email HTML
   */
  generateUserDeletedHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const title = 'Account Deleted - Crypto Market Watch';
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        ✅ Account Deleted
      </h1>
      <p style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Your account has been successfully deleted
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Hi <strong style="color: #059669;">${displayName}</strong>,</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(5, 150, 105, 0.1); border: 1px solid rgba(5, 150, 105, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #059669; font-weight: 600;">Your account has been successfully deleted as requested.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>We've successfully processed your account deletion request. Your Crypto Market Watch account and all associated data have been permanently removed from our systems.</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>What we've done:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #059669; border-radius: 8px;">
            <strong style="color: #059669; font-size: 16px; display: block; margin-bottom: 8px;">Account Removal</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Your account has been permanently deleted from our system</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #059669; border-radius: 8px;">
            <strong style="color: #059669; font-size: 16px; display: block; margin-bottom: 8px;">Data Deletion</strong>
            <span style="color: #cbd5e1; font-size: 14px;">All your personal data, alerts, and preferences have been permanently removed</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #059669; border-radius: 8px;">
            <strong style="color: #059669; font-size: 16px; display: block; margin-bottom: 8px;">Subscription Cancellation</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Any active subscriptions have been cancelled and no further charges will occur</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>We're sorry to see you go! If you change your mind in the future, you're always welcome to create a new account.</p>
            <p>Thank you for using Crypto Market Watch.</p>
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
   * Generate account deleted by admin text version
   */
  generateAdminDeletedText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Account Deleted - Crypto Market Watch

Hi ${displayName},

Your account has been deleted by an administrator.

We're writing to inform you that your Crypto Market Watch account has been permanently deleted by an administrator. This action was taken in accordance with our terms of service.

What this means:
- Account Access: You can no longer access your account or any associated data
- Data Removal: All your personal data, alerts, and preferences have been permanently deleted
- Subscriptions: Any active subscriptions have been cancelled and no further charges will occur

If you believe this action was taken in error, please contact our support team immediately.

Thank you for using Crypto Market Watch.

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  /**
   * Generate account deleted by user text version
   */
  generateUserDeletedText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Account Deleted - Crypto Market Watch

Hi ${displayName},

Your account has been successfully deleted as requested.

We've successfully processed your account deletion request. Your Crypto Market Watch account and all associated data have been permanently removed from our systems.

What we've done:
- Account Removal: Your account has been permanently deleted from our system
- Data Deletion: All your personal data, alerts, and preferences have been permanently removed
- Subscription Cancellation: Any active subscriptions have been cancelled and no further charges will occur

We're sorry to see you go! If you change your mind in the future, you're always welcome to create a new account.

Thank you for using Crypto Market Watch.

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }
}

module.exports = AccountDeletedEmailTemplate;
