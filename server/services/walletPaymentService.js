const axios = require('axios');
const path = require('path');
const { getUserById, updateUser } = require('../database');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

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
    
    // DISCOUNT_OFFER contains the final discounted price for first month (e.g., 9.99)
    // If DISCOUNT_OFFER is set, use it as the first month price, otherwise use full price
    const firstMonthPrice = this.discountOffer > 0 ? this.discountOffer : plan.monthlyPrice;
    const discountAmount = plan.monthlyPrice - firstMonthPrice;
    const discountPercentage = discountAmount / plan.monthlyPrice;
    
    const remainingMonths = months - 1;
    const remainingAmount = remainingMonths > 0 ? plan.monthlyPrice * remainingMonths : 0;
    const discountedAmount = firstMonthPrice + remainingAmount;
    
    return {
      baseAmount,
      discount: discountPercentage,
      discountAmount: discountAmount,
      discountedAmount,
      savings: baseAmount - discountedAmount,
      firstMonthPrice,
      remainingAmount
    };
  }

  // Verify Base network transaction by hash
  async verifyBaseTransaction(txHash, expectedAmount, expectedToAddress) {
    try {
      console.log(`🔍 Verifying Base transaction: ${txHash}`);
      
      // Get transaction details
      const txResponse = await axios.post(this.baseRpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      });

      if (!txResponse.data.result) {
        console.log('❌ Transaction not found');
        return { success: false, error: 'Transaction not found' };
      }

      const tx = txResponse.data.result;
      
      // Get transaction receipt to check if it was successful
      const receiptResponse = await axios.post(this.baseRpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 2
      });

      if (!receiptResponse.data.result) {
        console.log('❌ Transaction receipt not found');
        return { success: false, error: 'Transaction not confirmed yet' };
      }

      const receipt = receiptResponse.data.result;
      
      // Check if transaction was successful
      if (receipt.status !== '0x1') {
        console.log('❌ Transaction failed');
        return { success: false, error: 'Transaction failed' };
      }

      // Check if transaction is recent (within 1 hour) to prevent replay attacks
      const blockNumber = parseInt(receipt.blockNumber, 16);
      const blockResponse = await axios.post(this.baseRpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [`0x${blockNumber.toString(16)}`, false],
        id: 3
      });

      if (!blockResponse.data.result) {
        console.log('❌ Block not found');
        return { success: false, error: 'Transaction block not found' };
      }

      const block = blockResponse.data.result;
      const blockTimestamp = parseInt(block.timestamp, 16);
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 60 * 60; // 1 hour in seconds

      if (currentTime - blockTimestamp > maxAge) {
        console.log('❌ Transaction too old');
        return { success: false, error: 'Transaction is too old. Must be within 1 hour. Contact support if you need assistance.' };
      }

      // Check if it's a USDC transfer
      if (tx.to.toLowerCase() !== this.baseUsdcAddress.toLowerCase()) {
        console.log('❌ Not a USDC transaction');
        return { success: false, error: 'Not a USDC transaction' };
      }

      // Parse transaction data to get transfer details
      // USDC transfer data format: 0xa9059cbb + to_address (32 bytes) + amount (32 bytes)
      const data = tx.input;
      if (!data.startsWith('0xa9059cbb')) {
        console.log('❌ Not a transfer transaction');
        return { success: false, error: 'Not a transfer transaction' };
      }

      // Extract recipient address and amount
      const toAddress = '0x' + data.slice(34, 74); // Skip function selector and padding
      const amountHex = data.slice(74, 138); // Amount in hex
      const amount = parseInt(amountHex, 16) / Math.pow(10, 6); // USDC has 6 decimals

      console.log(`📊 Transaction details:`, {
        to: toAddress,
        expectedTo: expectedToAddress,
        amount: amount,
        expectedAmount: expectedAmount
      });

      // Verify recipient address
      if (toAddress.toLowerCase() !== expectedToAddress.toLowerCase()) {
        console.log('❌ Wrong recipient address');
        return { success: false, error: 'Transaction sent to wrong address' };
      }

      // Verify amount - accept payments >= expected amount (users might send round numbers)
      if (amount < expectedAmount) {
        console.log('❌ Insufficient amount');
        return { success: false, error: `Insufficient amount. Expected at least ${expectedAmount} USDC, got ${amount} USDC` };
      }

      console.log('✅ Transaction verified successfully');
      return { 
        success: true, 
        amount: amount,
        toAddress: toAddress,
        blockNumber: parseInt(receipt.blockNumber, 16),
        gasUsed: parseInt(receipt.gasUsed, 16)
      };
    } catch (error) {
      console.error('Error verifying Base transaction:', error);
      return { success: false, error: 'Failed to verify transaction' };
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
      // Note: Subscription data now stored directly in users table
      // No separate subscription table needed
      console.log(`💾 Wallet payment created for user ${userId}, plan ${planId}`);

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

      // Update user's subscription directly in users table
      await updateUser(payment.user_id, {
        subscription_plan: payment.plan_type,
        subscription_expires_at: endDate
      });

      console.log(`✅ Subscription activated for user ${payment.user_id}, plan ${payment.plan_type}`);
      
      // Send upgrade email (same as Stripe payments)
      try {
        const { getUserById } = require('../database');
        const user = await getUserById(payment.user_id);
        if (user && user.email) {
          const EmailService = require('./emailService');
          const emailService = new EmailService();
          
          // Get plan name from plan type
          const planName = this.getPlanName(payment.plan_type);
          
          const subscriptionDetails = {
            current_period_start: startDate,
            current_period_end: endDate,
            payment_method: 'crypto',
            payment_id: payment.id || 'crypto_payment'
          };

          const emailSent = await emailService.sendUpgradeEmail(
            user.email, 
            user.email.split('@')[0], 
            planName, 
            subscriptionDetails
          );
          
          if (emailSent) {
            console.log(`📧 Upgrade email sent to ${user.email} for ${planName} subscription`);
          } else {
            console.log(`⚠️ Failed to send upgrade email to ${user.email}`);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending upgrade email:', emailError);
        // Don't throw the error - subscription activation should still succeed
      }
      
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
      const user = await getUserById(userId);
      if (!user || !user.subscription_plan || user.subscription_plan === 'free') return null;

      const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
      if (!expiresAt) return null;

      const daysUntilExpiry = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        planType: user.subscription_plan,
        expiresAt: expiresAt,
        daysUntilExpiry,
        needsRenewal: daysUntilExpiry <= 7,
        canRenew: daysUntilExpiry <= 30
      };
    } catch (error) {
      console.error('Error getting renewal info:', error);
      return null;
    }
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

  // Verify Solana transaction by hash
  async verifySolanaTransaction(txHash, expectedAmount, expectedToAddress) {
    try {
      console.log(`🔍 Verifying Solana transaction: ${txHash}`);
      
      // Get transaction details using Solana RPC
      const response = await axios.post(this.solanaRpcUrl, {
        jsonrpc: '2.0',
        method: 'getTransaction',
        params: [
          txHash,
          {
            encoding: 'json',
            maxSupportedTransactionVersion: 0
          }
        ],
        id: 1
      });

      if (!response.data.result) {
        console.log('❌ Transaction not found');
        return { success: false, error: 'Transaction not found' };
      }

      const tx = response.data.result;
      
      // Check if transaction was successful
      if (tx.meta.err !== null) {
        console.log('❌ Transaction failed');
        return { success: false, error: 'Transaction failed' };
      }

      // Check if transaction is recent (within 1 hour) to prevent replay attacks
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 60 * 60; // 1 hour in seconds

      if (tx.blockTime && (currentTime - tx.blockTime) > maxAge) {
        console.log('❌ Transaction too old');
        return { success: false, error: 'Transaction is too old. Must be within 1 hour. Contact support if you need assistance.' };
      }

      // Check if it's a USDC transfer
      const usdcMint = this.solanaUsdcAddress;
      let transferFound = false;
      let actualAmount = 0;
      let actualToAddress = '';

      // Parse transaction for USDC transfers
      if (tx.meta.preTokenBalances && tx.meta.postTokenBalances) {
        for (let i = 0; i < tx.meta.preTokenBalances.length; i++) {
          const preBalance = tx.meta.preTokenBalances[i];
          const postBalance = tx.meta.postTokenBalances[i];
          
          if (preBalance.mint === usdcMint) {
            const preAmount = parseFloat(preBalance.uiTokenAmount.uiAmountString || '0');
            const postAmount = parseFloat(postBalance.uiTokenAmount.uiAmountString || '0');
            const transferAmount = postAmount - preAmount;
            
            if (transferAmount > 0) {
              transferFound = true;
              actualAmount = transferAmount;
              actualToAddress = postBalance.owner;
              break;
            }
          }
        }
      }

      if (!transferFound) {
        console.log('❌ No USDC transfer found');
        return { success: false, error: 'No USDC transfer found in transaction' };
      }

      console.log(`📊 Transaction details:`, {
        to: actualToAddress,
        expectedTo: expectedToAddress,
        amount: actualAmount,
        expectedAmount: expectedAmount
      });

      // Verify recipient address
      if (actualToAddress !== expectedToAddress) {
        console.log('❌ Wrong recipient address');
        return { success: false, error: 'Transaction sent to wrong address' };
      }

      // Verify amount - accept payments >= expected amount (users might send round numbers)
      if (actualAmount < expectedAmount) {
        console.log('❌ Insufficient amount');
        return { success: false, error: `Insufficient amount. Expected at least ${expectedAmount} USDC, got ${actualAmount} USDC` };
      }

      console.log('✅ Solana transaction verified successfully');
      return { 
        success: true, 
        amount: actualAmount,
        toAddress: actualToAddress,
        slot: tx.slot,
        blockTime: tx.blockTime
      };
    } catch (error) {
      console.error('Error verifying Solana transaction:', error);
      return { success: false, error: 'Failed to verify transaction' };
    }
  }

  // Update payment status in database
  async updatePaymentStatus(paymentId, status, txHash = null) {
    try {
      console.log(`📝 Updating payment status: ${paymentId} -> ${status}`);
      
      // TODO: Implement database update for payment status
      // This would update a payments table with the new status and transaction hash
      
      console.log(`✅ Payment status updated: ${paymentId} -> ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  // Get plan name from plan type
  getPlanName(planType) {
    const planNames = {
      'pro': 'Pro Plan',
      'premium': 'Premium Plan',
      'enterprise': 'Enterprise Plan',
      'free': 'Free Plan'
    };
    return planNames[planType] || 'Pro Plan';
  }

  // Activate subscription for a specific user and payment
  async activateSubscription(userId, paymentId) {
    try {
      console.log(`🎯 Activating subscription for user ${userId}, payment ${paymentId}`);
      
      // Get payment details (this would come from database)
      // For now, we'll use the plan from the payment ID structure
      const paymentParts = paymentId.split('_');
      const planType = paymentParts[1]; // Extract plan from payment ID
      const months = parseInt(paymentParts[2]) || 1;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      // Update user's subscription directly in users table
      await updateUser(userId, {
        subscription_plan: planType,
        subscription_expires_at: endDate
      });

      console.log(`✅ Subscription activated for user ${userId}, plan ${planType}, expires ${endDate}`);
      
      // Send upgrade email (same as Stripe payments)
      try {
        const { getUserById } = require('../database');
        const user = await getUserById(userId);
        if (user && user.email) {
          const EmailService = require('./emailService');
          const emailService = new EmailService();
          
          // Get plan name from plan type
          const planName = this.getPlanName(planType);
          
          const subscriptionDetails = {
            current_period_start: startDate,
            current_period_end: endDate,
            payment_method: 'crypto',
            payment_id: paymentId
          };

          const emailSent = await emailService.sendUpgradeEmail(
            user.email, 
            user.email.split('@')[0], 
            planName, 
            subscriptionDetails
          );
          
          if (emailSent) {
            console.log(`📧 Upgrade email sent to ${user.email} for ${planName} subscription`);
          } else {
            console.log(`⚠️ Failed to send upgrade email to ${user.email}`);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending upgrade email:', emailError);
        // Don't throw the error - subscription activation should still succeed
      }
      
      return true;
    } catch (error) {
      console.error('Error activating subscription:', error);
      return false;
    }
  }
}

module.exports = new WalletPaymentService();
