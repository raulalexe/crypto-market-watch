/**
 * Base Email Template
 * 
 * This is the foundation for all email templates using a table-based layout
 * that works across all email clients including Yahoo, Gmail, Outlook, etc.
 */

class BaseEmailTemplate {
  constructor() {
    this.baseStyles = `
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
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 { 
        margin: 0;
        font-size: 24px;
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
      .content p {
        font-size: 16px;
        margin-bottom: 20px;
        color: #cbd5e1;
      }
      .cta-button { 
        display: inline-block; 
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        padding: 15px 30px; 
        text-decoration: none; 
        border-radius: 8px; 
        margin: 25px 0;
        font-weight: bold;
        font-size: 16px;
        text-align: center;
        border: none;
        cursor: pointer;
      }
      .cta-button:hover {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        color: white;
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
    `;
  }

  /**
   * Generate the base HTML structure for emails
   */
  generateBaseHTML(title, headerContent, bodyContent, footerContent, customStyles = '') {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          ${this.baseStyles}
          ${customStyles}
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
                    ${headerContent}
                  </td>
                </tr>
                <tr>
                  <td class="content">
                    ${bodyContent}
                  </td>
                </tr>
                <tr>
                  <td class="footer">
                    ${footerContent}
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

  /**
   * Generate standard footer content
   */
  generateFooter(unsubscribeUrl = null) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <p><strong>Crypto Market Watch</strong></p>
      <p>Advanced cryptocurrency analytics with AI-powered insights</p>
      <div class="footer-links">
        <a href="${frontendUrl}/dashboard">Dashboard</a>
        <a href="${frontendUrl}/about">About</a>
        ${unsubscribeUrl ? `<a href="${unsubscribeUrl}">Unsubscribe</a>` : ''}
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #cbd5e1;">
        You can manage your notification preferences in your account settings.
      </p>
    `;
  }

  /**
   * Generate unsubscribe URL
   */
  generateUnsubscribeUrl(userEmail) {
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    return `${websiteUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;
  }
}

module.exports = BaseEmailTemplate;
