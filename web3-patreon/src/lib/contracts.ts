// Contract ABI for CreatorSupport
export const CREATOR_SUPPORT_ABI = [
  // Events
  "event TierCreated(address indexed creator, uint256 tierId, string name, uint256 price)",
  "event TierUpdated(address indexed creator, uint256 tierId, string name, uint256 price)",
  "event OneTimeSupport(address indexed creator, address indexed supporter, address token, uint256 amount)",
  "event SubscriptionCreated(address indexed creator, address indexed supporter, uint256 tierId)",
  "event SubscriptionCancelled(address indexed creator, address indexed supporter)",
  "event PaymentProcessed(address indexed creator, address indexed supporter, uint256 amount)",
  "event Withdrawal(address indexed creator, address token, uint256 amount)",
  "event TokenAdded(address indexed token)",
  "event TokenRemoved(address indexed token)",

  // View functions
  "function creatorTiers(address creator, uint256 index) view returns (uint256 id, string name, string description, uint256 price, bool isActive, uint256 subscriberCount)",
  "function subscriptions(address creator, address supporter) view returns (address subscriber, uint256 tierId, uint256 startTime, uint256 nextPaymentTime, bool isActive)",
  "function creatorBalances(address creator) view returns (uint256)",
  "function totalSupportReceived(address creator) view returns (uint256)",
  "function supportedTokens(address token) view returns (bool)",
  "function getCreatorTiers(address creator) view returns (tuple(uint256 id, string name, string description, uint256 price, bool isActive, uint256 subscriberCount)[])",
  "function getSubscription(address creator, address supporter) view returns (tuple(address subscriber, uint256 tierId, uint256 startTime, uint256 nextPaymentTime, bool isActive))",
  "function getSupportedTokens() view returns (address[])",
  "function getCreatorBalance(address creator, address token) view returns (uint256)",

  // Write functions
  "function createTier(string name, string description, uint256 price)",
  "function updateTier(uint256 tierId, string name, string description, uint256 price)",
  "function toggleTier(uint256 tierId)",
  "function sendOneTimeSupport(address creator, address token, uint256 amount)",
  "function subscribeToTier(address creator, uint256 tierId, address token)",
  "function cancelSubscription(address creator)",
  "function processSubscriptionPayment(address creator, address supporter)",
  "function withdraw(address token, uint256 amount)",
  "function addSupportedToken(address token)",
  "function removeSupportedToken(address token)"
] as const;

// Contract address (will be set after deployment)
export const CREATOR_SUPPORT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

// Supported stablecoin addresses on Base
export const SUPPORTED_TOKENS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI on Base
  USDT: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Using USDC for now
} as const;

// Token metadata
export const TOKEN_METADATA = {
  [SUPPORTED_TOKENS.USDC]: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
  },
  [SUPPORTED_TOKENS.DAI]: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png"
  },
  [SUPPORTED_TOKENS.USDT]: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png"
  }
} as const;

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
] as const;