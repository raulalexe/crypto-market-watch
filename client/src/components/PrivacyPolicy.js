import React from 'react';
import { Shield, Lock, Eye, Database, Globe, AlertTriangle } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-12 h-12 text-crypto-blue" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400 mr-2" />
            <h2 className="text-xl font-semibold text-red-400">Important Disclaimers</h2>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-red-300">
              <strong>NOT FINANCIAL ADVICE:</strong> The information provided on this platform is for educational and informational purposes only. 
              It does not constitute financial advice, investment recommendations, or any form of professional guidance.
            </p>
            <p className="text-red-300">
              <strong>THIRD-PARTY DATA:</strong> We rely on third-party data sources for market information. We do not guarantee the accuracy, 
              completeness, or reliability of this data and are not responsible for any decisions made based on this information.
            </p>
            <p className="text-red-300">
              <strong>NO RESPONSIBILITY:</strong> We are not responsible for any financial losses, damages, or consequences resulting from 
              the use of our platform or reliance on the information provided.
            </p>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Database className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Information We Collect</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Email address (for account creation and communication)</li>
                <li>Name (optional, for account personalization)</li>
                <li>Payment information (processed securely by third-party payment processors)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Usage Data</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>IP address and browser information</li>
                <li>Pages visited and features used</li>
                <li>API usage patterns</li>
                <li>Error logs and performance data</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Third-Party Data</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Cryptocurrency market data from CoinGecko, Alpha Vantage, and other providers</li>
                <li>Market sentiment data from various sources</li>
                <li>Economic indicators and financial market data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Information */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Eye className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">How We Use Information</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Provide and maintain our cryptocurrency market monitoring services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send important service updates and notifications</li>
            <li>Improve our platform and user experience</li>
            <li>Analyze usage patterns to optimize performance</li>
            <li>Comply with legal obligations and prevent fraud</li>
          </ul>
        </div>

        {/* Data Sharing */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Data Sharing and Third Parties</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">We Do Not Sell Your Data</h3>
              <p className="text-gray-300">
                We do not sell, trade, or rent your personal information to third parties for marketing purposes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Service Providers</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Payment processors (Stripe, PayPal) for subscription management</li>
                <li>Cloud hosting providers (Railway, Vercel) for platform hosting</li>
                <li>Analytics services (Google Analytics) for usage insights</li>
                <li>Email service providers for notifications</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Legal Requirements</h3>
              <p className="text-gray-300">
                We may disclose information if required by law, court order, or government request.
              </p>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Data Security</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>All data is encrypted in transit using HTTPS/TLS</li>
            <li>Passwords are hashed using bcrypt</li>
            <li>Database access is restricted and monitored</li>
            <li>Regular security audits and updates</li>
            <li>Secure API authentication using JWT tokens</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Access and Control</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Communication</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Opt out of marketing emails</li>
                <li>Control notification preferences</li>
                <li>Request data processing restrictions</li>
                <li>Lodge privacy complaints</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-4">
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="space-y-2 text-gray-300">
            <p>Email: privacy@cryptowatch.com</p>
            <p>Support: support@cryptowatch.com</p>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Updates to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy from time to time. We will notify users of significant changes 
            via email or through our platform. Continued use of our services after changes constitutes 
            acceptance of the updated policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
