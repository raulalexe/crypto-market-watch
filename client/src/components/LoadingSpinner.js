import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-crypto-blue border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-300 text-lg">Loading market data...</p>
    </div>
  );
};

export default LoadingSpinner;