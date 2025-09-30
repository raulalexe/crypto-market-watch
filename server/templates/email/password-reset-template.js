/**
 * Password Reset Email Template
 * 
 * Uses the base template with Yahoo fix for consistent styling
 */

const BaseEmailTemplate = require('./base-template');

class PasswordResetEmailTemplate extends BaseEmailTemplate {
  constructor() {
    super();
  }

  /**
   * Generate password reset email HTML
   */
  generateHTML(resetUrl, userEmail = null) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Custom styles for password reset
    const customStyles = `
      .header { 
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
        color: white; 
      }
      .cta-button { 
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      }
      .cta-button:hover {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
      }
      .disclaimer { 
        background: #334155; 
        border: 1px solid #dc2626; 
        padding: 15px; 
        border-radius: 8px; 
        margin: 15px 0;
        color: #cbd5e1;
      }
    `;

    // Header content
    const headerContent = `
      <h1>🔐 Reset Your Password</h1>
      <p>Secure your account with a new password</p>
    `;

    // Body content
    const bodyContent = `
      <p>We received a request to reset your password for your Crypto Market Watch account.</p>
      
      <p>Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta-button">Reset Password</a>
      </div>
      
      <div class="disclaimer">
        <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
        <p style="margin: 8px 0 0; font-size: 14px; word-break: break-all;">
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
        </p>
      </div>
      
      <p><strong>Security Information:</strong></p>
      <ul style="color: #cbd5e1; margin: 15px 0;">
        <li>This link will expire in 1 hour for security</li>
        <li>If you didn't request this reset, you can safely ignore this email</li>
        <li>Your account remains secure until you complete the reset</li>
      </ul>
      
      <p>If you have any questions, please contact our support team.</p>
    `;

    // Footer content
    const footerContent = this.generateFooter();

    return this.generateBaseHTML(
      'Reset Your Password - Crypto Market Watch',
      headerContent,
      bodyContent,
      footerContent,
      customStyles
    );
  }

  /**
   * Generate plain text version
   */
  generateText(resetUrl, userEmail = null) {
    return `
Reset Your Password - Crypto Market Watch

We received a request to reset your password for your Crypto Market Watch account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for security.

If you didn't request this reset, you can safely ignore this email.

If you have any questions, please contact our support team.

Best regards,
Crypto Market Watch Team
    `.trim();
  }
}

module.exports = PasswordResetEmailTemplate;
