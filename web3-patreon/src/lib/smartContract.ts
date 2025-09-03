// Smart contract interface and mock implementation for Base network
import { SUPPORTED_TOKENS, TOKEN_METADATA } from './contracts';

export interface SupportTier {
  id: number;
  name: string;
  description: string;
  price: string; // in wei
  isActive: boolean;
  subscriberCount: number;
}

export interface Subscription {
  subscriber: string;
  tierId: number;
  startTime: number;
  nextPaymentTime: number;
  isActive: boolean;
}

export interface CreatorData {
  address: string;
  tiers: SupportTier[];
  totalSupport: string;
  balance: string;
}

// Mock smart contract implementation
class MockCreatorSupport {
  private creators: Map<string, CreatorData> = new Map();
  private subscriptions: Map<string, Map<string, Subscription>> = new Map();

  // Creator functions
  async createTier(
    creatorAddress: string,
    name: string,
    description: string,
    price: string
  ): Promise<void> {
    const creator = this.creators.get(creatorAddress) || {
      address: creatorAddress,
      tiers: [],
      totalSupport: '0',
      balance: '0'
    };

    const tierId = creator.tiers.length;
    creator.tiers.push({
      id: tierId,
      name,
      description,
      price,
      isActive: true,
      subscriberCount: 0
    });

    this.creators.set(creatorAddress, creator);
  }

  async getCreatorTiers(creatorAddress: string): Promise<SupportTier[]> {
    const creator = this.creators.get(creatorAddress);
    return creator?.tiers || [];
  }

  async updateTier(
    creatorAddress: string,
    tierId: number,
    name: string,
    description: string,
    price: string
  ): Promise<void> {
    const creator = this.creators.get(creatorAddress);
    if (!creator || tierId >= creator.tiers.length) {
      throw new Error('Invalid tier ID');
    }

    creator.tiers[tierId] = {
      ...creator.tiers[tierId],
      name,
      description,
      price
    };

    this.creators.set(creatorAddress, creator);
  }

  async toggleTier(creatorAddress: string, tierId: number): Promise<void> {
    const creator = this.creators.get(creatorAddress);
    if (!creator || tierId >= creator.tiers.length) {
      throw new Error('Invalid tier ID');
    }

    creator.tiers[tierId].isActive = !creator.tiers[tierId].isActive;
    this.creators.set(creatorAddress, creator);
  }

  // Supporter functions
  async sendOneTimeSupport(
    creatorAddress: string,
    supporterAddress: string,
    tokenAddress: string,
    amount: string
  ): Promise<void> {
    const creator = this.creators.get(creatorAddress) || {
      address: creatorAddress,
      tiers: [],
      totalSupport: '0',
      balance: '0'
    };

    const supportAmount = BigInt(creator.totalSupport) + BigInt(amount);
    const balanceAmount = BigInt(creator.balance) + BigInt(amount);

    creator.totalSupport = supportAmount.toString();
    creator.balance = balanceAmount.toString();

    this.creators.set(creatorAddress, creator);
  }

  async subscribeToTier(
    creatorAddress: string,
    supporterAddress: string,
    tierId: number,
    tokenAddress: string
  ): Promise<void> {
    const creator = this.creators.get(creatorAddress);
    if (!creator || tierId >= creator.tiers.length) {
      throw new Error('Invalid tier ID');
    }

    const tier = creator.tiers[tierId];
    if (!tier.isActive) {
      throw new Error('Tier is not active');
    }

    // Create subscription
    if (!this.subscriptions.has(creatorAddress)) {
      this.subscriptions.set(creatorAddress, new Map());
    }

    const creatorSubscriptions = this.subscriptions.get(creatorAddress)!;
    creatorSubscriptions.set(supporterAddress, {
      subscriber: supporterAddress,
      tierId,
      startTime: Date.now(),
      nextPaymentTime: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true
    });

    // Update creator data
    const supportAmount = BigInt(creator.totalSupport) + BigInt(tier.price);
    const balanceAmount = BigInt(creator.balance) + BigInt(tier.price);

    creator.totalSupport = supportAmount.toString();
    creator.balance = balanceAmount.toString();
    creator.tiers[tierId].subscriberCount++;

    this.creators.set(creatorAddress, creator);
  }

  async cancelSubscription(creatorAddress: string, supporterAddress: string): Promise<void> {
    const creatorSubscriptions = this.subscriptions.get(creatorAddress);
    if (!creatorSubscriptions) return;

    const subscription = creatorSubscriptions.get(supporterAddress);
    if (!subscription) return;

    subscription.isActive = false;

    // Update creator data
    const creator = this.creators.get(creatorAddress);
    if (creator && subscription.tierId < creator.tiers.length) {
      creator.tiers[subscription.tierId].subscriberCount--;
      this.creators.set(creatorAddress, creator);
    }
  }

  async getSubscription(creatorAddress: string, supporterAddress: string): Promise<Subscription | null> {
    const creatorSubscriptions = this.subscriptions.get(creatorAddress);
    if (!creatorSubscriptions) return null;

    return creatorSubscriptions.get(supporterAddress) || null;
  }

  async getCreatorBalance(creatorAddress: string): Promise<string> {
    const creator = this.creators.get(creatorAddress);
    return creator?.balance || '0';
  }

  async getTotalSupportReceived(creatorAddress: string): Promise<string> {
    const creator = this.creators.get(creatorAddress);
    return creator?.totalSupport || '0';
  }

  // Utility functions
  formatTokenAmount(amount: string, tokenAddress: string): string {
    const token = TOKEN_METADATA[tokenAddress as keyof typeof TOKEN_METADATA];
    if (!token) return amount;

    const decimals = token.decimals;
    const divisor = BigInt(10 ** decimals);
    const wholePart = BigInt(amount) / divisor;
    const fractionalPart = BigInt(amount) % divisor;

    if (fractionalPart === 0n) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
  }

  parseTokenAmount(amount: string, tokenAddress: string): string {
    const token = TOKEN_METADATA[tokenAddress as keyof typeof TOKEN_METADATA];
    if (!token) return amount;

    const decimals = token.decimals;
    const [wholePart, fractionalPart = ''] = amount.split('.');
    
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    const result = wholePart + paddedFractional;
    
    return result;
  }
}

// Export singleton instance
export const mockCreatorSupport = new MockCreatorSupport();

// Export types and utilities
export { SUPPORTED_TOKENS, TOKEN_METADATA };