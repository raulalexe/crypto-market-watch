/**
 * Event Reminder Email Template
 * 
 * Table-based email template for economic event reminders
 */

const BaseEmailTemplate = require('./base-template');

class EventEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate event reminder email HTML
   */
  generateHTML(data, userEmail = null) {
    const events = data.events || [];
    const currentDate = new Date().toLocaleDateString();
    const title = `Upcoming Economic Events - ${currentDate}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #28a745 0%, #16a34a 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        📅 Upcoming Economic Events
      </h1>
      <p style="background: linear-gradient(135deg, #28a745 0%, #16a34a 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Important events that may impact crypto markets
      </p>
    `;

    // Body content
    let eventsContent = '';
    
    if (events.length > 0) {
      eventsContent = `
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p>Here are the upcoming economic events that could impact cryptocurrency markets:</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #28a745; font-weight: 600;">${events.length} event${events.length !== 1 ? 's' : ''} scheduled</p>
            </td>
          </tr>
        </table>
      `;
      
      events.forEach(event => {
        const impactColor = this.getImpactColor(event.impact);
        const impactIcon = this.getImpactIcon(event.impact);
        
        eventsContent += `
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background: #334155; border-left: 4px solid ${impactColor}; padding: 20px; margin: 15px 0; border-radius: 8px;">
                <strong style="color: ${impactColor}; font-size: 16px; display: block; margin-bottom: 8px;">${impactIcon} ${event.title}</strong>
                <span style="color: #cbd5e1; font-size: 14px; display: block; margin-bottom: 8px;">${event.description || 'No description available'}</span>
                <span style="color: #94a3b8; font-size: 12px;">Date: ${event.date || 'TBD'} | Impact: ${event.impact || 'Unknown'}</span>
              </td>
            </tr>
          </table>
        `;
      });
    } else {
      eventsContent = `
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p>No major economic events are scheduled for the upcoming period.</p>
            </td>
          </tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: rgba(40, 167, 69, 0.1); border: 1px solid rgba(40, 167, 69, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #28a745; font-weight: 600;">Quiet period ahead</p>
            </td>
          </tr>
        </table>
      `;
    }
    
    const bodyContent = eventsContent + `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Why these events matter for crypto:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 8px;">
            <strong style="color: #28a745; font-size: 16px; display: block; margin-bottom: 8px;">Market Volatility</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Economic announcements often trigger significant price movements</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 8px;">
            <strong style="color: #28a745; font-size: 16px; display: block; margin-bottom: 8px;">Policy Impact</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Central bank decisions can influence crypto adoption and regulation</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 8px;">
            <strong style="color: #28a745; font-size: 16px; display: block; margin-bottom: 8px;">Investor Sentiment</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Economic data affects overall market confidence and risk appetite</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events" class="cta-button" style="background: linear-gradient(135deg, #28a745 0%, #16a34a 100%); color: white;">View All Events</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Stay informed about these events to make better trading decisions and understand market movements.</p>
            <p>Our AI analysis will incorporate these events into market predictions and alerts.</p>
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
   * Get impact color based on impact level
   */
  getImpactColor(impact) {
    switch (impact?.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  /**
   * Get impact icon based on impact level
   */
  getImpactIcon(impact) {
    switch (impact?.toLowerCase()) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Generate event reminder email text version
   */
  generateText(data, userEmail = null) {
    const events = data.events || [];
    const currentDate = new Date().toLocaleDateString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    let eventsText = '';
    
    if (events.length > 0) {
      eventsText = `Here are the upcoming economic events that could impact cryptocurrency markets:\n\n`;
      events.forEach(event => {
        eventsText += `• ${event.title}\n`;
        eventsText += `  ${event.description || 'No description available'}\n`;
        eventsText += `  Date: ${event.date || 'TBD'} | Impact: ${event.impact || 'Unknown'}\n\n`;
      });
    } else {
      eventsText = 'No major economic events are scheduled for the upcoming period.\n\n';
    }
    
    return `
Upcoming Economic Events - ${currentDate}

${eventsText}

Why these events matter for crypto:
- Market Volatility: Economic announcements often trigger significant price movements
- Policy Impact: Central bank decisions can influence crypto adoption and regulation
- Investor Sentiment: Economic data affects overall market confidence and risk appetite

Stay informed about these events to make better trading decisions and understand market movements.

Our AI analysis will incorporate these events into market predictions and alerts.

View all events: ${frontendUrl}/events

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }
}

module.exports = EventEmailTemplate;
