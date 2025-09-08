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
        name: 'Crypto Market Watch',
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
      
      sendSmtpEmail.subject = 'Confirm Your Email - Crypto Market Watch';
      sendSmtpEmail.htmlContent = this.generateConfirmationEmailHTML(confirmationUrl, userEmail);
      sendSmtpEmail.textContent = this.generateConfirmationEmailText(confirmationUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
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
      
      sendSmtpEmail.subject = 'Reset Your Password - Crypto Market Watch';
      sendSmtpEmail.htmlContent = this.generatePasswordResetEmailHTML(resetUrl, userEmail);
      sendSmtpEmail.textContent = this.generatePasswordResetEmailText(resetUrl, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
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
      
      sendSmtpEmail.subject = 'Welcome to Crypto Market Watch! 🚀';
      sendSmtpEmail.htmlContent = this.generateWelcomeEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateWelcomeEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
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
      
      sendSmtpEmail.subject = 'Your Crypto Market Watch Account Has Been Deleted';
      sendSmtpEmail.htmlContent = this.generateAccountDeletedByAdminEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateAccountDeletedByAdminEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
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
      
      sendSmtpEmail.subject = 'Your Crypto Market Watch Account Has Been Deleted';
      sendSmtpEmail.htmlContent = this.generateAccountDeletedByUserEmailHTML(userName, userEmail);
      sendSmtpEmail.textContent = this.generateAccountDeletedByUserEmailText(userName, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
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
    const severityGradient = this.getSeverityGradient(alert.severity);
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Market Alert - Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #f8fafc; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .header { 
            background: ${severityGradient};
            color: white; 
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            position: relative;
            z-index: 1;
          }
          .header h1 { 
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            position: relative;
            z-index: 1;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
            position: relative;
            z-index: 1;
          }
          .content { 
            background: #1e293b;
            padding: 40px 30px;
            color: #f8fafc;
          }
          .alert-message { 
            font-size: 18px; 
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #334155 0%, #475569 100%);
            border-radius: 12px;
            border-left: 4px solid ${severityColor};
            color: #f8fafc;
            font-weight: 600;
          }
          .alert-details { 
            background: linear-gradient(135deg, #334155 0%, #475569 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
            border: 1px solid #475569;
          }
          .alert-details p {
            margin: 10px 0;
            color: #cbd5e1;
            font-size: 14px;
          }
          .alert-details strong {
            color: #f8fafc;
            font-weight: 600;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #0f172a;
            color: #64748b; 
            font-size: 14px;
          }
          .footer-logo {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            border-radius: 8px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .footer-links { 
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          .footer-links a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.3s ease;
          }
          .footer-links a:hover { 
            color: #00ff88;
          }
          .disclaimer { 
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid rgba(255, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            color: #fca5a5;
            font-size: 14px;
          }
          .disclaimer strong {
            color: #fca5a5;
          }
          .severity-badge {
            display: inline-block;
            background: ${severityColor};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin: 5px 0;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
            .footer-links { flex-direction: column; gap: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${this.getSeverityEmoji(alert.severity)}</div>
            <h1>Market Alert</h1>
            <p><strong>${alert.type.replace(/_/g, ' ')}</strong></p>
          </div>
          
          <div class="content">
            <div class="alert-message">
              ${alert.message}
            </div>
            
            <div class="alert-details">
              <p><strong>Severity:</strong> <span class="severity-badge">${alert.severity.toUpperCase()}</span></p>
              <p><strong>Metric:</strong> ${alert.metric}</p>
              ${alert.value ? `<p><strong>Value:</strong> ${alert.value}</p>` : ''}
              <p><strong>Time:</strong> ${timestamp}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/dashboard" class="cta-button">View Full Dashboard</a>
            </div>
            
            <div class="disclaimer">
              <strong>⚠️ Disclaimer:</strong> This is not financial advice. Always do your own research before making investment decisions. Past performance does not guarantee future results.
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CMM</div>
            <p><strong>Crypto Market Watch</strong></p>
            <p>Advanced cryptocurrency analytics with AI-powered insights</p>
            <div class="footer-links">
              <a href="${frontendUrl}">Visit Website</a>
              <a href="${frontendUrl}/dashboard">Dashboard</a>
              <a href="${frontendUrl}/settings">Settings</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
              You can manage your notification preferences in your account settings.
            </p>
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

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generateConfirmationEmailHTML(confirmationUrl, userEmail = null) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email - Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #f8fafc; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white; 
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            position: relative;
            z-index: 1;
          }
          .header h1 { 
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            position: relative;
            z-index: 1;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
            position: relative;
            z-index: 1;
          }
          .content { 
            background: #1e293b;
            padding: 40px 30px;
            color: #f8fafc;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #0f172a; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
          }
          .link-fallback {
            background: #334155;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .link-fallback p {
            margin: 0;
            font-size: 14px;
            color: #94a3b8;
          }
          .link-fallback a {
            color: #3b82f6;
            word-break: break-all;
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #0f172a;
            color: #64748b; 
            font-size: 14px;
          }
          .footer-logo {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            border-radius: 8px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .footer-links { 
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          .footer-links a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.3s ease;
          }
          .footer-links a:hover { 
            color: #00ff88;
          }
          .security-note {
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid rgba(255, 68, 68, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #fca5a5;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
            .footer-links { flex-direction: column; gap: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📈</div>
            <h1>Crypto Market Watch</h1>
            <p>Confirm Your Email Address</p>
          </div>
          
          <div class="content">
            <p>Welcome to <strong>Crypto Market Watch</strong>! 🎉</p>
            
            <p>Thank you for signing up! To complete your registration and start monitoring the crypto markets with AI-powered insights, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
            </div>
            
            <div class="link-fallback">
              <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
              <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            </div>
            
            <div class="security-note">
              <strong>⏰ Security Notice:</strong> This confirmation link will expire in 24 hours for your security.
            </div>
            
            <p>Once confirmed, you'll have access to:</p>
            <ul style="color: #cbd5e1; margin: 20px 0;">
              <li>📊 Real-time cryptocurrency market data</li>
              <li>🤖 AI-powered market analysis and predictions</li>
              <li>🔔 Custom alerts via email, push notifications, and Telegram</li>
              <li>📅 Economic calendar with market-impacting events</li>
              <li>⛓️ Layer 1 blockchain metrics and analysis</li>
            </ul>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CMM</div>
            <p><strong>Crypto Market Watch</strong></p>
            <p>Advanced cryptocurrency analytics with AI-powered insights</p>
            <div class="footer-links">
              <a href="${frontendUrl}">Visit Website</a>
              <a href="${frontendUrl}/dashboard">Dashboard</a>
              <a href="${frontendUrl}/about">About</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
              If you didn't create this account, you can safely ignore this email.
            </p>
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
Welcome to Crypto Market Watch!

Thank you for signing up! To complete your registration, please confirm your email address by visiting this link:

${confirmationUrl}

This link will expire in 24 hours for security reasons.

Visit our website: ${websiteUrl}

If you didn't create this account, you can safely ignore this email.

Crypto Market Watch
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
            <p><strong>Crypto Market Watch</strong></p>
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

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }

  generateWelcomeEmailHTML(userName, userEmail = null) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
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
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 20px;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .header { 
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #0f172a; 
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(15,23,42,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
          }
          .logo {
            width: 48px;
            height: 48px;
            background: rgba(15, 23, 42, 0.2);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            position: relative;
            z-index: 1;
          }
          .header h1 { 
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            position: relative;
            z-index: 1;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.8;
            font-size: 16px;
            position: relative;
            z-index: 1;
          }
          .content { 
            background: #1e293b;
            padding: 40px 30px;
            color: #f8fafc;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .feature { 
            background: linear-gradient(135deg, #334155 0%, #475569 100%);
            padding: 20px;
            border-radius: 12px;
            margin: 15px 0;
            border-left: 4px solid #3b82f6;
            transition: all 0.3s ease;
          }
          .feature:hover {
            transform: translateX(5px);
            border-left-color: #00ff88;
          }
          .feature strong {
            color: #f8fafc;
            font-size: 16px;
            display: block;
            margin-bottom: 8px;
          }
          .feature span {
            color: #cbd5e1;
            font-size: 14px;
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          }
          .footer { 
            text-align: center; 
            padding: 30px;
            background: #0f172a;
            color: #64748b; 
            font-size: 14px;
          }
          .footer-logo {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            border-radius: 8px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .footer-links { 
            margin: 20px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          .footer-links a { 
            color: #3b82f6; 
            text-decoration: none; 
            font-weight: 500;
            transition: color 0.3s ease;
          }
          .footer-links a:hover { 
            color: #00ff88;
          }
          .celebration {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .celebration p {
            margin: 0;
            color: #00ff88;
            font-weight: 600;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
            .footer-links { flex-direction: column; gap: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚀</div>
            <h1>Welcome to Crypto Market Watch!</h1>
            <p>Your journey to smarter crypto trading starts now</p>
          </div>
          
          <div class="content">
            <p>Hi <strong>${displayName}</strong>,</p>
            
            <div class="celebration">
              <p>🎉 Congratulations! Your account is now active and ready to use.</p>
            </div>
            
            <p>Welcome to the most advanced cryptocurrency monitoring platform! We're excited to have you on board and can't wait to help you stay ahead of the market.</p>
            
            <p>Here's what you can do with your account:</p>
            
            <div class="feature">
              <strong>📊 Real-time Market Data</strong>
              <span>Get live cryptocurrency prices, market caps, trading volumes, and comprehensive market analysis</span>
            </div>
            
            <div class="feature">
              <strong>🤖 AI-Powered Analysis</strong>
              <span>Receive intelligent market insights, predictions, and automated analysis powered by advanced AI</span>
            </div>
            
            <div class="feature">
              <strong>🔔 Smart Alerts</strong>
              <span>Set up custom alerts for price movements, market events, and get notified via email, push notifications, and Telegram</span>
            </div>
            
            <div class="feature">
              <strong>📈 Advanced Metrics</strong>
              <span>Access Bitcoin dominance, stablecoin flows, Layer 1 blockchain metrics, and economic calendar events</span>
            </div>
            
            <div class="feature">
              <strong>📅 Economic Calendar</strong>
              <span>Stay informed about market-impacting events and economic indicators that affect crypto markets</span>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/dashboard" class="cta-button">Get Started Now</a>
            </div>
            
            <p>Ready to explore? Log in to your account and discover all the powerful features waiting for you!</p>
            
            <p style="margin-top: 30px; padding: 20px; background: #334155; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <strong>💡 Pro Tip:</strong> Start by setting up your first alert to get notified when Bitcoin reaches a specific price point. It's a great way to test the system and stay informed!
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CMM</div>
            <p><strong>Crypto Market Watch</strong></p>
            <p>Advanced cryptocurrency analytics with AI-powered insights</p>
            <div class="footer-links">
              <a href="${frontendUrl}">Visit Website</a>
              <a href="${frontendUrl}/dashboard">Dashboard</a>
              <a href="${frontendUrl}/about">About</a>
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
              Need help? Contact our support team anytime.
            </p>
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
Welcome to Crypto Market Watch! 🚀

Hi ${displayName},

Welcome to Crypto Market Watch! We're excited to have you on board.

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

Crypto Market Watch
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
          <p>Crypto Market Watch</p>
        </div>
        <div class="content">
          <h2>Hello ${displayName},</h2>
          
          <div class="alert">
            <strong>Important Notice:</strong> Your Crypto Market Watch account has been deleted by an administrator.
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
          
          <p>Thank you for using Crypto Market Watch.</p>
          
          <div class="footer">
            <p>Crypto Market Watch Team</p>
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

IMPORTANT NOTICE: Your Crypto Market Watch account has been deleted by an administrator.

We're writing to inform you that your account associated with ${userEmail} has been permanently deleted from our system.

What this means:
- All your account data has been permanently removed
- You will no longer receive market alerts or notifications
- Your subscription (if any) has been cancelled
- You can no longer access your dashboard or account settings

If you believe this was done in error:
Please contact our support team immediately if you believe your account was deleted by mistake. We may be able to help restore your account if contacted within a reasonable timeframe.

Thank you for using Crypto Market Watch.

Crypto Market Watch Team
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
          <p>Crypto Market Watch</p>
        </div>
        <div class="content">
          <h2>Hello ${displayName},</h2>
          
          <div class="success">
            <strong>Confirmation:</strong> Your Crypto Market Watch account has been successfully deleted as requested.
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
          
          <p>Thank you for being part of the Crypto Market Watch community.</p>
          
          <div class="footer">
            <p>Crypto Market Watch Team</p>
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

CONFIRMATION: Your Crypto Market Watch account has been successfully deleted as requested.

We're writing to confirm that your account associated with ${userEmail} has been permanently deleted from our system.

What has been removed:
- All your account data and personal information
- Your market alerts and notification preferences
- Your subscription (if any) has been cancelled
- Access to your dashboard and account settings

We're sorry to see you go!

If you change your mind in the future, you're always welcome to create a new account with us. We're constantly improving our platform and adding new features.

Thank you for being part of the Crypto Market Watch community.

Crypto Market Watch Team
This is an automated message. Please do not reply to this email.
    `.trim();
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffbb33';
      case 'low':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  }

  getSeverityGradient(severity) {
    switch (severity) {
      case 'high':
        return 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)';
      case 'medium':
        return 'linear-gradient(135deg, #ffbb33 0%, #ff8800 100%)';
      case 'low':
        return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      default:
        return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Brevo email service not configured' };
    }

    try {
      // Test by sending a simple email to ourselves
      const testEmail = new SibApiV3Sdk.SendSmtpEmail();
      testEmail.subject = 'Test Email - Crypto Market Watch';
      testEmail.htmlContent = '<h1>Test Email</h1><p>This is a test email from Brevo.</p>';
      testEmail.sender = {
        name: 'Crypto Market Watch',
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
