# Telegram Bot Setup Guide

## Overview
This guide will help you set up the Telegram bot for Crypto Market Watch to send real-time market alerts to users.

## Features Implemented

### ✅ **Bot Functionality**
- Real-time market alerts via Telegram
- User subscription management
- Webhook-based message handling
- Admin dashboard for bot management
- Secure token-based authentication
- Message formatting with emojis and styling

### ✅ **Commands Available**
- `/start` - Start the bot and subscribe to alerts
- `/stop` - Stop the bot and unsubscribe from alerts
- `/subscribe` - Subscribe to alerts
- `/unsubscribe` - Unsubscribe from alerts
- `/status` - Check bot status
- `/info` - Show bot information and statistics
- `/help` - Show help message
- `/set_frequency [high|medium|low]` - Set alert frequency

### ✅ **Admin Features**
- Add/remove chat IDs
- Send test messages
- View subscriber statistics
- Setup webhook automatically
- Monitor bot status

## Setup Instructions

### 1. Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a conversation** with BotFather
3. **Send `/newbot`** command
4. **Choose a name** for your bot (e.g., "Crypto Market Watch")
5. **Choose a username** for your bot (must end with 'bot', e.g., "crypto_market_watch_bot")
6. **Copy the bot token** that BotFather provides

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com
TELEGRAM_CHAT_IDS=optional_comma_separated_chat_ids
```

### 3. Set Up Webhook (Optional)

If you want to use webhooks for real-time message handling:

1. **Deploy your application** to a server with HTTPS
2. **Set the `TELEGRAM_WEBHOOK_URL`** to your domain
3. **Use the admin dashboard** to setup the webhook automatically
4. **Or manually set the webhook** using the Telegram API

### 4. Test the Bot

1. **Start a conversation** with your bot on Telegram
2. **Send `/start`** to subscribe to alerts
3. **Use the admin dashboard** to send test messages
4. **Verify alerts are received** when market conditions trigger

## Admin Dashboard Usage

### Accessing Telegram Management
1. **Log in as admin** to your application
2. **Go to Admin Dashboard**
3. **Click on "Telegram Bot" tab**

### Available Actions

#### **Bot Status**
- View bot connection status
- See active subscriber count
- Check webhook status

#### **Add Chat ID**
- Manually add Telegram chat IDs
- Test chat ID validity
- Send welcome messages

#### **Send Test Messages**
- Send custom test messages
- Verify message delivery
- Test message formatting

#### **Manage Subscribers**
- View all subscribers
- See subscription dates
- Remove subscribers
- View recent activity

#### **Setup Webhook**
- Automatically configure webhook
- Verify webhook status
- Troubleshoot webhook issues

## Message Types

### Alert Messages
The bot sends formatted alert messages for:
- **SSR (Stablecoin Supply Ratio) changes**
- **Bitcoin dominance shifts**
- **Exchange flow movements**
- **Stablecoin market cap changes**
- **Market volatility spikes**
- **Large whale movements**

### Message Format
```
🚨 Market Alert

Type: price_alert
Severity: HIGH

Bitcoin price has moved significantly

Details:
• Metric: BTC Price
• Value: $45,000
• Time: 12/25/2024, 2:30:45 PM

Disclaimer: This is not financial advice. Always do your own research before making investment decisions.

Crypto Market Watch
```

## Security Features

### Token-Based Authentication
- Bot tokens are securely stored in environment variables
- Webhook URLs are validated
- Chat IDs are verified before adding

### User Privacy
- User information is stored locally
- No sensitive data is logged
- Users can unsubscribe at any time

### Rate Limiting
- Built-in rate limiting for API calls
- Error handling for failed requests
- Graceful degradation when services are unavailable

## Troubleshooting

### Common Issues

#### **Bot Not Responding**
1. Check if `TELEGRAM_BOT_TOKEN` is set correctly
2. Verify the bot token is valid
3. Ensure the bot is not blocked by users

#### **Webhook Not Working**
1. Verify `TELEGRAM_WEBHOOK_URL` is set
2. Ensure your domain has HTTPS
3. Check server logs for webhook errors
4. Use the admin dashboard to setup webhook

#### **Messages Not Sending**
1. Check bot permissions
2. Verify chat IDs are correct
3. Ensure users haven't blocked the bot
4. Check server logs for API errors

#### **Admin Dashboard Issues**
1. Verify admin authentication
2. Check API endpoints are accessible
3. Ensure proper CORS configuration
4. Check browser console for errors

### Debug Commands

#### **Test Bot Connection**
```bash
node test-telegram-bot.js
```

#### **Check Bot Status**
```bash
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

#### **Get Webhook Info**
```bash
curl -X GET "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## API Endpoints

### Admin Endpoints (Require Authentication)
- `GET /api/telegram/status` - Get bot status
- `GET /api/telegram/subscribers` - Get subscriber list
- `POST /api/telegram/add-chat` - Add chat ID
- `POST /api/telegram/remove-chat` - Remove chat ID
- `POST /api/telegram/setup-webhook` - Setup webhook
- `POST /api/telegram/test-message` - Send test message

### Webhook Endpoint
- `POST /api/telegram/webhook` - Handle Telegram updates

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Your bot token from BotFather |
| `TELEGRAM_WEBHOOK_URL` | No | Your domain for webhook setup |
| `TELEGRAM_CHAT_IDS` | No | Comma-separated list of initial chat IDs |

## Best Practices

### **Bot Management**
1. **Regular monitoring** of bot status
2. **Backup bot tokens** securely
3. **Monitor subscriber growth**
4. **Test alerts regularly**

### **User Experience**
1. **Clear welcome messages**
2. **Helpful command descriptions**
3. **Easy unsubscribe process**
4. **Professional message formatting**

### **Security**
1. **Keep bot tokens secure**
2. **Validate all inputs**
3. **Monitor for abuse**
4. **Regular security updates**

## Support

If you encounter issues:
1. **Check the troubleshooting section**
2. **Review server logs**
3. **Test with the provided test script**
4. **Contact the development team**

## Future Enhancements

Potential improvements for the future:
- **Message scheduling**
- **Custom alert preferences**
- **Group chat support**
- **Message templates**
- **Analytics dashboard**
- **A/B testing for messages**
- **Multi-language support**
