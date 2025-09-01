// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CreatorSupport is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Structs
    struct SupportTier {
        uint256 id;
        string name;
        string description;
        uint256 price; // in wei (for stablecoins with 18 decimals)
        bool isActive;
        uint256 subscriberCount;
    }

    struct Subscription {
        address subscriber;
        uint256 tierId;
        uint256 startTime;
        uint256 nextPaymentTime;
        bool isActive;
    }

    // State variables
    mapping(address => SupportTier[]) public creatorTiers;
    mapping(address => mapping(address => Subscription)) public subscriptions;
    mapping(address => uint256) public creatorBalances;
    mapping(address => uint256) public totalSupportReceived;
    
    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokenList;
    
    // Events
    event TierCreated(address indexed creator, uint256 tierId, string name, uint256 price);
    event TierUpdated(address indexed creator, uint256 tierId, string name, uint256 price);
    event OneTimeSupport(address indexed creator, address indexed supporter, address token, uint256 amount);
    event SubscriptionCreated(address indexed creator, address indexed supporter, uint256 tierId);
    event SubscriptionCancelled(address indexed creator, address indexed supporter);
    event PaymentProcessed(address indexed creator, address indexed supporter, uint256 amount);
    event Withdrawal(address indexed creator, address token, uint256 amount);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    constructor() {
        // Add common stablecoins on Polygon
        // USDC (0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174)
        // DAI (0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063)
        // USDT (0xc2132D05D31c914a87C6611C10748AEb04B58e8F)
    }

    // Modifiers
    modifier onlyCreator(address creator) {
        require(creatorTiers[creator].length > 0, "Creator has no tiers");
        _;
    }

    modifier validTier(address creator, uint256 tierId) {
        require(tierId < creatorTiers[creator].length, "Invalid tier ID");
        require(creatorTiers[creator][tierId].isActive, "Tier is not active");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    // Owner functions
    function addSupportedToken(address token) external onlyOwner {
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        supportedTokenList.push(token);
        emit TokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        
        // Remove from array
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == token) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }
        emit TokenRemoved(token);
    }

    // Creator functions
    function createTier(
        string memory name,
        string memory description,
        uint256 price
    ) external {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(price > 0, "Price must be greater than 0");
        
        uint256 tierId = creatorTiers[msg.sender].length;
        creatorTiers[msg.sender].push(SupportTier({
            id: tierId,
            name: name,
            description: description,
            price: price,
            isActive: true,
            subscriberCount: 0
        }));
        
        emit TierCreated(msg.sender, tierId, name, price);
    }

    function updateTier(
        uint256 tierId,
        string memory name,
        string memory description,
        uint256 price
    ) external onlyCreator(msg.sender) {
        require(tierId < creatorTiers[msg.sender].length, "Invalid tier ID");
        require(price > 0, "Price must be greater than 0");
        
        SupportTier storage tier = creatorTiers[msg.sender][tierId];
        tier.name = name;
        tier.description = description;
        tier.price = price;
        
        emit TierUpdated(msg.sender, tierId, name, price);
    }

    function toggleTier(uint256 tierId) external onlyCreator(msg.sender) {
        require(tierId < creatorTiers[msg.sender].length, "Invalid tier ID");
        creatorTiers[msg.sender][tierId].isActive = !creatorTiers[msg.sender][tierId].isActive;
    }

    // Supporter functions
    function sendOneTimeSupport(
        address creator,
        address token,
        uint256 amount
    ) external nonReentrant validToken(token) {
        require(amount > 0, "Amount must be greater than 0");
        require(creator != msg.sender, "Cannot support yourself");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        creatorBalances[creator] += amount;
        totalSupportReceived[creator] += amount;
        
        emit OneTimeSupport(creator, msg.sender, token, amount);
    }

    function subscribeToTier(
        address creator,
        uint256 tierId,
        address token
    ) external nonReentrant validToken(token) validTier(creator, tierId) {
        require(creator != msg.sender, "Cannot subscribe to yourself");
        require(!subscriptions[creator][msg.sender].isActive, "Already subscribed");
        
        SupportTier memory tier = creatorTiers[creator][tierId];
        
        // Transfer first payment
        IERC20(token).safeTransferFrom(msg.sender, address(this), tier.price);
        
        // Create subscription
        subscriptions[creator][msg.sender] = Subscription({
            subscriber: msg.sender,
            tierId: tierId,
            startTime: block.timestamp,
            nextPaymentTime: block.timestamp + 30 days, // Monthly subscription
            isActive: true
        });
        
        creatorBalances[creator] += tier.price;
        totalSupportReceived[creator] += tier.price;
        creatorTiers[creator][tierId].subscriberCount++;
        
        emit SubscriptionCreated(creator, msg.sender, tierId);
        emit PaymentProcessed(creator, msg.sender, tier.price);
    }

    function cancelSubscription(address creator) external {
        require(subscriptions[creator][msg.sender].isActive, "No active subscription");
        
        Subscription storage subscription = subscriptions[creator][msg.sender];
        subscription.isActive = false;
        
        creatorTiers[creator][subscription.tierId].subscriberCount--;
        
        emit SubscriptionCancelled(creator, msg.sender);
    }

    function processSubscriptionPayment(address creator, address supporter) external {
        Subscription storage subscription = subscriptions[creator][supporter];
        require(subscription.isActive, "Subscription not active");
        require(block.timestamp >= subscription.nextPaymentTime, "Payment not due yet");
        
        SupportTier memory tier = creatorTiers[creator][subscription.tierId];
        require(tier.isActive, "Tier no longer active");
        
        // This would typically be called by a keeper/automation service
        // For now, we'll allow manual processing
        subscription.nextPaymentTime += 30 days;
        
        // In a real implementation, you'd transfer the payment here
        // For demo purposes, we'll just emit the event
        emit PaymentProcessed(creator, supporter, tier.price);
    }

    // Creator withdrawal
    function withdraw(address token, uint256 amount) external nonReentrant validToken(token) {
        require(amount <= creatorBalances[msg.sender], "Insufficient balance");
        
        creatorBalances[msg.sender] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount);
    }

    // View functions
    function getCreatorTiers(address creator) external view returns (SupportTier[] memory) {
        return creatorTiers[creator];
    }

    function getSubscription(address creator, address supporter) external view returns (Subscription memory) {
        return subscriptions[creator][supporter];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }

    function getCreatorBalance(address creator, address token) external view returns (uint256) {
        return creatorBalances[creator];
    }
}