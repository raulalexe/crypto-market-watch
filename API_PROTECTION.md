# API Protection System

## Overview

The API protection system automatically routes requests to the appropriate authentication method:

- **Frontend requests** (from the web app) → JWT authentication
- **API requests** (external) → API key authentication (Pro users only)

## How It Works

### Request Detection

The system identifies request types based on headers:

**Frontend Request Indicators:**
- `Origin` header matches allowed frontend domains
- `Referer` header matches allowed frontend domains  
- `User-Agent` contains browser identifiers (Mozilla, Chrome, Firefox, Safari, Edge)
- No `X-API-Key` or `Authorization: Bearer` headers

**API Request Indicators:**
- Has `X-API-Key` header
- Has `Authorization: Bearer <token>` header
- No browser-like headers

### Authentication Methods

#### Frontend Requests
- Uses existing JWT authentication (`authenticateToken` middleware)
- Allows optional authentication for public endpoints
- No subscription requirements for basic features

#### API Requests  
- Requires valid API key in `X-API-Key` or `Authorization: Bearer` header
- User must have Pro, Premium, or Admin subscription
- API key usage is tracked and logged
- Rate limiting applies based on subscription tier

## Protected Endpoints

The following endpoints now use API protection:

- `/api/market-data` - Market data summary
- `/api/analysis` - AI analysis results  
- `/api/crypto-prices` - Cryptocurrency prices
- `/api/advanced-metrics` - Advanced market metrics
- `/api/fear-greed` - Fear & Greed Index
- `/api/layer1-data` - Layer 1 blockchain data
- `/api/trending-narratives` - Market narratives
- `/api/crypto-news` - Crypto news events (optional auth)
- `/api/dashboard` - Dashboard data (optional auth)

## API Key Management

### For Users
1. Log in to the web app
2. Go to Settings → API Keys
3. Create a new API key (Pro subscription required)
4. Use the API key in requests:
   ```bash
   curl -H "X-API-Key: your-api-key" https://api.example.com/api/market-data
   ```

### For Developers
```javascript
// Using X-API-Key header
const response = await fetch('/api/market-data', {
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

// Using Authorization header
const response = await fetch('/api/market-data', {
  headers: {
    'Authorization': 'Bearer your-api-key'
  }
});
```

## Error Responses

### No API Key
```json
{
  "error": "API key required",
  "message": "Please provide an API key in the X-API-Key header or Authorization header",
  "code": "API_KEY_REQUIRED"
}
```

### Invalid API Key
```json
{
  "error": "Invalid API key", 
  "message": "The provided API key is invalid or inactive",
  "code": "INVALID_API_KEY"
}
```

### Insufficient Subscription
```json
{
  "error": "Insufficient subscription",
  "message": "API access requires a Pro, Premium, or Admin subscription", 
  "code": "SUBSCRIPTION_REQUIRED",
  "required_plan": "pro"
}
```

## Testing

Run the test script to verify API protection:

```bash
node scripts/test-api-protection.js
```

## Benefits

1. **Automatic Detection** - No manual configuration needed
2. **Frontend Compatibility** - Existing web app continues to work
3. **API Security** - External API access requires Pro subscription
4. **Rate Limiting** - Prevents abuse of API endpoints
5. **Usage Tracking** - Monitor API key usage and performance

## Migration Notes

- Existing frontend requests continue to work unchanged
- New API endpoints require Pro subscription and API key
- No breaking changes for current users
- Gradual rollout possible by endpoint
