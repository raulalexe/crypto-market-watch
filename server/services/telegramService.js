const axios = require('axios');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.isConfigured = false;
    this.chatIds = new Set();
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
      if (botInfo.success) {
        return { 
          success: true, 
          botName: botInfo.bot.first_name,
          chatCount: botInfo.chatCount
        };
      } else {
        return botInfo;
      }
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
        const { chat, text } = update.message;
        
        if (text === '/start') {
          await this.sendWelcomeMessage(chat.id);
        } else if (text === '/stop') {
          await this.removeChatId(chat.id);
          await this.sendMessage(chat.id, '❌ You have been unsubscribed from market alerts.');
        } else if (text === '/status') {
          await this.sendStatusMessage(chat.id);
        } else if (text === '/help') {
          await this.sendHelpMessage(chat.id);
        }
      }
    } catch (error) {
      console.error('❌ Error handling Telegram webhook:', error);
    }
  }

  async sendWelcomeMessage(chatId) {
    const message = `
<b>🚀 Welcome to Crypto Market Monitor Bot!</b>

You will now receive real-time market alerts for:
• SSR (Stablecoin Supply Ratio) changes
• Bitcoin dominance shifts
• Exchange flow movements
• Stablecoin market cap changes

<b>Commands:</b>
/start - Start receiving alerts
/stop - Stop receiving alerts
/status - Check bot status
/help - Show this help message

<i>Disclaimer: This is not financial advice. Always do your own research.</i>
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
/start - Subscribe to alerts
/stop - Unsubscribe from alerts
/status - Check bot status
/help - Show this help

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
