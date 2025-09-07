const { insertAlert, checkAlertExists, getAlerts, cleanupOldAlerts, cleanupDuplicateAlerts, getUsersWithNotifications, getUserAlertThresholds } = require('../database');
const EmailService = require('./emailService');
const PushService = require('./pushService');
const TelegramService = require('./telegramService');

class AlertService {
  constructor() {
    this.alertThresholds = {
      ssr: {
        veryBullish: 2.0,    // SSR < 2 = very bullish
        bullish: 4.0,        // SSR < 4 = bullish
        bearish: 6.0,        // SSR > 6 = bearish
        veryBearish: 8.0     // SSR > 8 = very bearish
      },
      btcDominance: {
        high: 55.0,          // BTC dominance > 55%
        low: 40.0            // BTC dominance < 40%
      },
      exchangeFlows: {
        extremeInflow: 1000000,  // $1M+ inflow
        extremeOutflow: 1000000  // $1M+ outflow
      },
      stablecoinGrowth: {
        rapidGrowth: 5.0,    // 5%+ daily growth
        rapidDecline: -5.0   // 5%+ daily decline
      }
    };

    // Initialize notification services
    this.emailService = new EmailService();
    this.pushService = new PushService();
    this.telegramService = new TelegramService();
  }

  // Helper method to check if alert already exists and insert if not
  async insertAlertIfNotExists(alert, timeWindow = 3600000) { // 1 hour default
    try {
      const exists = await checkAlertExists(alert, timeWindow);
      if (!exists) {
        await insertAlert(alert);
        return true; // Alert was inserted
      } else {
        return false; // Alert already exists
      }
    } catch (error) {
      console.error('Error checking/inserting alert:', error);
      return false;
    }
  }

  // Check SSR alerts
  async checkSSRAlerts(ssr) {
    const alerts = [];
    
    if (ssr < this.alertThresholds.ssr.veryBullish) {
      alerts.push({
        type: 'SSR_VERY_BULLISH',
        message: `SSR at ${ssr.toFixed(2)} - Very bullish signal! High buying power available.`,
        severity: 'high',
        metric: 'ssr',
        value: ssr
      });
    } else if (ssr < this.alertThresholds.ssr.bullish) {
      alerts.push({
        type: 'SSR_BULLISH',
        message: `SSR at ${ssr.toFixed(2)} - Bullish signal. Good buying power available.`,
        severity: 'medium',
        metric: 'ssr',
        value: ssr
      });
    } else if (ssr > this.alertThresholds.ssr.veryBearish) {
      alerts.push({
        type: 'SSR_VERY_BEARISH',
        message: `SSR at ${ssr.toFixed(2)} - Very bearish signal! Very low buying power.`,
        severity: 'high',
        metric: 'ssr',
        value: ssr
      });
    } else if (ssr > this.alertThresholds.ssr.bearish) {
      alerts.push({
        type: 'SSR_BEARISH',
        message: `SSR at ${ssr.toFixed(2)} - Bearish signal. Low buying power.`,
        severity: 'medium',
        metric: 'ssr',
        value: ssr
      });
    }

    return alerts;
  }

  // Check Bitcoin Dominance alerts
  async checkBTCDominanceAlerts(dominance) {
    const alerts = [];
    
    // Convert to number if it's a string
    const numDominance = typeof dominance === 'string' ? parseFloat(dominance) : dominance;
    
    // Check if conversion was successful
    if (isNaN(numDominance)) {
      console.error('Invalid dominance value:', dominance);
      return alerts;
    }
    
    if (numDominance > this.alertThresholds.btcDominance.high) {
      alerts.push({
        type: 'BTC_DOMINANCE_HIGH',
        message: `Bitcoin dominance at ${numDominance.toFixed(2)}% - BTC outperforming altcoins significantly.`,
        severity: 'medium',
        metric: 'btc_dominance',
        value: numDominance
      });
    } else if (numDominance < this.alertThresholds.btcDominance.low) {
      alerts.push({
        type: 'BTC_DOMINANCE_LOW',
        message: `Bitcoin dominance at ${numDominance.toFixed(2)}% - Altcoins outperforming BTC.`,
        severity: 'medium',
        metric: 'btc_dominance',
        value: numDominance
      });
    }

    return alerts;
  }

  // Check Exchange Flow alerts
  async checkExchangeFlowAlerts(flows) {
    const alerts = [];
    
    if (flows.btc) {
      const btcNetFlow = flows.btc.netFlow;
      if (btcNetFlow > this.alertThresholds.exchangeFlows.extremeInflow) {
        alerts.push({
          type: 'BTC_EXTREME_INFLOW',
          message: `BTC extreme inflow: $${(btcNetFlow / 1e6).toFixed(2)}M - Money moving to exchanges (bearish).`,
          severity: 'high',
          metric: 'exchange_flows',
          value: btcNetFlow
        });
      } else if (btcNetFlow < -this.alertThresholds.exchangeFlows.extremeOutflow) {
        alerts.push({
          type: 'BTC_EXTREME_OUTFLOW',
          message: `BTC extreme outflow: $${(Math.abs(btcNetFlow) / 1e6).toFixed(2)}M - Money leaving exchanges (bullish).`,
          severity: 'high',
          metric: 'exchange_flows',
          value: btcNetFlow
        });
      }
    }

    if (flows.eth) {
      const ethNetFlow = flows.eth.netFlow;
      if (ethNetFlow > this.alertThresholds.exchangeFlows.extremeInflow) {
        alerts.push({
          type: 'ETH_EXTREME_INFLOW',
          message: `ETH extreme inflow: $${(ethNetFlow / 1e6).toFixed(2)}M - Money moving to exchanges (bearish).`,
          severity: 'high',
          metric: 'exchange_flows',
          value: ethNetFlow
        });
      } else if (ethNetFlow < -this.alertThresholds.exchangeFlows.extremeOutflow) {
        alerts.push({
          type: 'ETH_EXTREME_OUTFLOW',
          message: `ETH extreme outflow: $${(Math.abs(ethNetFlow) / 1e6).toFixed(2)}M - Money leaving exchanges (bullish).`,
          severity: 'high',
          metric: 'exchange_flows',
          value: ethNetFlow
        });
      }
    }

    return alerts;
  }

  // Check Stablecoin Growth alerts
  async checkStablecoinGrowthAlerts(change24h) {
    const alerts = [];
    
    if (change24h > this.alertThresholds.stablecoinGrowth.rapidGrowth) {
      alerts.push({
        type: 'STABLECOIN_RAPID_GROWTH',
        message: `Stablecoin market cap growing rapidly: +${change24h.toFixed(2)}% - Sidelined capital accumulating.`,
        severity: 'medium',
        metric: 'stablecoin_growth',
        value: change24h
      });
    } else if (change24h < this.alertThresholds.stablecoinGrowth.rapidDecline) {
      alerts.push({
        type: 'STABLECOIN_RAPID_DECLINE',
        message: `Stablecoin market cap declining rapidly: ${change24h.toFixed(2)}% - Capital leaving crypto.`,
        severity: 'high',
        metric: 'stablecoin_growth',
        value: change24h
      });
    }

    return alerts;
  }

  // Main alert checking function
  async checkAllAlerts(metrics) {
    const allAlerts = [];
    
    // Check SSR alerts
    if (metrics.stablecoinMetrics && metrics.stablecoinMetrics.ssr) {
      const ssrAlerts = await this.checkSSRAlerts(metrics.stablecoinMetrics.ssr);
      allAlerts.push(...ssrAlerts);
    }

    // Check Bitcoin Dominance alerts
    if (metrics.bitcoinDominance && metrics.bitcoinDominance.value) {
      const btcAlerts = await this.checkBTCDominanceAlerts(metrics.bitcoinDominance.value);
      allAlerts.push(...btcAlerts);
    }

    // Check Exchange Flow alerts
    if (metrics.exchangeFlows) {
      const flowAlerts = await this.checkExchangeFlowAlerts(metrics.exchangeFlows);
      allAlerts.push(...flowAlerts);
    }

    // Check Stablecoin Growth alerts
    if (metrics.stablecoinMetrics && metrics.stablecoinMetrics.change_24h) {
      const growthAlerts = await this.checkStablecoinGrowthAlerts(metrics.stablecoinMetrics.change_24h);
      allAlerts.push(...growthAlerts);
    }

    // Store alerts in database (with duplicate checking)
    const insertedAlerts = [];
    for (const alert of allAlerts) {
      const wasInserted = await this.insertAlertIfNotExists(alert);
      if (wasInserted) {
        insertedAlerts.push(alert);
        
        // Send notifications for new alerts
        await this.sendNotifications(alert);
      }
    }

    return insertedAlerts;
  }

  // Get recent alerts
  async getRecentAlerts(limit = 10) {
    return await getAlerts(limit);
  }

  // Check custom user alert thresholds
  async checkCustomUserThresholds(metrics, aiAnalysis) {
    try {
      // Get all users with custom thresholds
      const users = await getUsersWithNotifications();
      const allAlerts = [];

      for (const user of users) {
        const thresholds = await getUserAlertThresholds(user.id);
        
        for (const threshold of thresholds) {
          if (!threshold.enabled) continue;

          const alert = await this.checkSingleThreshold(threshold, metrics, aiAnalysis);
          if (alert) {
            alert.userId = user.id;
            alert.userEmail = user.email;
            allAlerts.push(alert);
          }
        }
      }

      return allAlerts;
    } catch (error) {
      console.error('Error checking custom user thresholds:', error);
      return [];
    }
  }

  // Check a single threshold against current data
  async checkSingleThreshold(threshold, metrics, aiAnalysis) {
    try {
      const { metric, condition, value } = threshold;
      let currentValue = null;
      let previousValue = null;

      // Get current value based on metric type
      if (metric.startsWith('ai_prediction_')) {
        const timeframe = metric.replace('ai_prediction_', '');
        if (aiAnalysis && aiAnalysis[timeframe]) {
          currentValue = aiAnalysis[timeframe].market_direction;
        } else if (aiAnalysis && aiAnalysis.overall_direction && timeframe === 'overall') {
          currentValue = aiAnalysis.overall_direction;
        }
      } else {
        // Handle regular metrics
        switch (metric) {
          case 'btc_price':
            currentValue = metrics.cryptoPrices?.btc?.price;
            break;
          case 'eth_price':
            currentValue = metrics.cryptoPrices?.eth?.price;
            break;
          case 'sol_price':
            currentValue = metrics.cryptoPrices?.sol?.price;
            break;
          case 'ssr':
            currentValue = metrics.stablecoinMetrics?.ssr;
            break;
          case 'btc_dominance':
            currentValue = metrics.bitcoinDominance?.value;
            break;
          case 'exchange_flow':
            currentValue = metrics.exchangeFlows?.netFlow;
            break;
          case 'fear_greed':
            currentValue = metrics.fearGreedIndex?.value;
            break;
          case 'vix':
            currentValue = metrics.marketData?.vix;
            break;
          case 'dxy':
            currentValue = metrics.marketData?.dxy;
            break;
          case 'volume_24h':
            currentValue = metrics.cryptoPrices?.btc?.volume_24h;
            break;
        }
      }

      if (currentValue === null) return null;

      // Check condition
      const shouldTrigger = this.evaluateCondition(condition, currentValue, value, previousValue);
      
      if (shouldTrigger) {
        return {
          type: 'custom_threshold',
          severity: 'medium',
          title: threshold.name,
          message: this.generateAlertMessage(threshold, currentValue, value),
          data: {
            thresholdId: threshold.threshold_id,
            metric,
            condition,
            currentValue,
            thresholdValue: value,
            previousValue
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking single threshold:', error);
      return null;
    }
  }

  // Evaluate alert condition
  evaluateCondition(condition, currentValue, thresholdValue, previousValue) {
    switch (condition) {
      case 'above':
        return parseFloat(currentValue) > parseFloat(thresholdValue);
      case 'below':
        return parseFloat(currentValue) < parseFloat(thresholdValue);
      case 'equals':
        return currentValue === thresholdValue;
      case 'changes_by':
        if (previousValue === null) return false;
        return Math.abs(parseFloat(currentValue) - parseFloat(previousValue)) >= parseFloat(thresholdValue);
      
      // AI prediction specific conditions
      case 'changes_to_bullish':
        return currentValue === 'BULLISH' && previousValue !== 'BULLISH';
      case 'changes_to_bearish':
        return currentValue === 'BEARISH' && previousValue !== 'BEARISH';
      case 'changes_to_neutral':
        return currentValue === 'NEUTRAL' && previousValue !== 'NEUTRAL';
      case 'becomes_bullish':
        return currentValue === 'BULLISH';
      case 'becomes_bearish':
        return currentValue === 'BEARISH';
      case 'becomes_neutral':
        return currentValue === 'NEUTRAL';
      
      default:
        return false;
    }
  }

  // Generate alert message
  generateAlertMessage(threshold, currentValue, thresholdValue) {
    const { metric, condition, name } = threshold;
    
    if (metric.startsWith('ai_prediction_')) {
      const timeframe = metric.replace('ai_prediction_', '');
      return `AI ${timeframe} prediction changed to ${currentValue}. ${name}`;
    }
    
    switch (condition) {
      case 'above':
        return `${metric} is above ${thresholdValue} (current: ${currentValue}). ${name}`;
      case 'below':
        return `${metric} is below ${thresholdValue} (current: ${currentValue}). ${name}`;
      case 'equals':
        return `${metric} equals ${thresholdValue}. ${name}`;
      case 'changes_by':
        return `${metric} changed by ${thresholdValue} (current: ${currentValue}). ${name}`;
      default:
        return `${name}: ${metric} condition met`;
    }
  }

  // Cleanup old alerts
  async cleanupOldAlerts(daysToKeep = 7) {
    try {
      const deletedCount = await cleanupOldAlerts(daysToKeep);
      console.log(`Cleaned up ${deletedCount} old alerts`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
      return 0;
    }
  }

  // Cleanup duplicate alerts
  async cleanupDuplicateAlerts() {
    try {
      const deletedCount = await cleanupDuplicateAlerts();
      console.log(`Cleaned up ${deletedCount} duplicate alerts`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up duplicate alerts:', error);
      return 0;
    }
  }

  // Send notifications for an alert with priority delivery
  async sendNotifications(alert) {
    try {
      // Get users with notification preferences (only authenticated users)
      const users = await getUsersWithNotifications();
      
      if (users.length === 0) {
        console.log('📢 No authenticated users with notification preferences found');
        return;
      }

      console.log(`📢 Sending notifications to ${users.length} authenticated users for alert: ${alert.type}`);

      // Separate users by subscription level for priority delivery
      const premiumUsers = users.filter(user => user.plan === 'premium' || user.plan === 'admin');
      const proUsers = users.filter(user => user.plan === 'pro');
      const freeUsers = users.filter(user => user.plan === 'free');

      // Send to Premium+ users first (priority delivery)
      if (premiumUsers.length > 0) {
        console.log(`🚀 Sending priority notifications to ${premiumUsers.length} Premium+ users`);
        await this.sendNotificationsByType(premiumUsers, alert, true);
      }

      // Send to Pro users with standard delivery
      if (proUsers.length > 0) {
        console.log(`📤 Sending standard notifications to ${proUsers.length} Pro users`);
        await this.sendNotificationsByType(proUsers, alert, false);
      }

      // Send to Free users with delayed delivery
      if (freeUsers.length > 0) {
        console.log(`⏰ Scheduling delayed notifications to ${freeUsers.length} Free users`);
        setTimeout(async () => {
          await this.sendNotificationsByType(freeUsers, alert, false);
        }, 30000); // 30 second delay for free users
      }

    } catch (error) {
      console.error('❌ Error sending notifications:', error);
    }
  }

  // Send notifications to specific users (for event notifications with custom preferences)
  async sendNotificationsToUsers(alert, users) {
    try {
      console.log(`📢 Sending notifications to ${users.length} specific users for alert: ${alert.type}`);

      // Filter users based on their event notification channel preferences
      const filteredUsers = users.filter(user => {
        const userChannels = user.eventNotificationChannels || ['email', 'push'];
        return userChannels.some(channel => {
          if (channel === 'email') return user.emailNotifications && user.email;
          if (channel === 'push') return user.pushNotifications && user.pushSubscriptions?.length > 0;
          if (channel === 'telegram') return user.telegramNotifications;
          return false;
        });
      });

      if (filteredUsers.length === 0) {
        console.log('📢 No users eligible for event notifications');
        return;
      }

      // Send notifications to filtered users
      await this.sendNotificationsByType(filteredUsers, alert, false);

    } catch (error) {
      console.error('❌ Error sending notifications to specific users:', error);
    }
  }

  // Send notifications by type with priority handling
  async sendNotificationsByType(users, alert, isPriority = false) {
    try {
      // Send email notifications
      const emailUsers = users.filter(user => user.emailNotifications && user.email);
      if (emailUsers.length > 0) {
        if (isPriority) {
          // Priority email delivery (immediate)
          await this.emailService.sendBulkAlertEmails(emailUsers, alert);
        } else {
          // Standard email delivery (with slight delay)
          setTimeout(async () => {
            await this.emailService.sendBulkAlertEmails(emailUsers, alert);
          }, 5000);
        }
      }

      // Send push notifications
      const pushUsers = users.filter(user => user.pushNotifications && user.pushSubscriptions.length > 0);
      if (pushUsers.length > 0) {
        if (isPriority) {
          // Priority push delivery (immediate)
          await this.pushService.sendBulkPushNotifications(pushUsers, alert);
        } else {
          // Standard push delivery (with slight delay)
          setTimeout(async () => {
            await this.pushService.sendBulkPushNotifications(pushUsers, alert);
          }, 5000);
        }
      }

      // Send Telegram notifications to verified users only
      const telegramUsers = users.filter(user => 
        user.telegramNotifications && 
        user.telegramChatId && 
        user.telegramVerified
      );
      
      if (telegramUsers.length > 0) {
        if (isPriority) {
          // Priority Telegram delivery (immediate)
          await this.sendTelegramNotificationsToUsers(telegramUsers, alert);
        } else {
          // Standard Telegram delivery (with slight delay)
          setTimeout(async () => {
            await this.sendTelegramNotificationsToUsers(telegramUsers, alert);
          }, 5000);
        }
      }

    } catch (error) {
      console.error('❌ Error sending notifications by type:', error);
    }
  }

  // Send Telegram notifications to specific verified users
  async sendTelegramNotificationsToUsers(users, alert) {
    try {
      const results = { sent: 0, failed: 0 };
      
      for (const user of users) {
        if (user.telegramChatId && user.telegramVerified) {
          const success = await this.telegramService.sendAlertMessage(user.telegramChatId, alert);
          if (success) {
            results.sent++;
          } else {
            results.failed++;
          }
        }
      }
      
      console.log(`📱 Telegram notifications sent to ${results.sent} verified users, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('❌ Error sending Telegram notifications to users:', error);
      return { sent: 0, failed: users.length };
    }
  }

  // Test notification services
  async testNotificationServices() {
    const results = {
      email: await this.emailService.testConnection(),
      push: await this.pushService.testConnection(),
      telegram: await this.telegramService.testConnection()
    };

    console.log('🧪 Notification service test results:', results);
    return results;
  }
}

module.exports = AlertService;
