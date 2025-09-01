import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const UnsubscribeSuccess = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Successfully Unsubscribed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You have been successfully unsubscribed from email notifications.
            </p>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {email}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                You will no longer receive email notifications from Crypto Market Monitor.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center">
              You can always resubscribe to email notifications by visiting your{' '}
              <a href="/settings" className="text-blue-600 hover:text-blue-500">
                account settings
              </a>
              .
            </p>
          </div>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Redirecting to homepage in {countdown} seconds...
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Homepage Now
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Changed your mind?{' '}
                <a href="/settings" className="text-blue-600 hover:text-blue-500">
                  Manage your notification preferences
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnsubscribeSuccess;
