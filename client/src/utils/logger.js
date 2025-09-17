// Environment-dependent logging utility
const isVerboseLogging = () => {
  return process.env.NODE_ENV === 'development' || process.env.REACT_APP_VERBOSE_LOGGING === 'true';
};

const logger = {
  log: (...args) => {
    if (isVerboseLogging()) {
      console.log(...args);
    }
  },
  
  warn: (...args) => {
    if (isVerboseLogging()) {
      console.warn(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but with different levels
    if (isVerboseLogging()) {
      console.error(...args);
    } else {
      // In production, only log critical errors
      console.error('[ERROR]', ...args);
    }
  },
  
  info: (...args) => {
    if (isVerboseLogging()) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isVerboseLogging()) {
      console.debug(...args);
    }
  }
};

export default logger;
