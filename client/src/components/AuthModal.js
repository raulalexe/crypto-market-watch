import React, { useState } from 'react';
import { X, Lock, Mail } from 'lucide-react';
import axios from 'axios';

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        // Login
        response = await axios.post('/api/auth/login', { email, password });
        
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
      setError(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-crypto-blue hover:text-blue-400 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-slate-700 rounded-lg">
          <p className="text-slate-400 text-xs text-center">
            Demo Mode: This creates a test account for subscription testing
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;