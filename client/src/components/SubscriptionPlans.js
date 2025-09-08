import React from 'react';
import PricingSection from './PricingSection';

const SubscriptionPlans = ({ setAuthModalOpen }) => {
  return (
    <PricingSection 
      variant="app"
      setAuthModalOpen={setAuthModalOpen}
      showPaymentMethods={true}
      showFAQ={true}
      showCTA={false}
    />
  );
};

export default SubscriptionPlans;
