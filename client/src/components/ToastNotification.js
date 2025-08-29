import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

const ToastNotification = ({ message, type = 'success', onClose, duration = 5000 }) => {
  const alertStyles = {
    success: 'bg-green-900/20 border-green-500/30 text-green-400',
    error: 'bg-red-900/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-900/20 border-blue-500/30 text-blue-400'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <AlertTriangle className="w-5 h-5" />
  };

  // Auto-hide after duration
  React.useEffect(() => {
    if (duration > 0 && message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, message]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center space-x-3 p-4 rounded-lg border ${alertStyles[type]} shadow-lg backdrop-blur-sm max-w-sm`}>
        {icons[type]}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
