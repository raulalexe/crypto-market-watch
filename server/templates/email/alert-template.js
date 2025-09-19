/**
 * Alert Email Template
 * 
 * Table-based email template for market alert notifications
 */

const BaseEmailTemplate = require('./base-template');

class AlertEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate alert email HTML
   */
  generateHTML(alert, userEmail = null) {
    const severityColor = this.getSeverityColor(alert.severity);
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    const alertType = alert.type.replace(/_/g, ' ');
    
    let timestamp;
    try {
      timestamp = new Date(alert.timestamp).toLocaleString();
    } catch (error) {
      timestamp = 'Time unavailable';
    }
    
    const title = `Market Alert: ${alertType}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: ${severityColor}; color: white; padding: 30px 20px; text-align: center; margin: 0;">
        ${severityEmoji} Alert: ${alertType}
      </h1>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size: 18px; margin: 20px 0; padding: 20px; background-color: #334155; border-radius: 8px; border-left: 4px solid ${severityColor};">
              ${alert.message}
            </div>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="background: #334155; padding: 20px; border-radius: 8px; margin: 20px 0; color: #f8fafc;">
              <p style="margin: 8px 0; color: #cbd5e1;"><strong style="color: #3b82f6;">Alert Type:</strong> ${alertType}</p>
              <p style="margin: 8px 0; color: #cbd5e1;"><strong style="color: #3b82f6;">Severity:</strong> ${alert.severity}</p>
              <p style="margin: 8px 0; color: #cbd5e1;"><strong style="color: #3b82f6;">Timestamp:</strong> ${timestamp}</p>
              ${alert.metric ? `<p style="margin: 8px 0; color: #cbd5e1;"><strong style="color: #3b82f6;">Metric:</strong> ${alert.metric}</p>` : ''}
              ${alert.value ? `<p style="margin: 8px 0; color: #cbd5e1;"><strong style="color: #3b82f6;">Value:</strong> ${alert.value}</p>` : ''}
            </div>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="background: #1e293b; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 15px 0; color: #cbd5e1;">
              <p style="margin: 0;"><strong>Disclaimer:</strong> This alert is for informational purposes only and should not be considered as financial advice. Always do your own research before making investment decisions.</p>
            </div>
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
   * Generate alert email text version
   */
  generateText(alert, userEmail = null) {
    const timestamp = new Date(alert.timestamp).toLocaleString();
    const alertType = alert.type.replace(/_/g, ' ');
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    
    return `
${severityEmoji} Market Alert: ${alertType}

${alert.message}

Alert Details:
- Type: ${alertType}
- Severity: ${alert.severity}
- Timestamp: ${timestamp}
${alert.metric ? `- Metric: ${alert.metric}` : ''}
${alert.value ? `- Value: ${alert.value}` : ''}

Disclaimer: This alert is for informational purposes only and should not be considered as financial advice. Always do your own research before making investment decisions.

Crypto Market Watch - Your trusted crypto market intelligence platform
    `.trim();
  }

  /**
   * Get severity emoji based on severity level
   */
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

  /**
   * Get severity color based on severity level
   */
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

module.exports = AlertEmailTemplate;
