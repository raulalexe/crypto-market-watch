const axios = require('axios');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    this.isConfigured = false;
    this.chatIds = new Set();
    this.subscribers = new Map(); // Store user info with chat IDs
    
    // Rate limiting and webhook state management
    this.lastWebhookSetup = 0;
    this.webhookSetupCooldown = 60000; // 1 minute cooldown
    this.webhookSetupAttempted = false; // Prevent multiple automatic setups
    
    this.initBot();
  }

  initBot() {
    if (!this.botToken) {
      console.log('⚠️ Telegram bot not configured - missing TELEGRAM_BOT_TOKEN');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    console.log('✅ Telegram bot service configured successfully');
    
    // Load existing chat IDs from environment or database
    if (process.env.TELEGRAM_CHAT_IDS) {
      const chatIds = process.env.TELEGRAM_CHAT_IDS.split(',').map(id => id.trim());
      chatIds.forEach(id => this.chatIds.add(id));
      console.log(`📱 Loaded ${this.chatIds.size} Telegram chat IDs`);
    }

    // Note: Webhook setup is now handled explicitly by the server startup
    // to prevent multiple automatic setup attempts
  }

  async setupWebhook() {
    if (!this.isConfigured || !this.webhookUrl) {
      return;
    }

    // Check if webhook setup has already been attempted
    if (this.webhookSetupAttempted) {
      console.log('ℹ️ Telegram webhook setup already attempted, skipping...');
      return;
    }

    // Check rate limiting
    const now = Date.now();
    if (now - this.lastWebhookSetup < this.webhookSetupCooldown) {
      console.log('⏳ Telegram webhook setup rate limited, skipping...');
      return;
    }

    try {
      console.log('🔗 Setting up Telegram webhook...');
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/setWebhook`,
        {
          url: `${this.webhookUrl}/api/telegram/webhook`,
          allowed_updates: ['message', 'callback_query']
        },
        {
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.ok) {
        console.log('✅ Telegram webhook set successfully');
        this.lastWebhookSetup = now;
        this.webhookSetupAttempted = true; // Mark as attempted
      } else {
        console.log('⚠️ Failed to set Telegram webhook:', response.data.description);
        this.webhookSetupAttempted = true; // Mark as attempted even on failure
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log('⏳ Telegram webhook setup rate limited, will retry later');
        this.lastWebhookSetup = now; // Update timestamp to respect rate limit
        this.webhookSetupAttempted = true; // Mark as attempted even on rate limit
      } else {
        console.error('❌ Error setting Telegram webhook:', error.message);
        this.webhookSetupAttempted = true; // Mark as attempted even on error
      }
    }
  }

  async sendAlertMessage(chatId, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Telegram bot not configured, skipping message send');
      return false;
    }

    try {
      const severityEmoji = this.getSeverityEmoji(alert.severity);
      const alertType = alert.type.replace(/_/g, ' ');
      const timestamp = new Date(alert.timestamp).toLocaleString();
      
      const message = this.formatAlertMessage(alert, severityEmoji, alertType, timestamp);
      
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      );

      if (response.data.ok) {
        console.log(`✅ Telegram alert sent to chat ${chatId}`);
        return true;
      } else {
        console.error('❌ Telegram API error:', response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending Telegram message:', error.message);
      return false;
    }
  }

  async sendBulkAlertMessages(alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Telegram bot not configured, skipping bulk message send');
      return { sent: 0, failed: 0 };
    }

    const results = { sent: 0, failed: 0 };

    for (const chatId of this.chatIds) {
      const success = await this.sendAlertMessage(chatId, alert);
      if (success) {
        results.sent++;
      } else {
        results.failed++;
      }
    }

    console.log(`📱 Telegram bulk results: ${results.sent} sent, ${results.failed} failed`);
    return results;
  }

  formatAlertMessage(alert, severityEmoji, alertType, timestamp) {
    const severityColor = this.getSeverityColor(alert.severity);
    
    return `
<b>${severityEmoji} Market Alert</b>

<b>Type:</b> ${alertType}
<b>Severity:</b> ${alert.severity.toUpperCase()}

${alert.message}

<b>Details:</b>
• Metric: ${alert.metric}
${alert.value ? `• Value: ${alert.value}` : ''}
• Time: ${timestamp}

<i>Disclaimer: This is not financial advice. Always do your own research before making investment decisions.</i>

<code>Crypto Market Monitor</code>
    `.trim();
  }

  getSeverityEmoji(severity) {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  }

  // Reset webhook setup flag to allow manual setup
  resetWebhookSetupFlag() {
    this.webhookSetupAttempted = false;
    console.log('🔄 Telegram webhook setup flag reset');
  }

  async addChatId(chatId) {
    if (!this.isConfigured) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      // Test the chat ID by sending a test message
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: '✅ Crypto Market Monitor bot is now active! You will receive market alerts here.',
          parse_mode: 'HTML'
        }
      );

      if (response.data.ok) {
        this.chatIds.add(chatId);
        console.log(`✅ Added Telegram chat ID: ${chatId}`);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid chat ID or bot not authorized' };
      }
    } catch (error) {
      console.error('❌ Error adding Telegram chat ID:', error.message);
      return { success: false, error: error.message };
    }
  }

  async removeChatId(chatId) {
    this.chatIds.delete(chatId);
    console.log(`✅ Removed Telegram chat ID: ${chatId}`);
    return { success: true };
  }

  getChatIds() {
    return Array.from(this.chatIds);
  }

  getSubscribers() {
    return Array.from(this.subscribers.values());
  }

  getActiveSubscribers() {
    return Array.from(this.subscribers.values()).filter(sub => sub.subscribed);
  }

  getSubscriberStats() {
    const subscribers = this.getSubscribers();
    const activeSubscribers = this.getActiveSubscribers();
    
    return {
      total: subscribers.length,
      active: activeSubscribers.length,
      inactive: subscribers.length - activeSubscribers.length,
      recentSubscribers: subscribers
        .filter(sub => sub.subscribedAt)
        .sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt))
        .slice(0, 5)
    };
  }

  async getBotInfo() {
    if (!this.isConfigured) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getMe`
      );

      if (response.data.ok) {
        return {
          success: true,
          bot: response.data.result,
          chatCount: this.chatIds.size
        };
      } else {
        return { success: false, error: 'Failed to get bot info' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const botInfo = await this.getBotInfo();
      const webhookInfo = await this.getWebhookInfo();
      
      if (botInfo.success) {
        return { 
          success: true, 
          botName: botInfo.bot.first_name,
          chatCount: botInfo.chatCount,
          webhookSet: Boolean(webhookInfo.success && webhookInfo.webhook && webhookInfo.webhook.url),
          webhookUrl: webhookInfo.webhook ? webhookInfo.webhook.url : null
        };
      } else {
        return botInfo;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getWebhookInfo() {
    if (!this.isConfigured) {
      return { success: false, error: 'Telegram bot not configured' };
    }

    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`);
      return { success: true, webhook: response.data.result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Webhook handler for Telegram updates
  async handleWebhook(update) {
    if (!this.isConfigured) {
      return;
    }

    try {
      if (update.message) {
        const { chat, text, from } = update.message;
        
        if (text === '/start') {
          await this.handleStartCommand(chat, from);
        } else if (text === '/stop') {
          await this.handleStopCommand(chat);
        } else if (text === '/status') {
          await this.sendStatusMessage(chat.id);
        } else if (text === '/help') {
          await this.sendHelpMessage(chat.id);
        } else if (text === '/subscribe') {
          await this.handleSubscribeCommand(chat, from);
        } else if (text === '/unsubscribe') {
          await this.handleUnsubscribeCommand(chat);
        } else if (text === '/info') {
          await this.sendInfoMessage(chat.id);
        } else if (text.startsWith('/set_')) {
          await this.handleSettingsCommand(chat, text);
        } else if (text.startsWith('/verify ')) {
          await this.handleVerifyCommand(chat, text);
        } else {
          await this.sendUnknownCommandMessage(chat.id);
        }
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('❌ Error handling Telegram webhook:', error);
    }
  }

  async handleStartCommand(chat, from) {
    const chatId = chat.id.toString();
    const userInfo = {
      id: from.id,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      chatId: chatId,
      subscribed: false, // Don't auto-subscribe anymore
      subscribedAt: null
    };

    this.subscribers.set(chatId, userInfo);

    await this.sendWelcomeMessage(chatId);
    console.log(`👋 New Telegram user: ${from.first_name} (${chatId}) - needs verification`);
  }

  async handleVerifyCommand(chat, text) {
    const chatId = chat.id.toString();
    const code = text.replace('/verify ', '').trim();
    
    if (!code) {
      await this.sendMessage(chatId, '❌ Please provide a verification code.\n\nUsage: /verify YOUR_CODE');
      return;
    }
    
    try {
      const { verifyTelegramCode } = require('../database');
      const result = await verifyTelegramCode(code, chatId);
      
      if (result.success) {
        // Update local subscriber info
        const userInfo = this.subscribers.get(chatId) || {};
        userInfo.subscribed = true;
        userInfo.subscribedAt = new Date().toISOString();
        this.subscribers.set(chatId, userInfo);
        this.chatIds.add(chatId);
        
        await this.sendMessage(chatId, 
          '✅ <b>Verification Successful!</b>\n\n' +
          'Your Telegram account has been linked to your Crypto Market Monitor account.\n' +
          'You will now receive market alerts and notifications.\n\n' +
          'Use /help to see available commands.'
        );
        console.log(`✅ Telegram verification successful for chat ID: ${chatId}, user ID: ${result.userId}`);
      } else {
        await this.sendMessage(chatId, 
          `❌ <b>Verification Failed</b>\n\n${result.error}\n\n` +
          'Please make sure you entered the correct verification code from your account settings.'
        );
        console.log(`❌ Telegram verification failed for chat ID: ${chatId}, error: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error verifying Telegram code:', error);
      await this.sendMessage(chatId, '❌ An error occurred during verification. Please try again later.');
    }
  }

  async handleStopCommand(chat) {
    const chatId = chat.id.toString();
    await this.removeChatId(chatId);
    this.subscribers.delete(chatId);
    await this.sendMessage(chatId, '❌ You have been unsubscribed from market alerts.');
    console.log(`❌ Telegram unsubscriber: ${chatId}`);
  }

  async handleSubscribeCommand(chat, from) {
    const chatId = chat.id.toString();
    const userInfo = this.subscribers.get(chatId) || {
      id: from.id,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      chatId: chatId,
      subscribed: true,
      subscribedAt: new Date().toISOString()
    };

    userInfo.subscribed = true;
    userInfo.subscribedAt = new Date().toISOString();
    this.subscribers.set(chatId, userInfo);
    this.chatIds.add(chatId);

    await this.sendMessage(chatId, '✅ You have been subscribed to market alerts!');
  }

  async handleUnsubscribeCommand(chat) {
    const chatId = chat.id.toString();
    const userInfo = this.subscribers.get(chatId);
    if (userInfo) {
      userInfo.subscribed = false;
      userInfo.unsubscribedAt = new Date().toISOString();
    }
    this.chatIds.delete(chatId);

    await this.sendMessage(chatId, '❌ You have been unsubscribed from market alerts.');
  }

  async handleSettingsCommand(chat, text) {
    const chatId = chat.id.toString();
    const userInfo = this.subscribers.get(chatId);
    
    if (!userInfo) {
      await this.sendMessage(chatId, '❌ You need to start the bot first with /start');
      return;
    }

    // Parse settings command
    const parts = text.split(' ');
    if (parts.length < 2) {
      await this.sendMessage(chatId, '❌ Invalid settings command. Use /help for available commands.');
      return;
    }

    const setting = parts[1];
    const value = parts[2];

    switch (setting) {
      case 'frequency':
        if (value === 'high' || value === 'medium' || value === 'low') {
          userInfo.alertFrequency = value;
          await this.sendMessage(chatId, `✅ Alert frequency set to: ${value}`);
        } else {
          await this.sendMessage(chatId, '❌ Invalid frequency. Use: high, medium, or low');
        }
        break;
      default:
        await this.sendMessage(chatId, '❌ Unknown setting. Use /help for available commands.');
    }
  }

  async handleCallbackQuery(callbackQuery) {
    const { data, message } = callbackQuery;
    const chatId = message.chat.id.toString();

    try {
      if (data === 'subscribe') {
        await this.handleSubscribeCommand(message.chat, callbackQuery.from);
      } else if (data === 'unsubscribe') {
        await this.handleUnsubscribeCommand(message.chat);
      } else if (data === 'help') {
        await this.sendHelpMessage(chatId);
      } else if (data === 'status') {
        await this.sendStatusMessage(chatId);
      }

      // Answer callback query
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`,
        {
          callback_query_id: callbackQuery.id
        }
      );
    } catch (error) {
      console.error('❌ Error handling callback query:', error);
    }
  }

  async sendUnknownCommandMessage(chatId) {
    const message = `
❓ Unknown command

Use these commands:
/start - Start the bot
/help - Show help
/status - Check status
/subscribe - Subscribe to alerts
/unsubscribe - Unsubscribe from alerts
/stop - Stop the bot
/info - Show bot information
    `.trim();

    await this.sendMessage(chatId, message);
  }

  async sendWelcomeMessage(chatId) {
    const message = `
<b>🚀 Welcome to Crypto Market Monitor Bot!</b>

To receive market alerts, you need to verify your account first.

<b>How to verify:</b>
1. Go to your Crypto Market Monitor account settings
2. Navigate to Telegram notifications
3. Click "Connect Telegram" to get a verification code
4. Send the code using: <code>/verify YOUR_CODE</code>

<b>Available Commands:</b>
/verify [code] - Verify your account with a code
/help - Show help message
/info - Show bot information
/status - Check verification status

<b>After verification, you'll receive alerts for:</b>
• SSR (Stablecoin Supply Ratio) changes
• Bitcoin dominance shifts
• Exchange flow movements
• Stablecoin market cap changes
• Market volatility spikes
• Large whale movements

<b>Settings:</b>
/set_frequency [high|medium|low] - Set alert frequency

<i>Disclaimer: This is not financial advice. Always do your own research.</i>
    `.trim();

    await this.sendMessage(chatId, message);
  }

  async sendInfoMessage(chatId) {
    const userInfo = this.subscribers.get(chatId);
    const subscriberCount = this.subscribers.size;
    const activeSubscribers = Array.from(this.subscribers.values()).filter(u => u.subscribed).length;

    const message = `
<b>📊 Bot Information</b>

<b>Your Status:</b>
${userInfo ? `• Subscribed: ${userInfo.subscribed ? '✅ Yes' : '❌ No'}` : '• Not registered'}
${userInfo?.alertFrequency ? `• Alert Frequency: ${userInfo.alertFrequency}` : ''}

<b>Bot Statistics:</b>
• Total Subscribers: ${subscriberCount}
• Active Subscribers: ${activeSubscribers}
• Bot Status: ✅ Active

<b>Alert Types:</b>
🚨 High Severity - Critical market movements
⚠️ Medium Severity - Significant changes
ℹ️ Low Severity - Important updates

<i>For support, contact the bot administrator.</i>
    `.trim();

    await this.sendMessage(chatId, message);
  }

  async sendStatusMessage(chatId) {
    const message = `
<b>📊 Bot Status</b>

✅ Bot is active and monitoring markets
📱 You are subscribed to alerts
🕐 Last check: ${new Date().toLocaleString()}

<i>You will receive alerts for significant market movements.</i>
    `.trim();

    await this.sendMessage(chatId, message);
  }

  async sendHelpMessage(chatId) {
    const message = `
<b>❓ Help</b>

This bot sends you real-time cryptocurrency market alerts.

<b>Alert Types:</b>
🚨 High Severity - Critical market movements
⚠️ Medium Severity - Significant changes
ℹ️ Low Severity - Important updates

<b>Commands:</b>
/start - Start the bot and subscribe
/stop - Stop the bot and unsubscribe
/subscribe - Subscribe to alerts
/unsubscribe - Unsubscribe from alerts
/status - Check bot status
/info - Show bot information
/help - Show this help

<b>Settings:</b>
/set_frequency [high|medium|low] - Set alert frequency

<b>Examples:</b>
/set_frequency high - Get all alerts
/set_frequency medium - Get medium and high priority alerts
/set_frequency low - Get only high priority alerts

<i>For support, contact the bot administrator.</i>
    `.trim();

    await this.sendMessage(chatId, message);
  }

  async sendMessage(chatId, text) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        }
      );
    } catch (error) {
      console.error('❌ Error sending Telegram message:', error.message);
    }
  }
}

module.exports = TelegramService;
