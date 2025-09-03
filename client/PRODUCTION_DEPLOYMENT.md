# Production Deployment Guide

## Fixing the "localhost" Security Issue

The compiled JavaScript contains hardcoded `http://localhost` URLs which Chrome flags as insecure when served over HTTPS.

## Solution

### 1. Environment Configuration

Create a `.env.production` file in the client directory:

```bash
REACT_APP_API_URL=https://your-production-domain.com
REACT_APP_ENVIRONMENT=production
```

### 2. Build Commands

Use the production build command:

```bash
npm run build:prod
```

Or for Vercel:

```bash
npm run vercel-build
```

### 3. What This Fixes

- ✅ Removes hardcoded localhost URLs from compiled JS
- ✅ Uses environment-based API configuration
- ✅ Maintains development proxy for local development
- ✅ Service worker works in production

### 4. API URL Resolution

- **Development**: Uses proxy (`http://localhost:3001`)
- **Production**: Uses `REACT_APP_API_URL` environment variable
- **Fallback**: Uses relative URLs if no environment variable set

### 5. Deployment Steps

1. Set `REACT_APP_API_URL` to your production backend URL
2. Run `npm run build:prod`
3. Deploy the `build/` folder
4. Ensure your backend is accessible at the configured URL

## Example Production Environment

```bash
# .env.production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENVIRONMENT=production
```

## Troubleshooting

If you still see localhost URLs:
1. Clear browser cache
2. Ensure you're using the production build
3. Check that `.env.production` is properly configured
4. Verify the build process completed successfully
