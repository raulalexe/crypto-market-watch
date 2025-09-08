import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const EmailConfirmSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // Store the token in localStorage for automatic login
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('authToken', token);
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token, navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            Email Confirmed!
          </h1>
          
          <p className="text-slate-300 mb-6">
            Your email address <span className="text-green-400 font-medium">{email}</span> has been successfully verified.
          </p>

          <p className="text-slate-400 text-sm mb-8">
            You are now logged in and will be redirected to your dashboard in {countdown} seconds.
          </p>

          {/* Action Button */}
          <button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
            <p className="text-slate-400 text-xs">
              🎉 Welcome to Crypto Market Watch! You now have access to:
            </p>
            <ul className="text-slate-400 text-xs mt-2 space-y-1">
              <li>• Real-time market data</li>
              <li>• AI-powered analysis</li>
              <li>• Custom alerts</li>
              <li>• Economic calendar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmSuccess;
