import { useEffect } from 'react';

const UmamiAnalytics = () => {
  useEffect(() => {
    // Only load Umami in production and not on localhost
    if (process.env.NODE_ENV === 'production' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' && 
        window.location.hostname !== '0.0.0.0') {
      
      // Get Umami configuration from environment variables
      const umamiDomain = process.env.REACT_APP_UMAMI_DOMAIN;
      const umamiWebsiteId = process.env.REACT_APP_UMAMI_WEBSITE_ID;
      
      if (umamiDomain && umamiWebsiteId) {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src*="${umamiDomain}"]`);
        
        if (!existingScript) {
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://${umamiDomain}/script.js`;
          script.setAttribute('data-website-id', umamiWebsiteId);
          document.head.appendChild(script);
          
          console.log('Umami analytics loaded');
        }
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default UmamiAnalytics;
