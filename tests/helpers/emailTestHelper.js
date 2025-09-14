/**
 * Email Testing Helper
 * Provides utilities for testing email functionality in Node.js environment
 */

class EmailTestHelper {
  constructor() {
    this.sentEmails = [];
    this.emailTemplates = new Map();
    this.mockBrevoService = null;
    this.mockEmailService = null;
  }

  /**
   * Setup email mocks for testing
   */
  setupEmailMocks() {
    // Mock Brevo service
    this.mockBrevoService = {
      sendAlertEmail: jest.fn().mockImplementation(async (alert, userEmail) => {
        const email = {
          type: 'alert',
          to: userEmail,
          subject: `Market Alert - ${alert.type}`,
          alert: alert,
          timestamp: new Date().toISOString(),
          template: 'alert'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      }),
      
      sendEventReminderEmail: jest.fn().mockImplementation(async (event, userEmail, daysUntilEvent) => {
        const email = {
          type: 'event_reminder',
          to: userEmail,
          subject: `Event Reminder - ${event.title}`,
          event: event,
          daysUntilEvent: daysUntilEvent,
          timestamp: new Date().toISOString(),
          template: 'event_reminder'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      }),
      
      sendInflationUpdateEmail: jest.fn().mockImplementation(async (inflationData, userEmail) => {
        const email = {
          type: 'inflation_update',
          to: userEmail,
          subject: 'Inflation Data Update',
          inflationData: inflationData,
          timestamp: new Date().toISOString(),
          template: 'inflation_update'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      }),
      
      sendWelcomeEmail: jest.fn().mockImplementation(async (userEmail, userName) => {
        const email = {
          type: 'welcome',
          to: userEmail,
          subject: 'Welcome to Crypto Market Watch',
          userName: userName,
          timestamp: new Date().toISOString(),
          template: 'welcome'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      }),
      
      sendSubscriptionConfirmationEmail: jest.fn().mockImplementation(async (userEmail, subscription) => {
        const email = {
          type: 'subscription_confirmation',
          to: userEmail,
          subject: 'Subscription Confirmed',
          subscription: subscription,
          timestamp: new Date().toISOString(),
          template: 'subscription_confirmation'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      }),
      
      sendPasswordResetEmail: jest.fn().mockImplementation(async (userEmail, resetToken) => {
        const email = {
          type: 'password_reset',
          to: userEmail,
          subject: 'Password Reset Request',
          resetToken: resetToken,
          timestamp: new Date().toISOString(),
          template: 'password_reset'
        };
        this.sentEmails.push(email);
        return { messageId: `test-${Date.now()}` };
      })
    };

    // Mock regular email service
    this.mockEmailService = {
      sendAlertEmail: jest.fn().mockImplementation(async (alert, userEmail) => {
        const email = {
          type: 'alert',
          to: userEmail,
          subject: `Market Alert - ${alert.type}`,
          alert: alert,
          timestamp: new Date().toISOString(),
          template: 'alert'
        };
        this.sentEmails.push(email);
        return true;
      }),
      
      sendWelcomeEmail: jest.fn().mockImplementation(async (userEmail, userName) => {
        const email = {
          type: 'welcome',
          to: userEmail,
          subject: 'Welcome to Crypto Market Watch',
          userName: userName,
          timestamp: new Date().toISOString(),
          template: 'welcome'
        };
        this.sentEmails.push(email);
        return true;
      })
    };

    return {
      brevoService: this.mockBrevoService,
      emailService: this.mockEmailService
    };
  }

  /**
   * Get all sent emails
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Get emails by type
   */
  getEmailsByType(type) {
    return this.sentEmails.filter(email => email.type === type);
  }

  /**
   * Get emails sent to specific user
   */
  getEmailsToUser(userEmail) {
    return this.sentEmails.filter(email => email.to === userEmail);
  }

  /**
   * Clear all sent emails
   */
  clearSentEmails() {
    this.sentEmails = [];
  }

  /**
   * Verify email was sent
   */
  verifyEmailSent(type, userEmail = null) {
    if (userEmail) {
      return this.sentEmails.some(email => 
        email.type === type && email.to === userEmail
      );
    }
    return this.sentEmails.some(email => email.type === type);
  }

  /**
   * Verify email count
   */
  verifyEmailCount(type, expectedCount) {
    const emails = this.getEmailsByType(type);
    return emails.length === expectedCount;
  }

  /**
   * Verify email content
   */
  verifyEmailContent(type, userEmail, contentCheck) {
    const emails = this.getEmailsToUser(userEmail).filter(email => email.type === type);
    return emails.some(email => contentCheck(email));
  }

  /**
   * Mock email template generation
   */
  mockEmailTemplate(templateName, templateFunction) {
    this.emailTemplates.set(templateName, templateFunction);
  }

  /**
   * Generate test email template
   */
  generateTestEmailTemplate(templateName, data) {
    const template = this.emailTemplates.get(templateName);
    if (template) {
      return template(data);
    }
    return `Test email template for ${templateName}`;
  }

  /**
   * Assert email was sent with correct content
   */
  assertEmailSent(type, userEmail, contentAssertions = {}) {
    const emails = this.getEmailsToUser(userEmail).filter(email => email.type === type);
    
    expect(emails.length).toBeGreaterThan(0);
    
    const email = emails[emails.length - 1]; // Get most recent
    
    if (contentAssertions.subject) {
      expect(email.subject).toContain(contentAssertions.subject);
    }
    
    if (contentAssertions.alert) {
      expect(email.alert).toMatchObject(contentAssertions.alert);
    }
    
    if (contentAssertions.event) {
      expect(email.event).toMatchObject(contentAssertions.event);
    }
    
    if (contentAssertions.inflationData) {
      expect(email.inflationData).toMatchObject(contentAssertions.inflationData);
    }
    
    return email;
  }

  /**
   * Reset all mocks and data
   */
  reset() {
    this.sentEmails = [];
    this.emailTemplates.clear();
    this.mockBrevoService = null;
    this.mockEmailService = null;
  }
}

module.exports = EmailTestHelper;
