const SibApiV3Sdk = require('@getbrevo/brevo');

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
      sendSmtpEmail.htmlContent = this.generateAlertEmailHTML(alert, userEmail);
      sendSmtpEmail.textContent = this.generateAlertEmailText(alert, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0] // Use email prefix as name
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Alert email sent to ${userEmail}: ${result.messageId}`);
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
      
      sendSmtpEmail.subject = 'Confirm Your Email - Crypto Market Monitor';
      sendSmtpEmail.htmlContent = this.generateConfirmationEmailHTML(confirmationUrl, userEmail);
      sendSmtpEmail.textContent = this.generateConfirmationEmailText(confirmationUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
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
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Reset Your Password - Crypto Market Monitor';
      sendSmtpEmail.htmlContent = this.generatePasswordResetEmailHTML(resetUrl, userEmail);
      sendSmtpEmail.textContent = this.generatePasswordResetEmailText(resetUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
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

  async sendWelcomeEmail(userEmail, userName = null) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping welcome email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Welcome to Crypto Market Monitor! 🚀';
      sendSmtpEmail.htmlContent = this.generateWelcomeEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateWelcomeEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Welcome email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }

  async sendAccountDeletedByAdminEmail(userEmail, userName = null) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping account deletion email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Your Crypto Market Monitor Account Has Been Deleted';
      sendSmtpEmail.htmlContent = this.generateAccountDeletedByAdminEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateAccountDeletedByAdminEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Account deletion email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending account deletion email:', error);
      return false;
    }
  }

  async sendAccountDeletedByUserEmail(userEmail, userName = null) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping account deletion email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = 'Your Crypto Market Monitor Account Has Been Deleted';
      sendSmtpEmail.htmlContent = this.generateAccountDeletedByUserEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateAccountDeletedByUserEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Account deletion confirmation email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending account deletion confirmation email:', error);
      return false;
    }
  }

  getSeverityEmoji(severity) {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  generateUnsubscribeUrl(email) {
    const crypto = require('crypto');
    const token = crypto.createHash('sha256')
      .update(email + (process.env.JWT_SECRET || 'default-secret'))
      .digest('hex');
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
  }

  generateAlertEmailHTML(alert, userEmail = null) {
    const severityColor = this.getSeverityColor(alert.severity);
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-message { font-size: 16px; margin: 15px 0; }
          .alert-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
          .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer-links { margin-top: 15px; }
          .footer-links a { color: #007bff; text-decoration: none; margin: 0 10px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${this.getSeverityEmoji(alert.severity)} Market Alert</h1>
            <p><strong>${alert.type.replace(/_/g, ' ')}</strong></p>
          </div>
          
          <div class="content">
            <div class="alert-message">
              <strong>${alert.message}</strong>
            </div>
            
            <div class="alert-details">
              <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
              <p><strong>Metric:</strong> ${alert.metric}</p>
              ${alert.value ? `<p><strong>Value:</strong> ${alert.value}</p>` : ''}
              <p><strong>Time:</strong> ${timestamp}</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${websiteUrl}" class="cta-button">View Full Dashboard</a>
            </div>
            
            <div class="disclaimer">
              <strong>Disclaimer:</strong> This is not financial advice. Always do your own research before making investment decisions.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Crypto Market Monitor</strong></p>
            <div class="footer-links">
              <a href="${websiteUrl}">Visit Website</a>
              <a href="${websiteUrl}/dashboard">Dashboard</a>
              <a href="${websiteUrl}/settings">Settings</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 10px; font-size: 11px;">You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateAlertEmailText(alert, userEmail = null) {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
MARKET ALERT

${alert.type.replace(/_/g, ' ')}
Severity: ${alert.severity.toUpperCase()}

${alert.message}

Details:
- Metric: ${alert.metric}
${alert.value ? `- Value: ${alert.value}` : ''}
- Time: ${timestamp}

View full dashboard: ${websiteUrl}

---
Disclaimer: This is not financial advice. Always do your own research before making investment decisions.

Crypto Market Monitor
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generateConfirmationEmailHTML(confirmationUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .footer-links { margin-top: 15px; }
          .footer-links a { color: #007bff; text-decoration: none; margin: 0 10px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Crypto Market Monitor!</h1>
          </div>
          
          <div class="content">
            <p>Thank you for signing up! To complete your registration, please confirm your email address by clicking the button below:</p>
            
            <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${confirmationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
          </div>
          
          <div class="footer">
            <p><strong>Crypto Market Monitor</strong></p>
            <div class="footer-links">
              <a href="${websiteUrl}">Visit Website</a>
              <a href="${websiteUrl}/dashboard">Dashboard</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 10px;">If you didn't create this account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateConfirmationEmailText(confirmationUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Welcome to Crypto Market Monitor!

Thank you for signing up! To complete your registration, please confirm your email address by visiting this link:

${confirmationUrl}

This link will expire in 24 hours for security reasons.

Visit our website: ${websiteUrl}

If you didn't create this account, you can safely ignore this email.

Crypto Market Monitor
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generatePasswordResetEmailHTML(resetUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .footer-links { margin-top: 15px; }
          .footer-links a { color: #dc3545; text-decoration: none; margin: 0 10px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          
          <div class="content">
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          
          <div class="footer">
            <p><strong>Crypto Market Monitor</strong></p>
            <div class="footer-links">
              <a href="${websiteUrl}">Visit Website</a>
              <a href="${websiteUrl}/dashboard">Dashboard</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailText(resetUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Reset Your Password

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

Visit our website: ${websiteUrl}

If you didn't request a password reset, you can safely ignore this email.

Crypto Market Monitor
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generateWelcomeEmailHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .feature { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .cta-button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
          .footer-links { margin-top: 15px; }
          .footer-links a { color: #28a745; text-decoration: none; margin: 0 10px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Crypto Market Monitor! 🚀</h1>
          </div>
          
          <div class="content">
            <p>Hi ${displayName},</p>
            
            <p>Welcome to Crypto Market Monitor! We're excited to have you on board.</p>
            
            <p>Here's what you can do with your account:</p>
            
            <div class="feature">
              <strong>📊 Real-time Market Data</strong><br>
              Get live cryptocurrency prices, market caps, and trading volumes
            </div>
            
            <div class="feature">
              <strong>🤖 AI-Powered Analysis</strong><br>
              Receive intelligent market insights and predictions
            </div>
            
            <div class="feature">
              <strong>🚨 Smart Alerts</strong><br>
              Set up custom alerts for price movements and market events
            </div>
            
            <div class="feature">
              <strong>📈 Advanced Metrics</strong><br>
              Access Bitcoin dominance, stablecoin flows, and more
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${websiteUrl}/dashboard" class="cta-button">Get Started</a>
            </div>
            
            <p>Ready to get started? Log in to your account and explore the dashboard!</p>
          </div>
          
          <div class="footer">
            <p><strong>Crypto Market Monitor</strong></p>
            <div class="footer-links">
              <a href="${websiteUrl}">Visit Website</a>
              <a href="${websiteUrl}/dashboard">Dashboard</a>
              <a href="${websiteUrl}/settings">Settings</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 10px;">Thank you for choosing us for your crypto market monitoring needs.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Welcome to Crypto Market Monitor! 🚀

Hi ${displayName},

Welcome to Crypto Market Monitor! We're excited to have you on board.

Here's what you can do with your account:

📊 Real-time Market Data
Get live cryptocurrency prices, market caps, and trading volumes

🤖 AI-Powered Analysis
Receive intelligent market insights and predictions

🚨 Smart Alerts
Set up custom alerts for price movements and market events

📈 Advanced Metrics
Access Bitcoin dominance, stablecoin flows, and more

Get started: ${websiteUrl}/dashboard

Crypto Market Monitor
Thank you for choosing us for your crypto market monitoring needs.
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generateAccountDeletedByAdminEmailHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Account Deleted</h1>
          <p>Crypto Market Monitor</p>
        </div>
        <div class="content">
          <h2>Hello ${displayName},</h2>
          
          <div class="alert">
            <strong>Important Notice:</strong> Your Crypto Market Monitor account has been deleted by an administrator.
          </div>
          
          <p>We're writing to inform you that your account associated with <strong>${userEmail}</strong> has been permanently deleted from our system.</p>
          
          <h3>What this means:</h3>
          <ul>
            <li>All your account data has been permanently removed</li>
            <li>You will no longer receive market alerts or notifications</li>
            <li>Your subscription (if any) has been cancelled</li>
            <li>You can no longer access your dashboard or account settings</li>
          </ul>
          
          <h3>If you believe this was done in error:</h3>
          <p>Please contact our support team immediately if you believe your account was deleted by mistake. We may be able to help restore your account if contacted within a reasonable timeframe.</p>
          
          <p>Thank you for using Crypto Market Monitor.</p>
          
          <div class="footer">
            <p>Crypto Market Monitor Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  generateAccountDeletedByAdminEmailText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
Hello ${displayName},

IMPORTANT NOTICE: Your Crypto Market Monitor account has been deleted by an administrator.

We're writing to inform you that your account associated with ${userEmail} has been permanently deleted from our system.

What this means:
- All your account data has been permanently removed
- You will no longer receive market alerts or notifications
- Your subscription (if any) has been cancelled
- You can no longer access your dashboard or account settings

If you believe this was done in error:
Please contact our support team immediately if you believe your account was deleted by mistake. We may be able to help restore your account if contacted within a reasonable timeframe.

Thank you for using Crypto Market Monitor.

Crypto Market Monitor Team
This is an automated message. Please do not reply to this email.
    `.trim();
  }

  generateAccountDeletedByUserEmailHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Account Deleted</h1>
          <p>Crypto Market Monitor</p>
        </div>
        <div class="content">
          <h2>Hello ${displayName},</h2>
          
          <div class="success">
            <strong>Confirmation:</strong> Your Crypto Market Monitor account has been successfully deleted as requested.
          </div>
          
          <p>We're writing to confirm that your account associated with <strong>${userEmail}</strong> has been permanently deleted from our system.</p>
          
          <h3>What has been removed:</h3>
          <ul>
            <li>All your account data and personal information</li>
            <li>Your market alerts and notification preferences</li>
            <li>Your subscription (if any) has been cancelled</li>
            <li>Access to your dashboard and account settings</li>
          </ul>
          
          <h3>We're sorry to see you go!</h3>
          <p>If you change your mind in the future, you're always welcome to create a new account with us. We're constantly improving our platform and adding new features.</p>
          
          <p>Thank you for being part of the Crypto Market Monitor community.</p>
          
          <div class="footer">
            <p>Crypto Market Monitor Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  generateAccountDeletedByUserEmailText(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
Hello ${displayName},

CONFIRMATION: Your Crypto Market Monitor account has been successfully deleted as requested.

We're writing to confirm that your account associated with ${userEmail} has been permanently deleted from our system.

What has been removed:
- All your account data and personal information
- Your market alerts and notification preferences
- Your subscription (if any) has been cancelled
- Access to your dashboard and account settings

We're sorry to see you go!

If you change your mind in the future, you're always welcome to create a new account with us. We're constantly improving our platform and adding new features.

Thank you for being part of the Crypto Market Monitor community.

Crypto Market Monitor Team
This is an automated message. Please do not reply to this email.
    `.trim();
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'high':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Brevo email service not configured' };
    }

    try {
      // Test by sending a simple email to ourselves
      const testEmail = new SibApiV3Sdk.SendSmtpEmail();
      testEmail.subject = 'Test Email - Crypto Market Monitor';
      testEmail.htmlContent = '<h1>Test Email</h1><p>This is a test email from Brevo.</p>';
      testEmail.sender = {
        name: 'Crypto Market Monitor',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
      };
      testEmail.to = [{
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com',
        name: 'Test'
      }];

      await this.apiInstance.sendTransacEmail(testEmail);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = BrevoEmailService;
