# Brevo Email Integration Setup

This guide will help you set up Brevo (formerly Sendinblue) email service for the Crypto Market Monitor application.

## What is Brevo?

Brevo is a comprehensive email marketing and transactional email service that provides:
- High deliverability rates
- Transactional email API
- Email templates
- Analytics and tracking
- SMTP and API options

## Setup Steps

### 1. Create a Brevo Account

1. Go to [Brevo's website](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Brevo dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create a new API key**
4. Give it a name (e.g., "Crypto Market Monitor")
5. Select **Full Access** or **Restricted Access** with email permissions
6. Copy the generated API key

### 3. Configure Sender Email

1. Go to **Settings** → **Senders & IP**
2. Click **Add a new sender**
3. Enter your domain email (e.g., `noreply@yourdomain.com`)
4. Verify your domain by following the DNS setup instructions
5. Wait for verification (usually takes a few minutes)

### 4. Environment Variables

Add these variables to your `.env` file:

```bash
# Brevo Email Service Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

### 5. Test the Integration

Run the test script to verify everything is working:

```bash
# Test configuration and connection
npm run test:brevo

# Test with actual email sending
npm run test:brevo your@email.com
```

## Email Types Supported

The application sends the following types of emails through Brevo:

### 1. Email Confirmation
- **Trigger**: User registration
- **Purpose**: Verify email address
- **Template**: Professional confirmation email with verification link

### 2. Welcome Email
- **Trigger**: Email confirmation
- **Purpose**: Welcome new users and explain features
- **Template**: Feature overview with call-to-action

### 3. Password Reset
- **Trigger**: User requests password reset
- **Purpose**: Secure password reset process
- **Template**: Reset link with security notice

### 4. Market Alerts
- **Trigger**: Custom alert conditions
- **Purpose**: Notify users of market events
- **Template**: Alert details with severity indicators

### 5. Bulk Notifications
- **Trigger**: System-wide alerts
- **Purpose**: Mass notifications to subscribers
- **Template**: Scalable alert system

## API Endpoints

### Email Testing (Admin Only)
```bash
POST /api/admin/test-email
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "email": "test@example.com",
  "type": "test|welcome|alert"
}
```

### Password Reset
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "new-password"
}
```

## Email Templates

All emails use responsive HTML templates with:
- Professional styling
- Mobile-friendly design
- Clear call-to-action buttons
- Security disclaimers
- Branding elements

### Template Features
- **Responsive Design**: Works on all devices
- **Professional Styling**: Clean, modern appearance
- **Security**: Proper token handling and expiration
- **Accessibility**: Alt text and semantic HTML
- **Branding**: Consistent with application theme

## Troubleshooting

### Common Issues

1. **"Brevo email service not configured"**
   - Check that `BREVO_API_KEY` is set in your `.env` file
   - Verify the API key is correct and active

2. **"Failed to send email"**
   - Check your sender email is verified in Brevo
   - Ensure your domain DNS is properly configured
   - Check Brevo dashboard for any account issues

3. **"Invalid API key"**
   - Regenerate your API key in Brevo dashboard
   - Ensure you have the correct permissions

4. **"Sender not verified"**
   - Complete domain verification in Brevo
   - Wait for DNS propagation (can take up to 24 hours)

### Testing Steps

1. **Configuration Test**
   ```bash
   npm run test:brevo
   ```

2. **Connection Test**
   - Check Brevo dashboard for API usage
   - Verify sender email status

3. **Email Delivery Test**
   ```bash
   npm run test:brevo your@email.com
   ```

4. **Production Test**
   - Register a new user account
   - Check email delivery and confirmation flow

## Security Considerations

- API keys are stored securely in environment variables
- Email tokens have expiration times (24h for confirmation, 1h for reset)
- All emails include security disclaimers
- Password reset tokens are single-use
- Email addresses are validated before sending

## Monitoring

Monitor your email service through:
- Brevo dashboard analytics
- Application logs
- Email delivery reports
- User feedback

## Cost Considerations

Brevo offers:
- **Free Tier**: 300 emails/day
- **Paid Plans**: Starting at $25/month for 20,000 emails
- **Enterprise**: Custom pricing for high volume

For most applications, the free tier is sufficient for development and small-scale production use.

## Migration from Nodemailer

If you're migrating from the previous nodemailer setup:

1. The new Brevo service maintains the same API interface
2. No changes needed to existing code
3. Better deliverability and analytics
4. More reliable email delivery
5. Professional email templates

## Support

For Brevo-specific issues:
- [Brevo Documentation](https://developers.brevo.com/)
- [Brevo Support](https://www.brevo.com/support/)

For application-specific issues:
- Check application logs
- Review environment configuration
- Test with the provided test scripts
