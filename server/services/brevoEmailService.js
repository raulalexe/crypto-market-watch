const SibApiV3Sdk = require('@getbrevo/brevo');
const { alert: alertTemplate, confirmation, accountDeleted, upgrade, renewal, inflation, event: eventTemplate, contact } = require('../templates/email');

class BrevoEmailService {
  constructor() {
    this.apiInstance = null;
    this.isConfigured = false;
    this.initBrevo();
  }

  initBrevo() {
    try {
      const apiKey = process.env.BREVO_API_KEY;
      
      if (apiKey) {
        this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        this.isConfigured = true;
        console.log('✅ Brevo email service configured successfully');
      } else {
        console.log('⚠️ Brevo email service not configured - missing BREVO_API_KEY');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('❌ Error configuring Brevo email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Helper method to log email sending results consistently
   */
  logEmailResult(emailType, recipient, result) {
    const messageId = result.messageId || result.id || 'no-id-returned';
    console.log(`✅ ${emailType} sent to ${recipient}: ${messageId}`);
    
    // Log full response if no messageId is found (for debugging)
    if (!result.messageId && !result.id) {
      console.log(`📧 Brevo response for ${emailType}:`, JSON.stringify(result, null, 2));
    }
  }

  async sendAlertEmail(userEmail, alert, userPreferences = {}) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping email send');
      return false;
    }

    try {
      const severityEmoji = this.getSeverityEmoji(alert.severity);
      const alertType = alert.type.replace(/_/g, ' ');
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `${severityEmoji} Market Alert: ${alertType}`;
      sendSmtpEmail.htmlContent = alertTemplate.generateHTML(alert, userEmail);
      sendSmtpEmail.textContent = alertTemplate.generateText(alert, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0] // Use email prefix as name
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logEmailResult('Alert email', userEmail, result);
      return true;
    } catch (error) {
      console.error('❌ Error sending alert email:', error);
      return false;
    }
  }

  async sendBulkAlertEmails(users, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping bulk email send');
      return { sent: 0, failed: 0 };
    }

    const results = { sent: 0, failed: 0 };

    for (const user of users) {
      if (user.emailNotifications && user.email) {
        const success = await this.sendAlertEmail(user.email, alert, user);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
      }
    }

    console.log(`📧 Bulk email results: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  async sendEmailConfirmation(userEmail, confirmationToken) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping confirmation email');
      return false;
    }

    try {
      const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/confirm-email?token=${confirmationToken}`;
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Confirm Your Email - Crypto Market Watch';
      sendSmtpEmail.htmlContent = confirmation.generateHTML(confirmationUrl, userEmail);
      sendSmtpEmail.textContent = confirmation.generateText(confirmationUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Confirmation email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping password reset email');
      return false;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Reset Your Password - Crypto Market Watch';
      sendSmtpEmail.htmlContent = this.generatePasswordResetEmailHTML(resetUrl, userEmail);
      sendSmtpEmail.textContent = this.generatePasswordResetEmailText(resetUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Password reset email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userName, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping welcome email');
      return false;
    }

    try {
      // Handle case where userName might actually be an email address
      let actualEmail = userEmail;
      let actualName = userName;
      
      // If userEmail is empty but userName looks like an email, swap them
      if (!userEmail && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userName.split('@')[0];
      }
      
      // If userEmail looks like a name and userName looks like an email, swap them
      if (userEmail && !userEmail.includes('@') && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userEmail;
      }
      
      // Ensure we have a valid email
      if (!actualEmail) {
        throw new Error('No valid email address provided');
      }
      
      console.log(`📧 Sending welcome email to: ${actualEmail}, name: ${actualName}`);
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Welcome to Crypto Market Watch! 🚀';
      sendSmtpEmail.htmlContent = this.generateWelcomeEmailHTML(actualName, actualEmail);
      sendSmtpEmail.textContent = this.generateWelcomeEmailText(actualName, actualEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualName || actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logEmailResult('Welcome email', actualEmail, result);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }

  async sendUpgradeEmail(userName, userEmail, planType = 'Pro', subscriptionDetails = {}) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping upgrade email');
      return false;
    }

    try {
      // Handle case where userName might actually be an email address
      let actualEmail = userEmail;
      let actualName = userName;
      
      // If userEmail is empty but userName looks like an email, swap them
      if (!userEmail && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userName.split('@')[0];
      }
      
      // If userEmail looks like a name and userName looks like an email, swap them
      if (userEmail && !userEmail.includes('@') && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userEmail;
      }
      
      // Ensure we have a valid email
      if (!actualEmail) {
        throw new Error('No valid email address provided');
      }
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `🎉 Welcome to ${planType}! Your upgrade is complete`;
      sendSmtpEmail.htmlContent = upgrade.generateHTML(actualName, actualEmail, planType, subscriptionDetails);
      sendSmtpEmail.textContent = upgrade.generateText(actualName, actualEmail, planType, subscriptionDetails);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualName || actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Upgrade email sent to ${actualEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending upgrade email:', error);
      return false;
    }
  }

  async sendAccountDeletedByAdminEmail(userName, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping account deleted email');
      return false;
    }

    try {
      // Handle case where userName might actually be an email address
      let actualEmail = userEmail;
      let actualName = userName;
      
      // If userEmail is empty but userName looks like an email, swap them
      if (!userEmail && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userName.split('@')[0];
      }
      
      // If userEmail looks like a name and userName looks like an email, swap them
      if (userEmail && !userEmail.includes('@') && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userEmail;
      }
      
      // Ensure we have a valid email
      if (!actualEmail) {
        throw new Error('No valid email address provided');
      }
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Your Crypto Market Watch Account Has Been Deleted';
      sendSmtpEmail.htmlContent = accountDeleted.generateAdminDeletedHTML(actualName, actualEmail);
      sendSmtpEmail.textContent = accountDeleted.generateAdminDeletedText(actualName, actualEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualName || actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Account deleted email sent to ${actualEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending account deleted email:', error);
      return false;
    }
  }

  async sendAccountDeletedByUserEmail(userName, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping account deleted email');
      return false;
    }

    try {
      // Handle case where userName might actually be an email address
      let actualEmail = userEmail;
      let actualName = userName;
      
      // If userEmail is empty but userName looks like an email, swap them
      if (!userEmail && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userName.split('@')[0];
      }
      
      // If userEmail looks like a name and userName looks like an email, swap them
      if (userEmail && !userEmail.includes('@') && userName && userName.includes('@')) {
        actualEmail = userName;
        actualName = userEmail;
      }
      
      // Ensure we have a valid email
      if (!actualEmail) {
        throw new Error('No valid email address provided');
      }
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Your Crypto Market Watch Account Has Been Deleted';
      sendSmtpEmail.htmlContent = accountDeleted.generateUserDeletedHTML(actualName, actualEmail);
      sendSmtpEmail.textContent = accountDeleted.generateUserDeletedText(actualName, actualEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualName || actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Account deleted email sent to ${actualEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending account deleted email:', error);
      return false;
    }
  }

  async sendRenewalReminderEmail(planType, daysUntilExpiry, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping renewal reminder email');
      return false;
    }

    try {
      // Ensure userEmail is a string
      const actualEmail = String(userEmail || '');
      if (!actualEmail || !actualEmail.includes('@')) {
        throw new Error('No valid email address provided');
      }

      console.log(`📧 Sending renewal reminder email to: ${actualEmail}`);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `⚠️ Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
      sendSmtpEmail.htmlContent = renewal.generateRenewalReminderHTML(planType, daysUntilExpiry);
      sendSmtpEmail.textContent = renewal.generateRenewalReminderText(planType, daysUntilExpiry);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Renewal reminder email sent to ${actualEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending renewal reminder email:', error);
      return false;
    }
  }

  async sendSubscriptionExpiredEmail(planType, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping subscription expired email');
      return false;
    }

    try {
      // Ensure userEmail is a string
      const actualEmail = String(userEmail || '');
      if (!actualEmail || !actualEmail.includes('@')) {
        throw new Error('No valid email address provided');
      }

      console.log(`📧 Sending subscription expired email to: ${actualEmail}`);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `❌ Your ${planType} subscription has expired`;
      sendSmtpEmail.htmlContent = renewal.generateSubscriptionExpiredHTML(planType);
      sendSmtpEmail.textContent = renewal.generateSubscriptionExpiredText(planType);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: actualEmail,
        name: actualEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Subscription expired email sent to ${actualEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending subscription expired email:', error);
      return false;
    }
  }

  async sendInflationDataEmail(inflationData, userEmail) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping inflation data email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `📊 Inflation Data Update - ${new Date().toLocaleDateString()}`;
      sendSmtpEmail.htmlContent = inflation.generateHTML(inflationData, userEmail);
      sendSmtpEmail.textContent = inflation.generateText(inflationData, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Inflation data email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending inflation data email:', error);
      return false;
    }
  }

  async sendEventReminderEmail(event, userEmail, daysUntilEvent = null) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping event reminder email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `📅 Upcoming Event: ${event.title}`;
      sendSmtpEmail.htmlContent = eventTemplate.generateHTML({ events: [event], daysUntilEvent }, userEmail);
      sendSmtpEmail.textContent = eventTemplate.generateText({ events: [event], daysUntilEvent }, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      this.logEmailResult('Event reminder email', userEmail, result);
      return true;
    } catch (error) {
      console.error('❌ Error sending event reminder email:', error);
      return false;
    }
  }

  async sendContactFormEmail(contactData) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping contact form email');
      return false;
    }

    try {
      const { name, email, subject, message, screenshot } = contactData;
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `Contact Form: ${subject}`;
      sendSmtpEmail.htmlContent = contact.generateHTML(contactData);
      sendSmtpEmail.textContent = contact.generateText(contactData);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: process.env.ADMIN_EMAIL || 'admin@crypto-market-watch.xyz',
        name: 'Crypto Market Watch Admin'
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Contact form email sent: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending contact form email:', error);
      return false;
    }
  }

  // Keep the existing methods that are still working (Welcome, Password Reset)
  // These use the already-fixed templates

  generatePasswordResetEmailHTML(resetUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6; 
            color: #f8fafc; 
            background-color: #0f172a;
            margin: 0;
            padding: 0;
          }
          table { border-collapse: collapse; }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .brand-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
            display: inline-block;
          }
          .brand-name {
            font-size: 14px;
            color: #94a3b8;
            margin: 0;
          }
          .header { 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content { 
            background-color: #1e293b;
            padding: 30px 20px;
            color: #f8fafc;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 25px 0;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
          }
          .footer { 
            text-align: center; 
            padding: 30px 20px;
            background-color: #0f172a;
            color: #94a3b8; 
            font-size: 14px;
          }
          .disclaimer { 
            background: #334155; 
            border: 1px solid #dc2626; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0;
            color: #cbd5e1;
          }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
          <tr>
            <td align="center">
              <table class="container" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="brand-header">
                    <div class="brand-logo">Crypto Market Watch</div>
                    <p class="brand-name">Real-time market intelligence & alerts</p>
                  </td>
                </tr>
                <tr>
                  <td class="header">
                    <h1>🔐 Reset Your Password</h1>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                      <a href="${resetUrl}" class="cta-button">Reset Password</a>
                    </div>
                    
                    <div class="disclaimer">
                      <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                      <p style="margin: 8px 0 0; font-size: 14px;">
                        <a href="${resetUrl}" style="color: #fca5a5; word-break: break-all;">${resetUrl}</a>
                      </p>
                    </div>
                    
                    <p>This password reset link will expire in 1 hour for security reasons.</p>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p><strong>Crypto Market Watch</strong></p>
                    <p>Advanced cryptocurrency analytics with AI-powered insights</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #cbd5e1;">
                      You can manage your notification preferences in your account settings.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailText(resetUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
Reset Your Password - Crypto Market Watch

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This password reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

Visit our website: ${websiteUrl}

Crypto Market Watch - Your trusted crypto market intelligence platform
    `.trim();
  }

  generateWelcomeEmailHTML(userName, userEmail = null) {
    // Use Yahoo-compatible template for better email client support
    return this.generateYahooCompatibleWelcomeEmail(userName, userEmail);
  }

  generateYahooCompatibleWelcomeEmail(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            line-height: 1.6; 
            color: #f8fafc; 
            background-color: #0f172a;
            margin: 0;
            padding: 20px 0 0 0;
          }
          table { border-collapse: collapse; }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .brand-header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #3b82f6;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 8px;
            display: inline-block;
          }
          .brand-name {
            font-size: 14px;
            color: #94a3b8;
            margin: 0;
          }
          .header { 
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); 
            color: #0f172a; 
            padding: 30px 20px;
            text-align: center;
            margin-top: 20px;
          }
          .header h1 { 
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .content { 
            background-color: #1e293b;
            padding: 30px 20px;
            color: #f8fafc;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); 
            color: #0f172a; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 25px 0;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
          }
          .footer { 
            text-align: center; 
            padding: 30px 20px;
            background-color: #0f172a;
            color: #94a3b8; 
            font-size: 14px;
          }
          .feature-box { 
            background: #334155; 
            border-left: 4px solid #00ff88; 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
          <tr>
            <td align="center">
              <table class="container" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="brand-header">
                    <div class="brand-logo">Crypto Market Watch</div>
                    <p class="brand-name">Real-time market intelligence & alerts</p>
                  </td>
                </tr>
                <tr>
                  <td class="header">
                    <h1>🚀 Welcome to Crypto Market Watch!</h1>
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    <p>Hi <strong style="color: #00ff88;">${displayName}</strong>,</p>
                    
                    <p>Welcome to Crypto Market Watch! We're excited to have you join our community of crypto enthusiasts and traders.</p>
                    
                    <div class="feature-box">
                      <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Real-time Market Data</strong>
                      <span style="color: #cbd5e1; font-size: 14px;">Live cryptocurrency prices, market caps, and trading volumes</span>
                    </div>
                    
                    <div class="feature-box">
                      <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">AI-Powered Analysis</strong>
                      <span style="color: #cbd5e1; font-size: 14px;">Intelligent market insights and automated predictions</span>
                    </div>
                    
                    <div class="feature-box">
                      <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Smart Alerts</strong>
                      <span style="color: #cbd5e1; font-size: 14px;">Custom notifications for price movements and market events</span>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="${frontendUrl}/dashboard" class="cta-button">Get Started</a>
                    </div>
                    
                    <p>Ready to explore? Log in to your dashboard and start monitoring the crypto markets with our advanced analytics tools!</p>
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    <p><strong>Crypto Market Watch</strong></p>
                    <p>Advanced cryptocurrency analytics with AI-powered insights</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #cbd5e1;">
                      You can manage your notification preferences in your account settings.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
Welcome to Crypto Market Watch! 🚀

Hi ${displayName},

Welcome to Crypto Market Watch! We're excited to have you join our community of crypto enthusiasts and traders.

What you can do:
- Real-time Market Data: Live cryptocurrency prices, market caps, and trading volumes
- AI-Powered Analysis: Intelligent market insights and automated predictions
- Smart Alerts: Custom notifications for price movements and market events

Ready to explore? Log in to your dashboard: ${frontendUrl}/dashboard

Get started and start monitoring the crypto markets with our advanced analytics tools!

Visit our website: ${websiteUrl}

Crypto Market Watch - Your trusted crypto market intelligence platform
    `.trim();
  }

  getSeverityEmoji(severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📊';
      case 'low':
        return 'ℹ️';
      default:
        return '📈';
    }
  }

  getSeverityColor(severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
      case 'high':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'medium':
        return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      case 'low':
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      default:
        return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }
}

module.exports = BrevoEmailService;
