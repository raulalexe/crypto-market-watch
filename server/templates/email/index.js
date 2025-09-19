/**
 * Email Templates Index
 * 
 * Centralized exports for all email templates
 */

const BaseEmailTemplate = require('./base-template');
const AlertEmailTemplate = require('./alert-template');
const ConfirmationEmailTemplate = require('./confirmation-template');
const AccountDeletedEmailTemplate = require('./account-deleted-template');
const UpgradeEmailTemplate = require('./upgrade-template');
const RenewalEmailTemplate = require('./renewal-template');
const InflationEmailTemplate = require('./inflation-template');
const EventEmailTemplate = require('./event-template');
const ContactEmailTemplate = require('./contact-template');

// Export all templates
module.exports = {
  BaseEmailTemplate,
  AlertEmailTemplate,
  ConfirmationEmailTemplate,
  AccountDeletedEmailTemplate,
  UpgradeEmailTemplate,
  RenewalEmailTemplate,
  InflationEmailTemplate,
  EventEmailTemplate,
  ContactEmailTemplate,
  
  // Create instances for easy use
  alert: new AlertEmailTemplate(),
  confirmation: new ConfirmationEmailTemplate(),
  accountDeleted: new AccountDeletedEmailTemplate(),
  upgrade: new UpgradeEmailTemplate(),
  renewal: new RenewalEmailTemplate(),
  inflation: new InflationEmailTemplate(),
  event: new EventEmailTemplate(),
  contact: new ContactEmailTemplate(),
};
