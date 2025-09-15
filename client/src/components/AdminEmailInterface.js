import React, { useState } from 'react';
import { Send, Mail, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const AdminEmailInterface = () => {
  const [emailData, setEmailData] = useState({
    recipientEmail: 'admin@crypto-market-watch.xyz',
    recipientName: '',
    templateType: 'welcome',
    customSubject: '',
    customMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const emailTemplates = [
    { value: 'welcome', label: 'Welcome Email', description: 'Welcome new users to the platform' },
    { value: 'confirmation', label: 'Email Confirmation', description: 'Confirm user email addresses' },
    { value: 'password-reset', label: 'Password Reset', description: 'Reset user passwords' },
    { value: 'upgrade', label: 'Subscription Upgrade', description: 'Notify users of plan upgrades' },
    { value: 'renewal-reminder', label: 'Renewal Reminder', description: 'Remind users about expiring subscriptions' },
    { value: 'subscription-expired', label: 'Subscription Expired', description: 'Notify users of expired subscriptions' },
    { value: 'account-deleted-admin', label: 'Account Deleted (Admin)', description: 'Notify users when admin deletes their account' },
    { value: 'account-deleted-user', label: 'Account Deleted (User)', description: 'Notify users when they delete their own account' },
    { value: 'alert', label: 'Market Alert', description: 'Send market alerts to users' },
    { value: 'event-reminder', label: 'Event Reminder', description: 'Remind users about upcoming events' },
    { value: 'inflation-update', label: 'Inflation Update', description: 'Send inflation data updates' }
  ];

  const handleInputChange = (field, value) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail) {
      setResult({ success: false, message: 'Recipient email is required' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailData)
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message || 'Email sent successfully!' });
        // Reset form
        setEmailData({
          recipientEmail: 'admin@crypto-market-watch.xyz',
          recipientName: '',
          templateType: 'welcome',
          customSubject: '',
          customMessage: ''
        });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = emailTemplates.find(t => t.value === emailData.templateType);

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="w-6 h-6 text-crypto-blue" />
        <h2 className="text-2xl font-bold text-white">Admin Email Interface</h2>
      </div>

      <div className="space-y-6">
        {/* Email Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Template
          </label>
          <select
            value={emailData.templateType}
            onChange={(e) => handleInputChange('templateType', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
          >
            {emailTemplates.map(template => (
              <option key={template.value} value={template.value}>
                {template.label}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <p className="mt-1 text-sm text-gray-400">{selectedTemplate.description}</p>
          )}
        </div>

        {/* Recipient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Email *
            </label>
            <input
              type="email"
              value={emailData.recipientEmail}
              onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
              placeholder="admin@crypto-market-watch.xyz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Name (Optional)
            </label>
            <input
              type="text"
              value={emailData.recipientName}
              onChange={(e) => handleInputChange('recipientName', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Custom Subject (for certain templates) */}
        {['alert', 'event-reminder', 'inflation-update'].includes(emailData.templateType) && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Subject (Optional)
            </label>
            <input
              type="text"
              value={emailData.customSubject}
              onChange={(e) => handleInputChange('customSubject', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
              placeholder="Custom email subject"
            />
          </div>
        )}

        {/* Custom Message (for certain templates) */}
        {['alert', 'event-reminder', 'inflation-update'].includes(emailData.templateType) && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={emailData.customMessage}
              onChange={(e) => handleInputChange('customMessage', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
              placeholder="Custom message content"
            />
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSendEmail}
            disabled={isLoading || !emailData.recipientEmail}
            className="bg-crypto-blue hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Email</span>
              </>
            )}
          </button>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            result.success 
              ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
              : 'bg-red-900/20 border border-red-500/30 text-red-400'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </div>

      {/* Template Information */}
      <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Template Information</span>
        </h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p><strong>Selected Template:</strong> {selectedTemplate?.label}</p>
          <p><strong>Description:</strong> {selectedTemplate?.description}</p>
          <p><strong>Recipient:</strong> {emailData.recipientEmail}</p>
          {emailData.recipientName && <p><strong>Name:</strong> {emailData.recipientName}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminEmailInterface;
