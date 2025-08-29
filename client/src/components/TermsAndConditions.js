import React from 'react';
import { FileText, AlertTriangle, Shield, Scale, Users, Clock } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FileText className="w-12 h-12 text-crypto-blue" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Critical Disclaimers */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400 mr-2" />
            <h2 className="text-xl font-semibold text-red-400">Critical Disclaimers</h2>
          </div>
          <div className="space-y-4 text-sm">
            <div className="bg-red-800/30 p-4 rounded-lg">
              <h3 className="font-bold text-red-300 mb-2">NOT FINANCIAL ADVICE</h3>
              <p className="text-red-200">
                The information, tools, and content provided on this platform are for educational and informational purposes only. 
                They do not constitute financial advice, investment recommendations, or any form of professional guidance. 
                Always consult with qualified financial advisors before making investment decisions.
              </p>
            </div>
            <div className="bg-red-800/30 p-4 rounded-lg">
              <h3 className="font-bold text-red-300 mb-2">THIRD-PARTY DATA DISCLAIMER</h3>
              <p className="text-red-200">
                We rely on third-party data sources including but not limited to CoinGecko, Alpha Vantage, and other market data providers. 
                We do not guarantee the accuracy, completeness, timeliness, or reliability of this data. 
                Data may be delayed, incomplete, or contain errors. We are not responsible for any decisions made based on this information.
              </p>
            </div>
            <div className="bg-red-800/30 p-4 rounded-lg">
              <h3 className="font-bold text-red-300 mb-2">NO RESPONSIBILITY FOR LOSSES</h3>
              <p className="text-red-200">
                We are not responsible for any financial losses, damages, or consequences resulting from the use of our platform, 
                reliance on the information provided, or any investment decisions made. Cryptocurrency investments carry significant risk 
                and you may lose some or all of your investment.
              </p>
            </div>
          </div>
        </div>

        {/* Acceptance of Terms */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
          </div>
          <p className="text-gray-300 mb-4">
            By accessing and using this platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. 
            If you do not agree with any part of these terms, you must not use our services.
          </p>
          <p className="text-gray-300">
            These terms apply to all users of the platform, including visitors, registered users, and subscribers.
          </p>
        </div>

        {/* Service Description */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Service Description</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">What We Provide</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Cryptocurrency market data and analytics</li>
                <li>AI-powered market analysis and predictions</li>
                <li>Market sentiment indicators and trends</li>
                <li>Data export and reporting tools</li>
                <li>Real-time market monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Service Limitations</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Data may be delayed or incomplete</li>
                <li>AI predictions are not guaranteed to be accurate</li>
                <li>Service availability may vary</li>
                <li>Features may change without notice</li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Responsibilities */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">User Responsibilities</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Account Security</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Use strong, unique passwords</li>
                <li>Enable two-factor authentication when available</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Acceptable Use</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Use the platform for lawful purposes only</li>
                <li>Do not attempt to reverse engineer or hack the platform</li>
                <li>Do not overload our servers with excessive requests</li>
                <li>Respect intellectual property rights</li>
                <li>Do not share account access with unauthorized users</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Investment Decisions</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Conduct your own research before making investment decisions</li>
                <li>Consult with qualified financial advisors</li>
                <li>Understand the risks involved in cryptocurrency trading</li>
                <li>Never invest more than you can afford to lose</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Subscription Terms */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Terms</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Billing and Payments</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Subscriptions are billed in advance on a recurring basis</li>
                <li>Payment is processed securely by third-party payment processors</li>
                <li>Prices may change with 30 days notice</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Cancellation and Refunds</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds for partial months or unused time</li>
                <li>Refunds may be provided at our discretion for technical issues</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Scale className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Intellectual Property</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Our Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>All platform content, design, and code are our property</li>
                <li>AI analysis and predictions are proprietary</li>
                <li>Trademarks and branding are protected</li>
                <li>You may not copy, modify, or distribute our content</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Third-Party Rights</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Market data belongs to respective providers</li>
                <li>Third-party logos and trademarks are respected</li>
                <li>We license data for display purposes only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2 text-yellow-300">Maximum Liability</h3>
              <p className="text-yellow-200">
                Our total liability to you for any claims arising from the use of our services shall not exceed 
                the amount you paid for the service in the 12 months preceding the claim.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Excluded Damages</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Lost profits or business opportunities</li>
                <li>Data loss or corruption</li>
                <li>Investment losses or trading damages</li>
                <li>Emotional distress or punitive damages</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Additional Disclaimers</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Service Availability</h3>
              <p className="text-gray-300">
                We strive to maintain high service availability but do not guarantee uninterrupted access. 
                Service may be temporarily unavailable due to maintenance, technical issues, or other factors.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Data Accuracy</h3>
              <p className="text-gray-300">
                While we make reasonable efforts to ensure data accuracy, we cannot guarantee that all information 
                is current, complete, or error-free. Market conditions change rapidly and data may become outdated.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">AI Predictions</h3>
              <p className="text-gray-300">
                AI-generated predictions and analysis are based on historical data and algorithms. 
                Past performance does not guarantee future results. These predictions should not be the sole basis 
                for investment decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Termination */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Clock className="w-6 h-6 text-crypto-blue mr-2" />
            <h2 className="text-xl font-semibold">Termination</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">By You</h3>
              <p className="text-gray-300">
                You may terminate your account at any time by contacting us or using the account deletion feature. 
                Upon termination, your access will be revoked and data may be deleted.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">By Us</h3>
              <p className="text-gray-300">
                We may terminate or suspend your account for violations of these terms, fraudulent activity, 
                or other reasons at our sole discretion. We will provide notice when possible.
              </p>
            </div>
          </div>
        </div>

        {/* Governing Law */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Governing Law and Disputes</h2>
          <div className="space-y-4">
            <p className="text-gray-300">
              These terms are governed by the laws of [Jurisdiction]. Any disputes will be resolved through 
              binding arbitration in accordance with the rules of [Arbitration Organization].
            </p>
            <p className="text-gray-300">
              You agree to resolve disputes individually and waive any right to participate in class action lawsuits.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          <p className="text-gray-300 mb-4">
            For questions about these Terms and Conditions, please use our contact form.
          </p>
        </div>

        {/* Updates */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
          <p className="text-gray-300">
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. 
            Continued use of our services after changes constitutes acceptance of the updated terms. 
            We will notify users of significant changes via email or platform notification.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
