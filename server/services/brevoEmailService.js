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
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
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
      const resetUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
      
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
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
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

  async sendUpgradeEmail(userEmail, userName = null, planType = 'Pro', subscriptionDetails = {}) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping upgrade email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `🎉 Welcome to ${planType}! Your upgrade is complete`;
      sendSmtpEmail.htmlContent = this.generateUpgradeEmailHTML(userName, userEmail, planType, subscriptionDetails);
      sendSmtpEmail.textContent = this.generateUpgradeEmailText(userName, userEmail, planType, subscriptionDetails);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userName || userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Upgrade email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending upgrade email:', error);
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
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
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
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
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
    // Use Yahoo-compatible template for better email client support
    return this.generateYahooCompatibleAlertEmail(alert, userEmail);
  }

  generateYahooCompatibleAlertEmail(alert, userEmail = null) {
    const severityColor = this.getSeverityColor(alert.severity);
    
    // Fix timestamp formatting - handle both alert.timestamp and alert.eventDate
    let timestamp = 'Just now';
    try {
      if (alert.type === 'UPCOMING_EVENT' && alert.eventDate) {
        // For upcoming events, show event date and time remaining
        const eventDate = new Date(alert.eventDate);
        const now = new Date();
        const diffMs = eventDate - now;
        
        if (diffMs > 0) {
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          if (diffDays > 0) {
            timestamp = `Event in ${diffDays} days and ${diffHours} hours (${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()})`;
          } else if (diffHours > 0) {
            timestamp = `Event in ${diffHours} hours (${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()})`;
          } else {
            timestamp = `Event today (${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()})`;
          }
        } else {
          timestamp = `Event passed (${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()})`;
        }
      } else if (alert.timestamp) {
        // For regular alerts, show when the alert was created
        const alertDate = new Date(alert.timestamp);
        if (!isNaN(alertDate.getTime())) {
          timestamp = alertDate.toLocaleString();
        } else {
          timestamp = 'Time unavailable';
        }
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      timestamp = 'Time unavailable';
    }
    
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
            background-color: ${severityColor};
            color: #ffffff; 
            padding: 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            font-size: 22px;
            font-weight: bold;
          }
          .header p {
            margin: 8px 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content { 
            background-color: #1e293b;
            padding: 30px 20px;
            color: #f8fafc;
          }
          .alert-message { 
            font-size: 18px; 
            margin: 20px 0;
            padding: 20px;
            background-color: #334155;
            border-radius: 8px;
            border-left: 4px solid ${severityColor};
          }
          .alert-details { 
            background-color: #334155;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            color: #f8fafc;
            border: 1px solid #dee2e6;
          }
          .alert-details p {
            margin: 8px 0;
            color: #cbd5e1;
          }
          .alert-details strong {
            color: #3b82f6;
          }
          .cta-button { 
            display: inline-block; 
            background-color: #3b82f6;
            color: #ffffff; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
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
          .footer-links { 
            margin: 20px 0;
          }
          .footer-links a { 
            color: #3b82f6; 
            text-decoration: none; 
            margin: 0 10px;
          }
          .disclaimer {
            background-color: #1e293b;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          .disclaimer p {
            margin: 0;
            color: #cbd5e1;
            font-size: 14px;
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
                    <div class="brand-logo">₿ Crypto Market Watch</div>
                    <p class="brand-name">Real-time market intelligence & alerts</p>
                  </td>
                </tr>
                <tr>
                  <td class="header">
                    <h1>${this.getSeverityEmoji(alert.severity)} Market Alert</h1>
                    <p><strong>${alert.type.replace(/_/g, ' ')}</strong></p>
                  </td>
                </tr>
                
                <tr>
                  <td class="content">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="alert-message">
                          <strong>${alert.message}</strong>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="alert-details">
                          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
                          <p><strong>Metric:</strong> ${alert.metric}</p>
                          ${alert.value ? `<p><strong>Value:</strong> ${alert.value}</p>` : ''}
                          <p><strong>Time:</strong> ${timestamp}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 30px 0;">
                          <a href="${frontendUrl}/dashboard" class="cta-button">View Dashboard</a>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="disclaimer">
                          <p><strong>Disclaimer:</strong> This is not financial advice. Always do your own research before making investment decisions.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td class="footer">
                    <p><strong>Crypto Market Watch</strong></p>
                    <p>Advanced cryptocurrency analytics with AI-powered insights</p>
                    <div class="footer-links">
                      <a href="${frontendUrl}/dashboard">Dashboard</a>
                      <a href="${frontendUrl}/alerts">Alerts</a>
                      <a href="${frontendUrl}/settings">Settings</a>
                      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #666666;">
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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
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
            <div class="logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgY2lyY2xlIHdpdGggZ3JhZGllbnQgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTBCOTgxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNTk2Njk7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0idXJsKCNiZ0dyYWRpZW50KSIvPgogIAogIDwhLS0gVHJlbmRpbmcgdXAgYXJyb3cgaWNvbiB3aXRoIGJldHRlciB2aXNpYmlsaXR5IC0tPgogIDxwYXRoIGQ9Ik04IDIyTDEyIDE4TDE2IDIwTDI0IDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTIwIDEySDI0VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=" alt="Crypto Market Watch Logo" style="width: 48px; height: 48px;" />
            </div>
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
    // Use Yahoo-compatible template for better email client support
    return this.generateYahooCompatibleWelcomeEmail(userName, userEmail);
  }

  generateYahooCompatibleWelcomeEmail(userName, userEmail = null) {
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
            font-family: Arial, Helvetica, sans-serif; 
            line-height: 1.6; 
            color: #333333; 
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          table { border-collapse: collapse; }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
          }
          .header { 
            background-color: #00cc6a;
            color: #ffffff; 
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 { 
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 16px;
          }
          .content { 
            background-color: #ffffff;
            padding: 30px 20px;
            color: #333333;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333333;
          }
          .feature { 
            background-color: #f8f9fa;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #3b82f6;
          }
          .feature strong {
            color: #333333;
            font-size: 16px;
            display: block;
            margin-bottom: 8px;
          }
          .feature span {
            color: #666666;
            font-size: 14px;
          }
          .cta-button { 
            display: inline-block; 
            background-color: #3b82f6;
            color: #ffffff; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
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
          .footer-links { 
            margin: 20px 0;
          }
          .footer-links a { 
            color: #3b82f6; 
            text-decoration: none; 
            margin: 0 10px;
          }
          .celebration {
            background-color: #e8f5e8;
            border: 1px solid #00cc6a;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .celebration p {
            margin: 0;
            color: #00cc6a;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center">
              <table class="container" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="header">
                    <h1>Welcome to Crypto Market Watch!</h1>
                    <p>Your journey to smarter crypto trading starts now</p>
                  </td>
                </tr>
                
                <tr>
                  <td class="content">
                    <p>Hi <strong>${displayName}</strong>,</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="celebration">
                          <p>Congratulations! Your account is now active and ready to use.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <p>Welcome to the most advanced cryptocurrency monitoring platform! We're excited to have you on board and can't wait to help you stay ahead of the market.</p>
                    
                    <p>Here's what you can do with your account:</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="feature">
                          <strong>Real-time Market Data</strong>
                          <span>Get live cryptocurrency prices, market caps, trading volumes, and comprehensive market analysis</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature">
                          <strong>AI-Powered Analysis</strong>
                          <span>Receive intelligent market insights, predictions, and automated analysis powered by advanced AI</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature">
                          <strong>Smart Alerts</strong>
                          <span>Set up custom alerts for price movements, market events, and get notified via email, push notifications, and Telegram</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature">
                          <strong>Advanced Metrics</strong>
                          <span>Access Bitcoin dominance, stablecoin flows, Layer 1 blockchain metrics, and economic calendar events</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="feature">
                          <strong>Economic Calendar</strong>
                          <span>Stay informed about market-impacting events and economic indicators that affect crypto markets</span>
                        </td>
                      </tr>
                    </table>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 30px 0;">
                          <a href="${frontendUrl}/dashboard" class="cta-button">Get Started Now</a>
                        </td>
                      </tr>
                    </table>
                    
                    <p>Ready to explore? Log in to your account and discover all the powerful features waiting for you!</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; border-left: 4px solid #3b82f6;">
                          <p style="margin: 0;">
                            <strong>Pro Tip:</strong> Start by setting up your first alert to get notified when Bitcoin reaches a specific price point. It's a great way to test the system and stay informed!
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr>
                  <td class="footer">
                    <p><strong>Crypto Market Watch</strong></p>
                    <p>Advanced cryptocurrency analytics with AI-powered insights</p>
                    <div class="footer-links">
                      <a href="${frontendUrl}/dashboard">Dashboard</a>
                      <a href="${frontendUrl}/about">About</a>
                      ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
                    </div>
                    <p style="margin-top: 20px; font-size: 12px; color: #666666;">
                      Need help? Contact our support team anytime.
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deleted - Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #f8fafc; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
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
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
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
          .content h2 {
            color: #f8fafc;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content h3 {
            color: #f8fafc;
            font-size: 20px;
            margin: 30px 0 15px;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .alert { 
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(220, 38, 38, 0.3);
            color: #fca5a5;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            font-size: 16px;
          }
          .alert strong {
            color: #fca5a5;
            font-weight: 600;
          }
          .content ul {
            color: #cbd5e1;
            margin: 20px 0;
            padding-left: 20px;
          }
          .content li {
            margin-bottom: 10px;
            font-size: 16px;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
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
            background: #dc2626;
            border-radius: 8px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .footer p {
            margin: 10px 0;
            color: #64748b;
          }
          .footer strong {
            color: #f8fafc;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgY2lyY2xlIHdpdGggZ3JhZGllbnQgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTBCOTgxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNTk2Njk7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0idXJsKCNiZ0dyYWRpZW50KSIvPgogIAogIDwhLS0gVHJlbmRpbmcgdXAgYXJyb3cgaWNvbiB3aXRoIGJldHRlciB2aXNpYmlsaXR5IC0tPgogIDxwYXRoIGQ9Ik04IDIyTDEyIDE4TDE2IDIwTDI0IDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTIwIDEySDI0VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=" alt="Crypto Market Watch Logo" style="width: 48px; height: 48px;" />
            </div>
            <h1>Account Deleted</h1>
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
            
            <div style="text-align: center;">
              <a href="${frontendUrl}/contact" class="button">Contact Support</a>
            </div>
            
            <p>Thank you for using Crypto Market Watch.</p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CMM</div>
            <p><strong>Crypto Market Watch Team</strong></p>
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deleted - Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #f8fafc; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
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
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
          .content h2 {
            color: #f8fafc;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content h3 {
            color: #f8fafc;
            font-size: 20px;
            margin: 30px 0 15px;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 20px;
            color: #cbd5e1;
          }
          .success { 
            background: rgba(5, 150, 105, 0.1);
            border: 1px solid rgba(5, 150, 105, 0.3);
            color: #6ee7b7;
            padding: 20px;
            border-radius: 12px;
            margin: 25px 0;
            font-size: 16px;
          }
          .success strong {
            color: #6ee7b7;
            font-weight: 600;
          }
          .content ul {
            color: #cbd5e1;
            margin: 20px 0;
            padding-left: 20px;
          }
          .content li {
            margin-bottom: 10px;
            font-size: 16px;
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(5, 150, 105, 0.4);
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
            background: #059669;
            border-radius: 8px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .footer p {
            margin: 10px 0;
            color: #64748b;
          }
          .footer strong {
            color: #f8fafc;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .header, .content, .footer { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIEJhY2tncm91bmQgY2lyY2xlIHdpdGggZ3JhZGllbnQgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTBCOTgxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNTk2Njk7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0idXJsKCNiZ0dyYWRpZW50KSIvPgogIAogIDwhLS0gVHJlbmRpbmcgdXAgYXJyb3cgaWNvbiB3aXRoIGJldHRlciB2aXNpYmlsaXR5IC0tPgogIDxwYXRoIGQ9Ik04IDIyTDEyIDE4TDE2IDIwTDI0IDEyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTIwIDEySDI0VjE2IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=" alt="Crypto Market Watch Logo" style="width: 48px; height: 48px;" />
            </div>
            <h1>Account Deleted</h1>
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
            
            <div style="text-align: center;">
              <a href="${frontendUrl}" class="button">Create New Account</a>
            </div>
            
            <p>Thank you for being part of the Crypto Market Watch community.</p>
          </div>
          
          <div class="footer">
            <div class="footer-logo">CMM</div>
            <p><strong>Crypto Market Watch Team</strong></p>
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

  generateUpgradeEmailHTML(userName, userEmail = null, planType = 'Pro', subscriptionDetails = {}) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    // Get plan features based on plan type
    const planFeatures = this.getPlanFeatures(planType);
    const planPrice = this.getPlanPrice(planType);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${planType} - Crypto Market Watch</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #ffffff; 
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
            padding: 0 20px;
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
            background: #0f172a;
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
            font-size: 16px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          .content { 
            padding: 40px 30px; 
            color: #ffffff;
          }
          .success-badge {
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #0f172a;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 20px;
          }
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .feature-card {
            background: #334155;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #00ff88;
          }
          .feature-card h4 {
            margin: 0 0 10px;
            color: #00ff88;
            font-size: 16px;
          }
          .feature-card p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
            color: #0f172a;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .subscription-details {
            background: #334155;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
          }
          .subscription-details h3 {
            margin: 0 0 15px;
            color: #00ff88;
          }
          .subscription-details p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer { 
            background: #0f172a; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #334155;
          }
          .footer p { 
            margin: 5px 0; 
            font-size: 14px; 
            opacity: 0.7; 
          }
          .social-links {
            margin: 20px 0;
          }
          .social-links a {
            color: #00ff88;
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
            .features-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📈</div>
            <h1>🎉 Welcome to ${planType}!</h1>
            <p>Your upgrade is complete and you're ready to unlock advanced features</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✅ Upgrade Successful</div>
            
            <h2>Hello ${displayName}!</h2>
            
            <p>Congratulations! Your upgrade to <strong>${planType}</strong> has been successfully processed. You now have access to all the advanced features that will help you stay ahead in the crypto market.</p>
            
            <div class="subscription-details">
              <h3>📋 Your Subscription Details</h3>
              <p><strong>Plan:</strong> ${planType}</p>
              <p><strong>Price:</strong> $${planPrice}/month</p>
              <p><strong>Status:</strong> Active</p>
              ${subscriptionDetails.current_period_end ? `<p><strong>Next Billing:</strong> ${new Date(subscriptionDetails.current_period_end).toLocaleDateString()}</p>` : ''}
            </div>
            
            <h3>🚀 New Features Unlocked</h3>
            <div class="features-grid">
              ${planFeatures.map(feature => `
                <div class="feature-card">
                  <h4>${feature.title}</h4>
                  <p>${feature.description}</p>
                </div>
              `).join('')}
            </div>
            
            <h3>🎯 What's Next?</h3>
            <p>Now that you have ${planType} access, here's how to make the most of your subscription:</p>
            <ul>
              <li><strong>Explore Advanced Analytics:</strong> Access detailed market insights and AI-powered analysis</li>
              <li><strong>Set Up Alerts:</strong> Configure custom alerts for your favorite cryptocurrencies</li>
              <li><strong>Use the API:</strong> Integrate our data into your own applications</li>
              <li><strong>Export Data:</strong> Download historical data for your analysis</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/app/dashboard" class="cta-button">Access Your Dashboard</a>
            </div>
            
            <p>If you have any questions about your new ${planType} features or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Thank you for choosing Crypto Market Watch!</p>
          </div>
          
          <div class="footer">
            <div class="social-links">
              <a href="${websiteUrl}">Website</a>
              <a href="${frontendUrl}/app/settings">Account Settings</a>
              <a href="${frontendUrl}/app/support">Support</a>
            </div>
            <p>Crypto Market Watch Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" style="color: #64748b; font-size: 12px;">Unsubscribe</a></p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `.trim();
  }

  generateUpgradeEmailText(userName, userEmail = null, planType = 'Pro', subscriptionDetails = {}) {
    const displayName = userName || 'there';
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Get plan features based on plan type
    const planFeatures = this.getPlanFeatures(planType);
    const planPrice = this.getPlanPrice(planType);
    
    return `
🎉 Welcome to ${planType}! Your upgrade is complete

Hello ${displayName}!

Congratulations! Your upgrade to ${planType} has been successfully processed. You now have access to all the advanced features that will help you stay ahead in the crypto market.

📋 Your Subscription Details:
- Plan: ${planType}
- Price: $${planPrice}/month
- Status: Active
${subscriptionDetails.current_period_end ? `- Next Billing: ${new Date(subscriptionDetails.current_period_end).toLocaleDateString()}` : ''}

🚀 New Features Unlocked:
${planFeatures.map(feature => `- ${feature.title}: ${feature.description}`).join('\n')}

🎯 What's Next?
Now that you have ${planType} access, here's how to make the most of your subscription:

- Explore Advanced Analytics: Access detailed market insights and AI-powered analysis
- Set Up Alerts: Configure custom alerts for your favorite cryptocurrencies
- Use the API: Integrate our data into your own applications
- Export Data: Download historical data for your analysis

Access Your Dashboard: ${frontendUrl}/app/dashboard

If you have any questions about your new ${planType} features or need help getting started, don't hesitate to reach out to our support team.

Thank you for choosing Crypto Market Watch!

Crypto Market Watch Team
This is an automated message. Please do not reply to this email.

Website: ${websiteUrl}
Account Settings: ${frontendUrl}/app/settings
Support: ${frontendUrl}/app/support
    `.trim();
  }

  getPlanFeatures(planType) {
    const features = {
      'Pro': [
        { title: 'Advanced Analytics', description: 'AI-powered market analysis with confidence scores' },
        { title: 'Unlimited Data Collection', description: 'Access to all crypto assets and historical data' },
        { title: 'Custom Alerts', description: 'Email, push, and Telegram notifications' },
        { title: 'API Access', description: '1,000 API calls per day for integrations' },
        { title: 'Data Export', description: 'Download historical data in multiple formats' },
        { title: 'Exchange Flows', description: 'Monitor exchange inflows and outflows' }
      ],
      'Premium': [
        { title: 'All Pro Features', description: 'Everything in Pro plan plus more' },
        { title: 'Extended History', description: '1-year historical data access' },
        { title: 'Custom Models', description: 'Train your own AI models' },
        { title: 'Priority Support', description: 'Dedicated support channel' },
        { title: 'White-label Options', description: 'Custom branding and integrations' },
        { title: 'Advanced API', description: '10,000 API calls per day' }
      ]
    };
    
    return features[planType] || features['Pro'];
  }

  getPlanPrice(planType) {
    const prices = {
      'Pro': '29.99',
      'Premium': '99.00'
    };
    
    return prices[planType] || '29.99';
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
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      testEmail.to = [{
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz',
        name: 'Test'
      }];

      await this.apiInstance.sendTransacEmail(testEmail);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  async sendRenewalReminderEmail(userEmail, planType, daysUntilExpiry) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping email send');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `⚠️ Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
      sendSmtpEmail.htmlContent = this.generateRenewalReminderEmailHTML(planType, daysUntilExpiry);
      sendSmtpEmail.textContent = this.generateRenewalReminderEmailText(planType, daysUntilExpiry);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Renewal reminder email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending renewal reminder email to ${userEmail}:`, error);
      return false;
    }
  }

  async sendSubscriptionExpiredEmail(userEmail, planType) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping email send');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `❌ Your ${planType} subscription has expired`;
      sendSmtpEmail.htmlContent = this.generateSubscriptionExpiredEmailHTML(planType);
      sendSmtpEmail.textContent = this.generateSubscriptionExpiredEmailText(planType);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Subscription expired email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending subscription expired email to ${userEmail}:`, error);
      return false;
    }
  }

  generateRenewalReminderEmailHTML(planType, daysUntilExpiry) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Renewal Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <h2>Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</h2>
            <p>Don't lose access to your premium features! Renew now to continue enjoying:</p>
            <ul>
              <li>Advanced market alerts</li>
              <li>Unlimited API access</li>
              <li>AI-powered analysis</li>
              <li>Data export capabilities</li>
            </ul>
            <p><strong>Special Offer:</strong> Save up to 20% when you prepay for multiple months!</p>
            <a href="${process.env.FRONTEND_URL}/app/subscription" class="button">Renew Now</a>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Crypto Market Watch - Your trusted crypto market intelligence platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateRenewalReminderEmailText(planType, daysUntilExpiry) {
    return `
Subscription Renewal Reminder

Your ${planType} subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.

Don't lose access to your premium features! Renew now to continue enjoying:
- Advanced market alerts
- Unlimited API access
- AI-powered analysis
- Data export capabilities

Special Offer: Save up to 20% when you prepay for multiple months!

Renew now: ${process.env.FRONTEND_URL}/app/subscription

If you have any questions, please contact our support team.

Crypto Market Watch - Your trusted crypto market intelligence platform
    `;
  }

  generateSubscriptionExpiredEmailHTML(planType) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Expired</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8fafc; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Subscription Expired</h1>
          </div>
          <div class="content">
            <h2>Your ${planType} subscription has expired</h2>
            <p>Your premium features are no longer available. You can still access basic features with our free plan.</p>
            <p>To restore your premium access, please renew your subscription:</p>
            <ul>
              <li>Advanced market alerts</li>
              <li>Unlimited API access</li>
              <li>AI-powered analysis</li>
              <li>Data export capabilities</li>
            </ul>
            <p><strong>Special Offer:</strong> Save up to 20% when you prepay for multiple months!</p>
            <a href="${process.env.FRONTEND_URL}/app/subscription" class="button">Renew Now</a>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Crypto Market Watch - Your trusted crypto market intelligence platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateSubscriptionExpiredEmailText(planType) {
    return `
Subscription Expired

Your ${planType} subscription has expired.

Your premium features are no longer available. You can still access basic features with our free plan.

To restore your premium access, please renew your subscription:
- Advanced market alerts
- Unlimited API access
- AI-powered analysis
- Data export capabilities

Special Offer: Save up to 20% when you prepay for multiple months!

Renew now: ${process.env.FRONTEND_URL}/app/subscription

If you have any questions, please contact our support team.

Crypto Market Watch - Your trusted crypto market intelligence platform
    `;
  }

  // Generate inflation data update email HTML
  generateInflationDataEmailHTML(data, userEmail) {
    const inflationData = data.latestData;
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Inflation Data Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .inflation-card { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 15px 0; border-radius: 4px; }
          .metric { display: flex; justify-content: space-between; margin: 10px 0; }
          .metric-label { font-weight: bold; color: #495057; }
          .metric-value { color: #007bff; font-weight: bold; }
          .change-positive { color: #28a745; }
          .change-negative { color: #dc3545; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 New Inflation Data Available</h1>
            <p>Updated economic indicators for ${currentDate}</p>
          </div>
          <div class="content">
            <h2>Latest Inflation Data</h2>
            <p>New inflation data has been collected and is now available in your dashboard.</p>
            
            ${inflationData ? `
              <div class="inflation-card">
                <h3>Consumer Price Index (CPI)</h3>
                <div class="metric">
                  <span class="metric-label">Headline CPI:</span>
                  <span class="metric-value">${inflationData.cpi?.cpi || 'N/A'}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Core CPI:</span>
                  <span class="metric-value">${inflationData.cpi?.coreCPI || 'N/A'}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Year-over-Year:</span>
                  <span class="metric-value ${(inflationData.cpi?.cpiYoY || 0) >= 0 ? 'change-positive' : 'change-negative'}">
                    ${inflationData.cpi?.cpiYoY || 'N/A'}%
                  </span>
                </div>
              </div>
              
              <div class="inflation-card">
                <h3>Personal Consumption Expenditures (PCE)</h3>
                <div class="metric">
                  <span class="metric-label">Headline PCE:</span>
                  <span class="metric-value">${inflationData.pce?.pce || 'N/A'}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Core PCE:</span>
                  <span class="metric-value">${inflationData.pce?.corePCE || 'N/A'}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Year-over-Year:</span>
                  <span class="metric-value ${(inflationData.pce?.pceYoY || 0) >= 0 ? 'change-positive' : 'change-negative'}">
                    ${inflationData.pce?.pceYoY || 'N/A'}%
                  </span>
                </div>
              </div>
            ` : '<p>Data is being processed and will be available shortly.</p>'}
            
            <a href="${process.env.FRONTEND_URL}/app" class="button">View Full Dashboard</a>
            
            <p>This data helps inform our AI analysis and market predictions. Stay tuned for updated insights!</p>
          </div>
          <div class="footer">
            <p>Crypto Market Watch - Your trusted crypto market intelligence platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate inflation data update email text
  generateInflationDataEmailText(data, userEmail) {
    const inflationData = data.latestData;
    const currentDate = new Date().toLocaleDateString();
    
    return `
New Inflation Data Available - ${currentDate}

New inflation data has been collected and is now available in your dashboard.

${inflationData ? `
LATEST INFLATION DATA:

Consumer Price Index (CPI):
- Headline CPI: ${inflationData.cpi?.cpi || 'N/A'}
- Core CPI: ${inflationData.cpi?.coreCPI || 'N/A'}
- Year-over-Year: ${inflationData.cpi?.cpiYoY || 'N/A'}%

Personal Consumption Expenditures (PCE):
- Headline PCE: ${inflationData.pce?.pce || 'N/A'}
- Core PCE: ${inflationData.pce?.corePCE || 'N/A'}
- Year-over-Year: ${inflationData.pce?.pceYoY || 'N/A'}%
` : 'Data is being processed and will be available shortly.'}

View full dashboard: ${process.env.FRONTEND_URL}/app

This data helps inform our AI analysis and market predictions. Stay tuned for updated insights!

Crypto Market Watch - Your trusted crypto market intelligence platform
    `;
  }

  // Generate event reminder email HTML
  generateEventReminderEmailHTML(data, userEmail) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upcoming Economic Events</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .event-card { background: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 15px 0; border-radius: 4px; }
          .event-title { font-weight: bold; color: #495057; margin-bottom: 10px; }
          .event-details { color: #6c757d; font-size: 14px; }
          .impact-high { border-left-color: #dc3545; }
          .impact-medium { border-left-color: #ffc107; }
          .impact-low { border-left-color: #28a745; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Upcoming Economic Events</h1>
            <p>${data.events.length} event${data.events.length > 1 ? 's' : ''} approaching</p>
          </div>
          <div class="content">
            <h2>Events to Watch</h2>
            <p>Here are the upcoming economic events that may impact the markets:</p>
            
            ${data.events.map(event => `
              <div class="event-card impact-${event.impact || 'low'}">
                <div class="event-title">${event.title}</div>
                <div class="event-details">
                  <strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}<br>
                  <strong>Impact:</strong> ${(event.impact || 'Low').toUpperCase()}<br>
                  ${event.description ? `<strong>Description:</strong> ${event.description}<br>` : ''}
                  ${event.time ? `<strong>Time:</strong> ${event.time}<br>` : ''}
                </div>
              </div>
            `).join('')}
            
            <a href="${process.env.FRONTEND_URL}/app/events" class="button">View All Events</a>
            
            <p>These events can significantly impact market volatility. Stay informed and adjust your strategies accordingly.</p>
          </div>
          <div class="footer">
            <p>Crypto Market Watch - Your trusted crypto market intelligence platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate event reminder email text
  generateEventReminderEmailText(data, userEmail) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
Upcoming Economic Events - ${currentDate}

Here are the upcoming economic events that may impact the markets:

${data.events.map(event => `
${event.title}
Date: ${new Date(event.date).toLocaleDateString()}
Impact: ${(event.impact || 'Low').toUpperCase()}
${event.description ? `Description: ${event.description}` : ''}
${event.time ? `Time: ${event.time}` : ''}
`).join('\n')}

View all events: ${process.env.FRONTEND_URL}/app/events

These events can significantly impact market volatility. Stay informed and adjust your strategies accordingly.

Crypto Market Watch - Your trusted crypto market intelligence platform
    `;
  }

  // Send bulk alert emails to multiple users
  async sendBulkAlertEmails(users, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping bulk email send');
      return false;
    }

    try {
      const results = [];
      
      for (const user of users) {
        try {
          const result = await this.sendAlertEmail(user.email, alert, user);
          results.push({ user: user.email, success: result });
        } catch (error) {
          console.error(`❌ Failed to send alert email to ${user.email}:`, error);
          results.push({ user: user.email, success: false, error: error.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`📧 Bulk alert emails sent: ${successCount}/${users.length} successful`);
      
      return results;
    } catch (error) {
      console.error('❌ Error sending bulk alert emails:', error);
      return false;
    }
  }

  // Send event reminder email
  async sendEventReminderEmail(userEmail, event, daysUntilEvent) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping event reminder email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `📅 Upcoming Event: ${event.title}`;
      sendSmtpEmail.htmlContent = this.generateEventReminderEmailHTML({ events: [event] }, userEmail);
      sendSmtpEmail.textContent = this.generateEventReminderEmailText({ events: [event] }, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`📧 Event reminder email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending event reminder email to ${userEmail}:`, error);
      return false;
    }
  }

  // Generate event reminder email HTML (overloaded method for single event)
  generateEventReminderEmailHTML(event, userEmail, daysUntilEvent) {
    // If first parameter is an event object, wrap it in data structure
    if (event.title && event.description) {
      return this.generateEventReminderEmailHTML({ events: [event], daysUntilEvent }, userEmail);
    }
    
    // Otherwise, treat as data object with events array
    const data = event;
    const currentDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Economic Events - Crypto Market Watch</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    table { border-collapse: collapse; }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 0 20px;
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
      background-color: #3b82f6;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      background-color: #1e293b;
      padding: 30px 20px;
      color: #ffffff;
    }
    .event-item {
      background-color: #334155;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid #3b82f6;
    }
    .event-item h3 {
      margin: 0 0 10px 0;
      color: #3b82f6;
    }
    .event-details {
      color: #cbd5e1;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      background-color: #0f172a;
      color: #94a3b8;
      font-size: 14px;
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
              <div class="brand-logo">₿ Crypto Market Watch</div>
              <p class="brand-name">Real-time market intelligence & alerts</p>
            </td>
          </tr>
              <tr>
                <td class="header">
                  <h1>📅 Upcoming Economic Events</h1>
                  <p>${data.events ? data.events.length : 1} event${(data.events ? data.events.length : 1) > 1 ? 's' : ''} approaching</p>
                  ${data.daysUntilEvent ? `<p>Event in ${data.daysUntilEvent} day${data.daysUntilEvent > 1 ? 's' : ''}</p>` : ''}
                </td>
              </tr>
          <tr>
            <td class="content">
              <h2>Events to Watch</h2>
              ${(data.events || [data]).map(event => `
                <div class="event-item">
                  <h3>${event.title}</h3>
                  <div class="event-details">
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Impact:</strong> ${(event.impact || 'Low').toUpperCase()}</p>
                    ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
                    ${event.time ? `<p><strong>Time:</strong> ${event.time}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p><strong>Crypto Market Watch</strong></p>
              <p>Advanced cryptocurrency analytics with AI-powered insights</p>
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

  // Send inflation update email
  async sendInflationUpdateEmail(userEmail, inflationData) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping inflation update email');
      return false;
    }

    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `📊 Inflation Data Update - ${new Date().toLocaleDateString()}`;
      sendSmtpEmail.htmlContent = this.generateInflationUpdateEmailHTML(inflationData, userEmail);
      sendSmtpEmail.textContent = this.generateInflationUpdateEmailText(inflationData, userEmail);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      sendSmtpEmail.to = [{
        email: userEmail,
        name: userEmail.split('@')[0]
      }];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`📧 Inflation update email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending inflation update email to ${userEmail}:`, error);
      return false;
    }
  }

  // Generate inflation update email HTML
  generateInflationUpdateEmailHTML(data, userEmail) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inflation Data Update - Crypto Market Watch</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #ffffff;
      background-color: #0f172a;
      margin: 0;
      padding: 20px;
    }
    table { border-collapse: collapse; }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #1e293b;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 0 20px;
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
      background-color: #3b82f6;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: bold;
    }
    .content {
      background-color: #1e293b;
      padding: 30px 20px;
      color: #ffffff;
    }
    .data-item {
      background-color: #334155;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid #3b82f6;
    }
    .data-item h3 {
      margin: 0 0 10px 0;
      color: #3b82f6;
    }
    .data-value {
      font-size: 18px;
      font-weight: bold;
      color: #f8fafc;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      background-color: #0f172a;
      color: #94a3b8;
      font-size: 14px;
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
              <div class="brand-logo">₿ Crypto Market Watch</div>
              <p class="brand-name">Real-time market intelligence & alerts</p>
            </td>
          </tr>
          <tr>
            <td class="header">
              <h1>📊 Inflation Data Update</h1>
              <p>Latest economic indicators - ${currentDate}</p>
            </td>
          </tr>
          <tr>
            <td class="content">
              <div class="data-item">
                <h3>Consumer Price Index (CPI)</h3>
                <div class="data-value">${data.cpi?.value || 'N/A'}%</div>
                <p>Month-over-month change: ${data.cpi?.momChange || 'N/A'}%</p>
              </div>
              <div class="data-item">
                <h3>Personal Consumption Expenditures (PCE)</h3>
                <div class="data-value">${data.pce?.value || 'N/A'}%</div>
                <p>Month-over-month change: ${data.pce?.momChange || 'N/A'}%</p>
              </div>
              <div class="data-item">
                <h3>Producer Price Index (PPI)</h3>
                <div class="data-value">${data.ppi?.value || 'N/A'}%</div>
                <p>Month-over-month change: ${data.ppi?.momChange || 'N/A'}%</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p><strong>Crypto Market Watch</strong></p>
              <p>Advanced cryptocurrency analytics with AI-powered insights</p>
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

  // Generate inflation update email text
  generateInflationUpdateEmailText(data, userEmail) {
    const currentDate = new Date().toLocaleDateString();
    
    return `
Inflation Data Update - ${currentDate}

Latest Economic Indicators:

Consumer Price Index (CPI): ${data.cpi?.value || 'N/A'}%
Month-over-month change: ${data.cpi?.momChange || 'N/A'}%

Personal Consumption Expenditures (PCE): ${data.pce?.value || 'N/A'}%
Month-over-month change: ${data.pce?.momChange || 'N/A'}%

Producer Price Index (PPI): ${data.ppi?.value || 'N/A'}%
Month-over-month change: ${data.ppi?.momChange || 'N/A'}%

View detailed analysis: ${process.env.FRONTEND_URL}/dashboard

Crypto Market Watch - Your trusted crypto market intelligence platform
    `;
  }

  // Send contact form email notification
  async sendContactFormEmail(contactData) {
    if (!this.isConfigured) {
      console.log('⚠️ Brevo email service not configured, skipping contact form email');
      return false;
    }

    try {
      const { name, email, subject, message, screenshot } = contactData;
      
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = `Contact Form: ${subject}`;
      sendSmtpEmail.htmlContent = this.generateContactFormEmailHTML(contactData);
      sendSmtpEmail.textContent = this.generateContactFormEmailText(contactData);
      sendSmtpEmail.sender = {
        name: 'Crypto Market Watch Contact Form',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@crypto-market-watch.xyz'
      };
      
      // Send to admin email (you can configure this)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@crypto-market-watch.xyz';
      sendSmtpEmail.to = [{
        email: adminEmail,
        name: 'Admin'
      }];
      
      // Reply to the original sender
      sendSmtpEmail.replyTo = {
        email: email,
        name: name
      };

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Contact form email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending contact form email:', error);
      return false;
    }
  }

  // Generate contact form email HTML
  generateContactFormEmailHTML(contactData) {
    const { name, email, subject, message, screenshot } = contactData;
    const currentDate = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Form Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #374151; }
        .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #1e40af; }
        .message-content { white-space: pre-wrap; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 New Contact Form Submission</h1>
            <p>Received on ${currentDate}</p>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="label">From:</div>
                <div class="value">${name} &lt;${email}&gt;</div>
            </div>
            
            <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
            </div>
            
            <div class="field">
                <div class="label">Message:</div>
                <div class="value message-content">${message}</div>
            </div>
            
            ${screenshot ? `
            <div class="field">
                <div class="label">Screenshot:</div>
                <div class="value">
                    <strong>File:</strong> ${screenshot.filename}<br>
                    <strong>Size:</strong> ${(screenshot.size / 1024 / 1024).toFixed(2)} MB<br>
                    <strong>Type:</strong> ${screenshot.mimetype}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This email was sent from the Crypto Market Watch contact form.</p>
            <p>Reply directly to this email to respond to ${name}.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Generate contact form email text
  generateContactFormEmailText(contactData) {
    const { name, email, subject, message, screenshot } = contactData;
    const currentDate = new Date().toLocaleString();
    
    return `
New Contact Form Submission - ${currentDate}

From: ${name} <${email}>
Subject: ${subject}

Message:
${message}

${screenshot ? `
Screenshot:
- File: ${screenshot.filename}
- Size: ${(screenshot.size / 1024 / 1024).toFixed(2)} MB
- Type: ${screenshot.mimetype}
` : ''}

---
This email was sent from the Crypto Market Watch contact form.
Reply directly to this email to respond to ${name}.
    `;
  }
}

module.exports = BrevoEmailService;
