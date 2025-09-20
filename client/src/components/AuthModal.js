import React, { useState, useEffect } from 'react';
import { X, Lock, Mail } from 'lucide-react';
import axios from 'axios';
import authService from '../services/authService';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Update isLogin state when initialMode changes
  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setAgreedToTerms(false); // Reset terms agreement
    setError(''); // Clear any errors
  }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check terms agreement for signup
    if (!isLogin && !agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      setLoading(false);
      return;
    }

    try {
      let response;
      
      if (isLogin) {
        // Login
        response = await axios.post('/api/auth/login', { email, password });
        
        // Check if login requires email confirmation
        if (response.data.requiresConfirmation) {
          setEmailSent(true);
          setConfirmationMessage('Please check your email and click the confirmation link to activate your account before signing in.');
          return;
        }
        
        const { token, user } = response.data;
        
        // Store the real JWT token
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set default auth header for all future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        onAuthSuccess();
        onClose();
      } else {
        // Register
        response = await axios.post('/api/auth/register', { email, password });
        
        if (response.data.requiresConfirmation) {
          setEmailSent(true);
          setConfirmationMessage('Please check your email and click the confirmation link to activate your account.');
        } else {
          const { token, user } = response.data;
          
          // Store the real JWT token
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Set default auth header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          onAuthSuccess();
          onClose();
        }
      }
    } catch (error) {
      // Handle specific case where user exists but email is not verified
      if (error.response?.status === 409 && error.response?.data?.requiresConfirmation) {
        setEmailSent(true);
        setConfirmationMessage(error.response.data.message);
      } else {
        setError(error.response?.data?.error || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/forgot-password', { email });
      setForgotPasswordSent(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Forgot password sent view
  if (forgotPasswordSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <Mail className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Check Your Email</h2>
            <p className="text-slate-400 mb-6">
              If an account with that email exists, a password reset link has been sent.
            </p>
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300 mb-2">Email sent to:</p>
              <p className="text-crypto-blue font-medium">{email}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setForgotPasswordSent(false);
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="w-full bg-crypto-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Reset Password</h2>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-crypto-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }}
              className="text-crypto-blue hover:text-blue-400 text-sm"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email confirmation view
  if (emailSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <Mail className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Check Your Email</h2>
            <p className="text-slate-400 mb-6">{confirmationMessage}</p>
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300 mb-2">Email sent to:</p>
              <p className="text-crypto-blue font-medium">{email}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await axios.post('/api/auth/resend-confirmation', { email });
                    setConfirmationMessage('Confirmation email resent! Please check your inbox.');
                  } catch (error) {
                    setError(error.response?.data?.error || 'Failed to resend confirmation email');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full bg-crypto-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
              
              <button
                onClick={() => {
                  setEmailSent(false);
                  setConfirmationMessage('');
                  setError('');
                }}
                className="text-crypto-blue hover:text-blue-400 text-sm"
              >
                Back to Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Terms and Privacy Policy Agreement - Only show for signup */}
          {!isLogin && (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-crypto-blue bg-slate-700 border-slate-600 rounded focus:ring-crypto-blue focus:ring-2"
              />
              <label htmlFor="agreeTerms" className="text-sm text-slate-300">
                I agree to the{' '}
                <a 
                  href="/app/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-crypto-blue hover:text-blue-400 underline"
                >
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a 
                  href="/app/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-crypto-blue hover:text-blue-400 underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-crypto-blue text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {isLogin && (
            <div>
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-crypto-blue hover:text-blue-400 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          )}
          <div>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAgreedToTerms(false); // Reset terms agreement when switching
                setError(''); // Clear any errors
              }}
              className="text-crypto-blue hover:text-blue-400 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default AuthModal;