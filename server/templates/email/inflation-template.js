/**
 * Inflation Data Email Template
 * 
 * Table-based email template for inflation data updates
 */

const BaseEmailTemplate = require('./base-template');

class InflationEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate inflation data email HTML
   */
  generateHTML(data, userEmail = null) {
    const inflationData = data.latestData;
    const currentDate = new Date().toLocaleDateString();
    const title = `Inflation Data Update - ${currentDate}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        📊 Inflation Data Update
      </h1>
      <p style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        Latest economic indicators for ${currentDate}
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>Here are the latest inflation and economic indicators that may impact cryptocurrency markets:</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #3b82f6; font-weight: 600;">Key economic data updated</p>
          </td>
        </tr>
      </table>
      
      ${inflationData ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Latest Inflation Data:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 8px;">
            <strong style="color: #3b82f6; font-size: 16px; display: block; margin-bottom: 8px;">Consumer Price Index (CPI)</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${inflationData.cpi ? `${inflationData.cpi}%` : 'Data not available'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 8px;">
            <strong style="color: #3b82f6; font-size: 16px; display: block; margin-bottom: 8px;">Core CPI</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${inflationData.core_cpi ? `${inflationData.core_cpi}%` : 'Data not available'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 8px;">
            <strong style="color: #3b82f6; font-size: 16px; display: block; margin-bottom: 8px;">Personal Consumption Expenditures (PCE)</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${inflationData.pce ? `${inflationData.pce}%` : 'Data not available'}</span>
          </td>
        </tr>
      </table>
      
      ${inflationData.ppi ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 8px;">
            <strong style="color: #3b82f6; font-size: 16px; display: block; margin-bottom: 8px;">Producer Price Index (PPI)</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${inflationData.ppi}%</span>
          </td>
        </tr>
      </table>
      ` : ''}
      ` : ''}
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Market Impact Analysis:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Inflation Trends</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Rising inflation typically increases demand for inflation hedges like Bitcoin</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Federal Reserve Policy</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Interest rate decisions based on inflation data can significantly impact crypto markets</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Market Sentiment</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Economic uncertainty often drives investors toward alternative assets</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="cta-button" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;">View Full Analysis</a>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>This data helps inform our AI analysis and market predictions. Stay tuned for updated insights!</p>
            <p>For more detailed analysis and real-time updates, visit your dashboard.</p>
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
   * Generate inflation data email text version
   */
  generateText(data, userEmail = null) {
    const inflationData = data.latestData;
    const currentDate = new Date().toLocaleDateString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const unsubscribeUrl = userEmail ? this.generateUnsubscribeUrl(userEmail) : null;
    
    return `
Inflation Data Update - ${currentDate}

Here are the latest inflation and economic indicators that may impact cryptocurrency markets:

${inflationData ? `
Latest Inflation Data:
- Consumer Price Index (CPI): ${inflationData.cpi ? `${inflationData.cpi}%` : 'Data not available'}
- Core CPI: ${inflationData.core_cpi ? `${inflationData.core_cpi}%` : 'Data not available'}
- Personal Consumption Expenditures (PCE): ${inflationData.pce ? `${inflationData.pce}%` : 'Data not available'}
${inflationData.ppi ? `- Producer Price Index (PPI): ${inflationData.ppi}%` : ''}
` : ''}

Market Impact Analysis:
- Inflation Trends: Rising inflation typically increases demand for inflation hedges like Bitcoin
- Federal Reserve Policy: Interest rate decisions based on inflation data can significantly impact crypto markets
- Market Sentiment: Economic uncertainty often drives investors toward alternative assets

This data helps inform our AI analysis and market predictions. Stay tuned for updated insights!

For more detailed analysis and real-time updates, visit your dashboard: ${frontendUrl}/dashboard

Visit our website: ${websiteUrl}

Crypto Market Watch
${unsubscribeUrl ? `\nTo unsubscribe from these emails, visit: ${unsubscribeUrl}` : ''}
    `.trim();
  }
}

module.exports = InflationEmailTemplate;
