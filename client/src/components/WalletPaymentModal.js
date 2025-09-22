import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Clock, AlertCircle, Search, Loader2 } from 'lucide-react';

const WalletPaymentModal = ({ isOpen, onClose, paymentDetails, onPaymentComplete }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [txHash, setTxHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    if (!isOpen || !paymentDetails) return;

    // Calculate time left
    const expiresAt = new Date(paymentDetails.expiresAt);
    const now = new Date();
    const diff = expiresAt - now;
    
    if (diff > 0) {
      setTimeLeft(Math.floor(diff / 1000));
      
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, paymentDetails]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const verifyTransaction = async () => {
    if (!txHash.trim()) {
      setVerificationResult({ success: false, error: 'Please enter a transaction hash' });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/verify-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          txHash: txHash.trim(),
          expectedAmount: paymentDetails.amount,
          expectedToAddress: paymentDetails.address,
          network: paymentDetails.network,
          paymentId: paymentDetails.paymentId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setVerificationResult({ success: true, message: 'Transaction verified successfully!' });
        setPaymentStatus('verified');
        // Call the payment complete callback
        if (onPaymentComplete) {
          onPaymentComplete(result);
        }
      } else {
        setVerificationResult({ success: false, error: result.error || 'Transaction verification failed' });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ success: false, error: 'Failed to verify transaction. Please try again.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const getNetworkInfo = (network) => {
    switch (network) {
      case 'base':
        return {
          name: 'Base',
          color: 'bg-blue-600',
          icon: '🔵'
        };
      case 'solana':
        return {
          name: 'Solana',
          color: 'bg-purple-600',
          icon: '🟣'
        };
      default:
        return {
          name: 'Unknown',
          color: 'bg-gray-600',
          icon: '⚪'
        };
    }
  };

  if (!isOpen || !paymentDetails) return null;

  const networkInfo = getNetworkInfo(paymentDetails.network);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative my-4 sm:my-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${networkInfo.color} mb-4`}>
            <span className="text-2xl">{networkInfo.icon}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pay with USDC</h2>
          <p className="text-gray-400">Send payment to the address below</p>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-semibold">{paymentDetails.amount} USDC</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Network</span>
              <span className="text-white">{networkInfo.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{paymentDetails.months} month{paymentDetails.months > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Payment Address */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-gray-400 text-sm mb-2">Payment Address</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={paymentDetails.address}
                readOnly
                className="flex-1 bg-gray-700 text-white p-2 rounded text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(paymentDetails.address)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expiration Timer */}
          {timeLeft > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Payment expires in: {formatTime(timeLeft)}</span>
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-400">
                <p className="mb-2">Payment Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Copy the payment address above</li>
                  <li>Send exactly {paymentDetails.amount} USDC to this address</li>
                  <li>Wait for blockchain confirmation (usually 1-2 minutes)</li>
                  <li>Enter your transaction hash below and click "Verify Transaction"</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Transaction Verification */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block text-gray-400 text-sm mb-2">Transaction Hash (TxID)</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter your transaction hash here..."
                className="flex-1 bg-gray-700 text-white p-2 rounded text-sm font-mono placeholder-gray-500"
                disabled={isVerifying || paymentStatus === 'verified'}
              />
              <button
                onClick={verifyTransaction}
                disabled={isVerifying || paymentStatus === 'verified' || !txHash.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors flex items-center justify-center min-w-[100px] sm:min-w-[100px]"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-1 text-xs">
                  {isVerifying ? 'Checking...' : 'Verify'}
                </span>
              </button>
            </div>
            
            {/* Verification Result */}
            {verificationResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                verificationResult.success 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center space-x-2">
                  {verificationResult.success ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm ${
                    verificationResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {verificationResult.success ? verificationResult.message : verificationResult.error}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {paymentStatus === 'verified' ? (
            <div className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Payment Verified Successfully!</span>
            </div>
          ) : (
            <button
              onClick={() => copyToClipboard(paymentDetails.address)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Address</span>
            </button>
          )}
        </div>

        {/* Status */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Payment ID: {paymentDetails.paymentId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletPaymentModal;
