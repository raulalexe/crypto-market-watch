const nodemailer = require('nodemailer');
const axios = require('axios');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.emailProvider = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      // Check for Brevo configuration first
      if (process.env.BREVO_API_KEY) {
        this.emailProvider = 'brevo';
        this.isConfigured = true;
        console.log('✅ Email service configured with Brevo API');
        return;
      }

      // Check for traditional SMTP configuration
      const emailConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Only configure if we have the required SMTP settings
      if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransporter(emailConfig);
        this.emailProvider = 'smtp';
        this.isConfigured = true;
        console.log('✅ Email service configured with SMTP');
      } else {
        console.log('⚠️ Email service not configured - missing email settings');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('❌ Error configuring email service:', error);
      this.isConfigured = false;
    }
  }

  async sendAlertEmail(userEmail, alert, userPreferences = {}) {
    if (!this.isConfigured) {
      console.log('⚠️ Email service not configured, skipping email send');
      return false;
    }

    try {
      const severityEmoji = this.getSeverityEmoji(alert.severity);
      const alertType = alert.type.replace(/_/g, ' ');
      
      if (this.emailProvider === 'brevo') {
        return await this.sendEmailViaBrevo(userEmail, alert, severityEmoji, alertType);
      } else if (this.emailProvider === 'smtp') {
        return await this.sendEmailViaSMTP(userEmail, alert, severityEmoji, alertType);
      } else {
        console.log('⚠️ Unknown email provider, skipping email send');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending alert email:', error);
      return false;
    }
  }

  async sendEmailViaBrevo(userEmail, alert, severityEmoji, alertType) {
    try {
      const emailData = {
        sender: {
          name: 'Crypto Market Watch',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@cryptomarketmonitor.com'
        },
        to: [
          {
            email: userEmail,
            name: userEmail.split('@')[0] // Use part before @ as name
          }
        ],
        subject: `${severityEmoji} Market Alert: ${alertType}`,
        htmlContent: this.generateAlertEmailHTML(alert),
        textContent: this.generateAlertEmailText(alert)
      };

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        emailData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          timeout: 30000
        }
      );

      if (response.status === 201 || response.status === 200) {
        console.log(`✅ Brevo email sent to ${userEmail}: ${response.data.messageId || 'success'}`);
        return true;
      } else {
        console.error('❌ Brevo API error:', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending Brevo email:', error.message);
      return false;
    }
  }

  async sendEmailViaSMTP(userEmail, alert, severityEmoji, alertType) {
    try {
      const emailContent = {
        from: `"Crypto Market Watch" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `${severityEmoji} Market Alert: ${alertType}`,
        html: this.generateAlertEmailHTML(alert),
        text: this.generateAlertEmailText(alert)
      };

      const result = await this.transporter.sendMail(emailContent);
      console.log(`✅ SMTP email sent to ${userEmail}: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending SMTP email:', error);
      return false;
    }
  }

  async sendBulkAlertEmails(users, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Email service not configured, skipping bulk email send');
      return { sent: 0, failed: 0 };
    }

    const results = { sent: 0, failed: 0 };

    // Add rate limiting for Brevo API (max 10 requests per second)
    const rateLimitDelay = this.emailProvider === 'brevo' ? 100 : 0;

    for (const user of users) {
      if (user.emailNotifications && user.email) {
        const success = await this.sendAlertEmail(user.email, alert, user);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
        }
        
        // Rate limiting delay for Brevo
        if (rateLimitDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        }
      }
    }

    console.log(`📧 Bulk email results: ${results.sent} sent, ${results.failed} failed (${this.emailProvider})`);
    return results;
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

  generateAlertEmailHTML(alert) {
    const severityColor = this.getSeverityColor(alert.severity);
    const timestamp = new Date(alert.timestamp).toLocaleString();
    
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
            
            <div class="disclaimer">
              <strong>Disclaimer:</strong> This is not financial advice. Always do your own research before making investment decisions.
            </div>
          </div>
          
          <div class="footer">
            <p>Crypto Market Watch</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateAlertEmailText(alert) {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    
    return `
MARKET ALERT

${alert.type.replace(/_/g, ' ')}
Severity: ${alert.severity.toUpperCase()}

${alert.message}

Details:
- Metric: ${alert.metric}
${alert.value ? `- Value: ${alert.value}` : ''}
- Time: ${timestamp}

---
Disclaimer: This is not financial advice. Always do your own research before making investment decisions.

Crypto Market Watch
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

  // Compatibility method for other services
  async sendEmailNotification(type, alert, userEmail = null) {
    if (!userEmail) {
      console.log('⚠️ No user email provided for email notification');
      return false;
    }
    
    return await this.sendAlertEmail(userEmail, alert);
  }

  async sendUpgradeEmail(userEmail, userName = null, planType = 'Pro', subscriptionDetails = {}) {
    if (!this.isConfigured) {
      console.log('⚠️ Email service not configured, skipping upgrade email');
      return false;
    }

    try {
      if (this.emailProvider === 'brevo') {
        // Use BrevoEmailService for upgrade emails
        const BrevoEmailService = require('./brevoEmailService');
        const brevoService = new BrevoEmailService();
        return await brevoService.sendUpgradeEmail(userEmail, userName, planType, subscriptionDetails);
      } else {
        console.log('⚠️ Upgrade emails are only supported with Brevo provider');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending upgrade email:', error);
      return false;
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      if (this.emailProvider === 'brevo') {
        // Test Brevo API connection by making a simple request
        const response = await axios.get('https://api.brevo.com/v3/account', {
          headers: {
            'Accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          timeout: 10000
        });
        
        if (response.status === 200) {
          return { success: true, provider: 'Brevo API' };
        } else {
          return { success: false, error: `Brevo API returned status ${response.status}` };
        }
      } else if (this.emailProvider === 'smtp') {
        // Test SMTP connection
        await this.transporter.verify();
        return { success: true, provider: 'SMTP' };
      } else {
        return { success: false, error: 'Unknown email provider' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
