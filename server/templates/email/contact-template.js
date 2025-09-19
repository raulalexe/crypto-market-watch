/**
 * Contact Form Email Template
 * 
 * Table-based email template for contact form submissions
 */

const BaseEmailTemplate = require('./base-template');

class ContactEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate contact form email HTML
   */
  generateHTML(contactData) {
    const { name, email, subject, message, screenshot } = contactData;
    const currentDate = new Date().toLocaleString();
    const title = `Contact Form: ${subject}`;
    
    // Header content
    const headerContent = `
      <h1 style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px 20px; text-align: center; margin: 0;">
        📧 Contact Form Submission
      </h1>
      <p style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 0 20px 30px; text-align: center; margin: 0; opacity: 0.9;">
        New message received from ${name}
      </p>
    `;

    // Body content
    const bodyContent = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>A new contact form submission has been received:</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6366f1; font-weight: 600;">Contact form submission received</p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Contact Details:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Name</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${name || 'Not provided'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Email</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${email || 'Not provided'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Subject</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${subject || 'No subject'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Message</strong>
            <span style="color: #cbd5e1; font-size: 14px; white-space: pre-wrap;">${message || 'No message provided'}</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Submitted</strong>
            <span style="color: #cbd5e1; font-size: 14px;">${currentDate}</span>
          </td>
        </tr>
      </table>
      
      ${screenshot ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Screenshot Attached:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #6366f1; border-radius: 8px;">
            <strong style="color: #6366f1; font-size: 16px; display: block; margin-bottom: 8px;">Screenshot</strong>
            <span style="color: #cbd5e1; font-size: 14px;">A screenshot has been attached to this submission</span>
          </td>
        </tr>
      </table>
      ` : ''}
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p><strong>Next Steps:</strong></p>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Review Message</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Read through the user's message and understand their inquiry</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Respond Promptly</strong>
            <span style="color: #cbd5e1; font-size: 14px;">Reply to the user's email address within 24 hours</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #334155; padding: 20px; margin: 15px 0; border-left: 4px solid #00ff88; border-radius: 8px;">
            <strong style="color: #00ff88; font-size: 16px; display: block; margin-bottom: 8px;">Follow Up</strong>
            <span style="color: #cbd5e1; font-size: 14px;">If needed, escalate to the appropriate team member</span>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p>This contact form submission requires your attention. Please respond to the user as soon as possible.</p>
          </td>
        </tr>
      </table>
    `;

    // Footer content
    const footerContent = this.generateFooter();

    return this.generateBaseHTML(title, headerContent, bodyContent, footerContent);
  }

  /**
   * Generate contact form email text version
   */
  generateText(contactData) {
    const { name, email, subject, message, screenshot } = contactData;
    const currentDate = new Date().toLocaleString();
    const websiteUrl = process.env.BASE_URL || 'http://localhost:3001';
    
    return `
Contact Form: ${subject}

A new contact form submission has been received:

Contact Details:
- Name: ${name || 'Not provided'}
- Email: ${email || 'Not provided'}
- Subject: ${subject || 'No subject'}
- Message: ${message || 'No message provided'}
- Submitted: ${currentDate}
${screenshot ? '- Screenshot: Attached' : ''}

Next Steps:
- Review Message: Read through the user's message and understand their inquiry
- Respond Promptly: Reply to the user's email address within 24 hours
- Follow Up: If needed, escalate to the appropriate team member

This contact form submission requires your attention. Please respond to the user as soon as possible.

Visit our website: ${websiteUrl}

Crypto Market Watch
    `.trim();
  }
}

module.exports = ContactEmailTemplate;
