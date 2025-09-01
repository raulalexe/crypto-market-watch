const { insertAlert, checkAlertExists, getAlerts, cleanupOldAlerts, cleanupDuplicateAlerts, getUsersWithNotifications } = require('../database');
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

      // Send Telegram notifications (admin controlled, always priority)
      if (isPriority) {
        await this.telegramService.sendBulkAlertMessages(alert);
      }

    } catch (error) {
      console.error('❌ Error sending notifications by type:', error);
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
