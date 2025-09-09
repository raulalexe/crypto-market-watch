import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, User, Send, RefreshCw, CheckCircle, AlertCircle, Upload, X } from 'lucide-react';
import axios from 'axios';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [screenshot, setScreenshot] = useState(null);
  const [captcha, setCaptcha] = useState({
    question: '',
    answer: '',
    userAnswer: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Generate captcha question
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }

    setCaptcha({
      question: `What is ${num1} ${operator} ${num2}?`,
      answer: answer.toString(),
      userAnswer: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCaptchaChange = (e) => {
    setCaptcha(prev => ({
      ...prev,
      userAnswer: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setScreenshot(file);
      setError(''); // Clear any previous errors
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    // Reset the file input
    const fileInput = document.getElementById('screenshot');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return false;
    }
    if (!formData.message.trim()) {
      setError('Message is required');
      return false;
    }
    if (formData.message.length < 10) {
      setError('Message must be at least 10 characters long');
      return false;
    }
    if (captcha.userAnswer !== captcha.answer) {
      setError('Incorrect captcha answer');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('captchaAnswer', captcha.userAnswer);
      
      if (screenshot) {
        formDataToSend.append('screenshot', screenshot);
      }

      const response = await axios.post('/api/contact', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setScreenshot(null);
        generateCaptcha();
      } else {
        setError(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setError(error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Message Sent!</h2>
          <p className="text-slate-300 mb-6">
            Thank you for contacting us. We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MessageSquare className="w-12 h-12 text-crypto-blue" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
          <p className="text-slate-400">
            Have a question or need support? We're here to help.
          </p>
        </div>

        {/* Contact Form */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                placeholder="What is this about?"
                required
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue resize-none"
                placeholder="Please describe your question or issue in detail..."
                required
              />
            </div>

            {/* Screenshot Upload Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Screenshot (Optional)
              </label>
              <div className="space-y-3">
                {/* File Input */}
                <div className="relative">
                  <input
                    type="file"
                    id="screenshot"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="screenshot"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 hover:border-crypto-blue transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{screenshot ? 'Change Screenshot' : 'Upload Screenshot'}</span>
                  </label>
                </div>
                
                {/* File Info */}
                {screenshot && (
                  <div className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-crypto-blue/20 rounded flex items-center justify-center">
                        <Upload className="w-4 h-4 text-crypto-blue" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{screenshot.name}</p>
                        <p className="text-xs text-slate-400">
                          {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeScreenshot}
                      className="p-1 rounded hover:bg-slate-600 transition-colors"
                      title="Remove screenshot"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-slate-400">
                  Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.
                </p>
              </div>
            </div>

            {/* Captcha */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Security Verification *
              </label>
              <div className="space-y-3 md:space-y-0">
                {/* Mobile: Captcha question above input */}
                <div className="flex items-center space-x-2 md:hidden">
                  <span className="text-slate-300 text-sm font-medium">
                    {captcha.question}
                  </span>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                    title="Generate new captcha"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                
                {/* Desktop: Input and captcha side by side */}
                <div className="hidden md:flex md:items-center md:space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={captcha.userAnswer}
                      onChange={handleCaptchaChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                      placeholder="Enter the answer"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-300 text-sm font-medium">
                      {captcha.question}
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
                      title="Generate new captcha"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
                
                {/* Mobile: Input field below question */}
                <div className="md:hidden">
                  <input
                    type="text"
                    value={captcha.userAnswer}
                    onChange={handleCaptchaChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-crypto-blue"
                    placeholder="Enter the answer"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Additional Information */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Response Time</h3>
            <p className="text-slate-300 text-sm">
              We typically respond to inquiries within 24-48 hours during business days.
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">What to Include</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Your account email (if applicable)</li>
              <li>• Specific details about your issue</li>
              <li>• Screenshots if reporting a bug</li>
              <li>• Steps to reproduce the problem</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
