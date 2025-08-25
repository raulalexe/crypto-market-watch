const { insertAlert, getAlerts } = require('../database');

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
    
    if (dominance > this.alertThresholds.btcDominance.high) {
      alerts.push({
        type: 'BTC_DOMINANCE_HIGH',
        message: `Bitcoin dominance at ${dominance.toFixed(2)}% - BTC outperforming altcoins significantly.`,
        severity: 'medium',
        metric: 'btc_dominance',
        value: dominance
      });
    } else if (dominance < this.alertThresholds.btcDominance.low) {
      alerts.push({
        type: 'BTC_DOMINANCE_LOW',
        message: `Bitcoin dominance at ${dominance.toFixed(2)}% - Altcoins outperforming BTC.`,
        severity: 'medium',
        metric: 'btc_dominance',
        value: dominance
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

    // Store alerts in database
    for (const alert of allAlerts) {
      await insertAlert(alert);
    }

    return allAlerts;
  }

  // Get recent alerts
  async getRecentAlerts(limit = 10) {
    return await getAlerts(limit);
  }
}

module.exports = AlertService;
