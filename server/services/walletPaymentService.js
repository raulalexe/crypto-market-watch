const axios = require('axios');
const { insertSubscription, updateSubscription, getUserById } = require('../database');

class WalletPaymentService {
  constructor() {
    // Base network configuration
    this.baseRpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.baseWalletAddress = process.env.BASE_WALLET_ADDRESS;
    
    // Solana network configuration
    this.solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.solanaWalletAddress = process.env.SOLANA_WALLET_ADDRESS;
    
    // USDC contract addresses
    this.baseUsdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base USDC
    this.solanaUsdcAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Solana USDC
    
    // Subscription plans with dynamic discount calculation
    this.discountOffer = parseFloat(process.env.DISCOUNT_OFFER) || 0;
    
    this.subscriptionPlans = {
      pro: {
        id: 'pro',
        name: 'Pro Plan',
        monthlyPrice: 29.99
      },
      premium: {
        id: 'premium',
        name: 'Premium Plan',
        monthlyPrice: 99.99
      }
    };
  }

  // Generate unique payment addresses for each subscription
  generatePaymentAddress(userId, planId, months = 1) {
    const timestamp = Date.now();
    const uniqueId = `${userId}_${planId}_${months}_${timestamp}`;
    
    return {
      baseAddress: this.baseWalletAddress,
      solanaAddress: this.solanaWalletAddress,
      paymentId: uniqueId,
      amount: this.calculateAmount(planId, months),
      currency: 'USDC',
      months: months,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  // Calculate payment amount with discounts (discount applies only to first month)
  calculateAmount(planId, months) {
    const plan = this.subscriptionPlans[planId];
    if (!plan) throw new Error('Invalid plan');

    const baseAmount = plan.monthlyPrice * months;
    
    // Calculate discount percentage from DISCOUNT_OFFER amount
    const discountPercentage = this.discountOffer / plan.monthlyPrice;
    const discount = Math.min(discountPercentage, 1); // Cap at 100%
    
    // Apply discount only to the first month
    const firstMonthPrice = Math.max(plan.monthlyPrice - this.discountOffer, 0);
    const remainingMonths = months - 1;
    const remainingAmount = remainingMonths > 0 ? plan.monthlyPrice * remainingMonths : 0;
    const discountedAmount = firstMonthPrice + remainingAmount;
    
    return {
      baseAmount,
      discount,
      discountAmount: this.discountOffer,
      discountedAmount,
      savings: baseAmount - discountedAmount,
      firstMonthPrice,
      remainingAmount
    };
  }

  // Check Base network for USDC payments
  async checkBasePayment(address, expectedAmount) {
    try {
      // Use Base RPC to check USDC balance
      const response = await axios.post(this.baseRpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: this.baseUsdcAddress,
            data: `0x70a08231000000000000000000000000${address.slice(2)}` // balanceOf(address)
          },
          'latest'
        ],
        id: 1
      });

      const balanceHex = response.data.result;
      const balance = parseInt(balanceHex, 16) / Math.pow(10, 6); // USDC has 6 decimals
      
      return balance >= expectedAmount;
    } catch (error) {
      console.error('Error checking Base payment:', error);
      return false;
    }
  }

  // Check Solana network for USDC payments
  async checkSolanaPayment(address, expectedAmount) {
    try {
      const response = await axios.post(this.solanaRpcUrl, {
        jsonrpc: '2.0',
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { mint: this.solanaUsdcAddress },
          { encoding: 'jsonParsed' }
        ],
        id: 1
      });

      if (response.data.result && response.data.result.value.length > 0) {
        const account = response.data.result.value[0];
        const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
        return balance >= expectedAmount;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking Solana payment:', error);
      return false;
    }
  }

  // Create wallet payment subscription
  async createWalletSubscription(userId, planId, months = 1, network = 'base') {
    try {
      console.log(`🔧 Creating wallet subscription for user ${userId}, plan ${planId}, months ${months}, network ${network}`);
      
      const user = await getUserById(userId);
      if (!user) throw new Error('User not found');
      
      console.log(`✅ User found: ${user.email}`);

      // Validate wallet addresses
      if (network === 'base' && (!this.baseWalletAddress || this.baseWalletAddress === '0x0000000000000000000000000000000000000000')) {
        throw new Error('Base wallet address not configured. Please set BASE_WALLET_ADDRESS in environment variables.');
      }
      
      if (network === 'solana' && (!this.solanaWalletAddress || this.solanaWalletAddress === '0000000000000000000000000000000000000000000000')) {
        throw new Error('Solana wallet address not configured. Please set SOLANA_WALLET_ADDRESS in environment variables.');
      }

      const paymentDetails = this.generatePaymentAddress(userId, planId, months);
      const amount = this.calculateAmount(planId, months);
      
      console.log(`💰 Payment details:`, paymentDetails);
      console.log(`💵 Amount:`, amount);

      // Store pending payment in database
      const subscription = {
        user_id: userId,
        plan_type: planId,
        status: 'pending_payment',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000) // Approximate months
      };

      console.log(`💾 Storing subscription:`, subscription);
      const subscriptionId = await insertSubscription(subscription);
      console.log(`✅ Subscription stored with ID: ${subscriptionId}`);

      return {
        paymentId: paymentDetails.paymentId,
        address: network === 'base' ? paymentDetails.baseAddress : paymentDetails.solanaAddress,
        amount: amount.discountedAmount,
        currency: 'USDC',
        network: network,
        months: months,
        expiresAt: paymentDetails.expiresAt,
        discount: amount.discount,
        savings: amount.savings
      };
    } catch (error) {
      console.error('❌ Error creating wallet subscription:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Monitor pending payments
  async checkPendingPayments() {
    try {
      // Get all pending payments from database
      const pendingPayments = await this.getPendingPayments();
      
      for (const payment of pendingPayments) {
        const isPaid = payment.network === 'base' 
          ? await this.checkBasePayment(payment.address, payment.amount)
          : await this.checkSolanaPayment(payment.address, payment.amount);

        if (isPaid) {
          await this.activateSubscription(payment);
        }
      }
    } catch (error) {
      console.error('Error checking pending payments:', error);
    }
  }

  // Activate subscription after payment confirmation
  async activateSubscription(payment) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + payment.months);

      await updateSubscription(payment.id, {
        status: 'active',
        start_date: startDate,
        end_date: endDate,
        activated_at: new Date()
      });

      console.log(`✅ Subscription activated for user ${payment.user_id}, plan ${payment.plan_type}`);
      
      // Send confirmation email
      // TODO: Implement email confirmation
      
      return true;
    } catch (error) {
      console.error('Error activating subscription:', error);
      return false;
    }
  }

  // Get pending payments from database
  async getPendingPayments() {
    // TODO: Implement database query for pending payments
    return [];
  }

  // Get subscription renewal info
  async getRenewalInfo(userId) {
    try {
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) return null;

      const daysUntilExpiry = Math.ceil((subscription.end_date - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        planType: subscription.plan_type,
        expiresAt: subscription.end_date,
        daysUntilExpiry,
        needsRenewal: daysUntilExpiry <= 7,
        canRenew: daysUntilExpiry <= 30
      };
    } catch (error) {
      console.error('Error getting renewal info:', error);
      return null;
    }
  }

  // Get active subscription
  async getActiveSubscription(userId) {
    // TODO: Implement database query for active subscription
    return null;
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      // TODO: Implement database query for payment status
      return {
        paymentId,
        status: 'pending',
        message: 'Payment status check not implemented yet'
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Get subscription plans with pricing
  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  // Calculate discount info
  getDiscountInfo(planId, months) {
    const plan = this.subscriptionPlans[planId];
    if (!plan) return null;

    const discount = plan.discounts[months] || 0;
    const baseAmount = plan.monthlyPrice * months;
    const discountedAmount = baseAmount * (1 - discount);
    const savings = baseAmount - discountedAmount;

    return {
      planId,
      months,
      baseAmount,
      discount: discount * 100, // Convert to percentage
      discountedAmount,
      savings,
      monthlyPrice: plan.monthlyPrice
    };
  }
}

module.exports = new WalletPaymentService();
