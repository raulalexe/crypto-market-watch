import React, { useEffect, useState } from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EmailConfirmError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  
  const error = searchParams.get('error') || 'Email confirmation failed';

  useEffect(() => {
    // Countdown timer to redirect to login
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleResendConfirmation = () => {
    navigate('/resend-confirmation');
  };

  const getErrorMessage = (error) => {
    switch (error.toLowerCase()) {
      case 'confirmation token has expired':
        return {
          title: 'Link Expired',
          message: 'This confirmation link has expired. Please request a new one.',
          action: 'resend'
        };
      case 'invalid confirmation token':
        return {
          title: 'Invalid Link',
          message: 'This confirmation link is invalid or has already been used.',
          action: 'resend'
        };
      case 'confirmation token is required':
        return {
          title: 'Missing Token',
          message: 'The confirmation link is incomplete.',
          action: 'resend'
        };
      default:
        return {
          title: 'Confirmation Failed',
          message: 'Something went wrong with your email confirmation.',
          action: 'resend'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {errorInfo.title}
          </h1>
          
          <p className="text-slate-300 mb-6">
            {errorInfo.message}
          </p>

          <p className="text-slate-400 text-sm mb-8">
            You will be redirected to the login page in {countdown} seconds.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {errorInfo.action === 'resend' && (
              <button
                onClick={handleResendConfirmation}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resend Confirmation Email</span>
              </button>
            )}
            
            <button
              onClick={handleGoToLogin}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
            <p className="text-slate-400 text-xs">
              💡 <strong>Need help?</strong> If you continue to have issues, please contact support or try signing up again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmError;
