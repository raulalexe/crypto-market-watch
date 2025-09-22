# JWT Security Implementation Guide

## 🚨 Critical Security Requirements

### JWT Secret Management
- **JWT_SECRET is REQUIRED** - The application will fail to start if not provided
- **No fallback secrets** - Never use hardcoded or default secrets
- **Unique per environment** - Use different secrets for dev/staging/production
- **Strong secrets only** - Use cryptographically secure random strings

## 🔐 Implementation Details

### Server-Side Security
- **Startup validation**: Application exits if JWT_SECRET is not set
- **Consistent usage**: All JWT operations use the same secret
- **No fallbacks**: Removed all hardcoded fallback secrets
- **Fixed expiration times**: Login tokens (24h), Password reset tokens (1h)

### Files Modified
- `server/index.js` - Added JWT_SECRET validation at startup
- `server/middleware/auth.js` - Removed fallback secrets, added validation
- `server/services/websocketService.js` - Removed fallback secrets
- `server/database.js` - Removed fallback secrets

## 🛠️ Setup Instructions

### 1. Generate a Secure JWT Secret
```bash
# Use the provided script
node scripts/generate-jwt-secret.js

# Or generate manually
openssl rand -base64 64
```

### 2. Set Environment Variable
```bash
# Local development
export JWT_SECRET="your-generated-secret-here"

# Railway deployment
# Add JWT_SECRET in Railway dashboard environment variables
```

### 3. Verify Setup
The application will show an error and exit if JWT_SECRET is not properly set:
```
❌ CRITICAL ERROR: JWT_SECRET environment variable is required
   Please set JWT_SECRET in your environment variables
   This is required for secure JWT token generation and verification
```

## 🔒 Security Best Practices

### Current JWT Expiration Settings
- ✅ **Login tokens**: 24 hours (reasonable for user sessions)
- ✅ **Password reset tokens**: 1 hour (appropriate for security)
- ✅ **No environment variables needed** - expiration times are hardcoded

### Production Deployment
1. **Generate unique secret** for production environment
2. **Store securely** in environment variables or secret management
3. **Never commit** JWT secrets to version control
4. **Rotate regularly** (recommended: every 90 days)
5. **Monitor access** to JWT secrets

### Development
1. **Use different secret** than production
2. **Store in .env.local** (not committed to git)
3. **Document in team** how to generate new secrets

## 🚨 Security Warnings

### What NOT to do:
- ❌ Use hardcoded secrets like "your-secret-key"
- ❌ Use the same secret across environments
- ❌ Commit JWT secrets to version control
- ❌ Use weak or predictable secrets
- ❌ Share JWT secrets in plain text

### What TO do:
- ✅ Generate cryptographically secure random secrets
- ✅ Use different secrets per environment
- ✅ Store in secure environment variable management
- ✅ Rotate secrets regularly
- ✅ Monitor for unauthorized access

## 🔧 Troubleshooting

### Application won't start
```
Error: JWT_SECRET environment variable is required
```
**Solution**: Set JWT_SECRET environment variable

### Token verification fails
```
Error: jwt expired
```
**Solution**: Check that JWT_SECRET is the same across all services

### Inconsistent authentication
**Solution**: Ensure all JWT operations use the same secret (no fallbacks)

## 📋 Deployment Checklist

- [ ] JWT_SECRET is set in Railway environment variables
- [ ] JWT_SECRET is different from development
- [ ] JWT_SECRET is strong and random (64+ characters)
- [ ] No hardcoded fallback secrets in code
- [ ] Application starts without JWT_SECRET errors
- [ ] Authentication works consistently
- [ ] WebSocket authentication works
- [ ] API authentication works

## 🎯 Production Readiness

This implementation ensures:
- ✅ **No security vulnerabilities** from fallback secrets
- ✅ **Consistent JWT handling** across all services
- ✅ **Fail-fast behavior** if secrets are missing
- ✅ **Production-ready security** standards
- ✅ **Clear error messages** for debugging
