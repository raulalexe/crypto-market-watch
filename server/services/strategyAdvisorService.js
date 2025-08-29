const moment = require('moment');
const ReleaseScheduleService = require('./releaseScheduleService');

class StrategyAdvisorService {
  constructor() {
    this.releaseScheduleService = new ReleaseScheduleService();
    
    // Strategy recommendations based on time to release
    this.strategyTimeline = {
      '60min': {
        urgency: 'high',
        actions: [
          'Review all open long positions',
          'Consider reducing leverage by 30-50%',
          'Set wider stop-loss buffers (2-3x normal)',
          'Prepare hedging instruments (BTC perpetuals, inverse ETFs)'
        ]
      },
      '30min': {
        urgency: 'critical',
        actions: [
          'Execute partial profit-taking on strong performers',
          'Implement hedge positions',
          'Lower leverage to maximum 2x',
          'Set emergency stop-losses'
        ]
      },
      '15min': {
        urgency: 'emergency',
        actions: [
          'Close 50% of remaining long positions',
          'Increase hedge ratio to 1:1',
          'Set tight stop-losses on remaining positions',
          'Prepare for potential market halt'
        ]
      },
      '5min': {
        urgency: 'extreme',
        actions: [
          'Close all speculative long positions',
          'Maintain only core long-term holdings',
          'Ensure all stop-losses are active',
          'Monitor for market volatility'
        ]
      }
    };
  }

  async getStrategyRecommendations(minutesUntilRelease = null) {
    try {
      const nextRelease = await this.releaseScheduleService.getNextHighImpactRelease();
      
      if (!nextRelease) {
        return {
          hasUpcomingRelease: false,
          message: 'No high-impact economic releases scheduled in the near future.',
          recommendations: []
        };
      }

      const releaseDateTime = moment(`${nextRelease.date} ${nextRelease.time}`, 'YYYY-MM-DD HH:mm');
      const minutesUntil = minutesUntilRelease || releaseDateTime.diff(moment(), 'minutes');
      
      if (minutesUntil <= 0) {
        return {
          hasUpcomingRelease: false,
          message: 'Release has already occurred or is currently happening.',
          recommendations: []
        };
      }

      const recommendations = this.generateRecommendations(minutesUntil, nextRelease);
      
      return {
        hasUpcomingRelease: true,
        release: nextRelease,
        minutesUntil,
        urgency: this.getUrgencyLevel(minutesUntil),
        recommendations,
        riskLevel: this.calculateRiskLevel(minutesUntil),
        hedgingOptions: this.getHedgingOptions(nextRelease.type)
      };
    } catch (error) {
      console.error('Error getting strategy recommendations:', error);
      return {
        hasUpcomingRelease: false,
        message: 'Error retrieving strategy recommendations.',
        recommendations: []
      };
    }
  }

  generateRecommendations(minutesUntil, release) {
    const recommendations = [];
    
    // Add timeline-based recommendations
    for (const [timeKey, strategy] of Object.entries(this.strategyTimeline)) {
      const timeMinutes = parseInt(timeKey.replace('min', ''));
      if (minutesUntil <= timeMinutes) {
        recommendations.push({
          timeline: timeKey,
          urgency: strategy.urgency,
          actions: strategy.actions,
          priority: this.getPriorityLevel(timeMinutes)
        });
      }
    }
    
    // Add release-specific recommendations
    const releaseSpecific = this.getReleaseSpecificRecommendations(release);
    recommendations.push(...releaseSpecific);
    
    // Add general risk management
    recommendations.push({
      timeline: 'general',
      urgency: 'medium',
      actions: [
        'Monitor market sentiment indicators',
        'Track institutional flow data',
        'Watch for unusual options activity',
        'Prepare for potential gap moves'
      ],
      priority: 'medium'
    });
    
    return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }

  getReleaseSpecificRecommendations(release) {
    const recommendations = [];
    
    switch (release.type) {
      case 'CPI':
        recommendations.push({
          timeline: 'release_specific',
          urgency: 'high',
          actions: [
            'Monitor inflation expectations vs actual',
            'Watch for core vs headline CPI divergence',
            'Prepare for potential Fed policy implications',
            'Track market reaction to previous CPI releases'
          ],
          priority: 'high'
        });
        break;
        
      case 'PCE':
        recommendations.push({
          timeline: 'release_specific',
          urgency: 'high',
          actions: [
            'Focus on core PCE (Fed\'s preferred measure)',
            'Compare with recent CPI data',
            'Watch for spending pattern changes',
            'Monitor Fed communication post-release'
          ],
          priority: 'high'
        });
        break;
        
      default:
        recommendations.push({
          timeline: 'release_specific',
          urgency: 'medium',
          actions: [
            'Review historical market reactions',
            'Check analyst consensus expectations',
            'Monitor pre-release market positioning'
          ],
          priority: 'medium'
        });
    }
    
    return recommendations;
  }

  getHedgingOptions(releaseType) {
    const baseHedging = [
      {
        instrument: 'BTC Perpetual Futures',
        type: 'Short',
        correlation: 'high',
        description: 'Direct hedge against crypto market volatility'
      },
      {
        instrument: 'VIX Futures',
        type: 'Long',
        correlation: 'high',
        description: 'Hedge against market volatility spikes'
      },
      {
        instrument: 'USD Index Futures',
        type: 'Long',
        correlation: 'medium',
        description: 'Hedge against dollar strength'
      }
    ];
    
    const specificHedging = [];
    
    switch (releaseType) {
      case 'CPI':
        specificHedging.push({
          instrument: 'Treasury Bond Futures',
          type: 'Long',
          correlation: 'high',
          description: 'Hedge against inflation expectations'
        });
        break;
        
      case 'PCE':
        specificHedging.push({
          instrument: 'Gold Futures',
          type: 'Long',
          correlation: 'medium',
          description: 'Inflation hedge and safe haven'
        });
        break;
    }
    
    return [...baseHedging, ...specificHedging];
  }

  getUrgencyLevel(minutesUntil) {
    if (minutesUntil <= 5) return 'extreme';
    if (minutesUntil <= 15) return 'emergency';
    if (minutesUntil <= 30) return 'critical';
    if (minutesUntil <= 60) return 'high';
    if (minutesUntil <= 120) return 'medium';
    return 'low';
  }

  getPriorityLevel(minutesUntil) {
    if (minutesUntil <= 15) return 'critical';
    if (minutesUntil <= 30) return 'high';
    if (minutesUntil <= 60) return 'medium';
    return 'low';
  }

  getPriorityScore(priority) {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }

  calculateRiskLevel(minutesUntil) {
    if (minutesUntil <= 5) return 'extreme';
    if (minutesUntil <= 15) return 'very_high';
    if (minutesUntil <= 30) return 'high';
    if (minutesUntil <= 60) return 'moderate';
    return 'low';
  }

  async getPositionSizingRecommendations(currentExposure, minutesUntil) {
    const recommendations = {
      suggestedExposure: currentExposure,
      actions: [],
      reasoning: []
    };
    
    if (minutesUntil <= 5) {
      recommendations.suggestedExposure = Math.max(currentExposure * 0.1, 0); // Keep only 10%
      recommendations.actions.push('Reduce position size to 10% of current exposure');
      recommendations.reasoning.push('Extreme volatility expected during release');
    } else if (minutesUntil <= 15) {
      recommendations.suggestedExposure = Math.max(currentExposure * 0.3, 0); // Keep only 30%
      recommendations.actions.push('Reduce position size to 30% of current exposure');
      recommendations.reasoning.push('High volatility expected in next 15 minutes');
    } else if (minutesUntil <= 30) {
      recommendations.suggestedExposure = Math.max(currentExposure * 0.5, 0); // Keep only 50%
      recommendations.actions.push('Reduce position size to 50% of current exposure');
      recommendations.reasoning.push('Moderate volatility expected in next 30 minutes');
    } else if (minutesUntil <= 60) {
      recommendations.suggestedExposure = Math.max(currentExposure * 0.7, 0); // Keep only 70%
      recommendations.actions.push('Reduce position size to 70% of current exposure');
      recommendations.reasoning.push('Prepare for potential volatility');
    }
    
    return recommendations;
  }

  async getStopLossRecommendations(currentStopLoss, minutesUntil) {
    const recommendations = {
      suggestedStopLoss: currentStopLoss,
      buffer: 1.0,
      actions: [],
      reasoning: []
    };
    
    if (minutesUntil <= 5) {
      recommendations.buffer = 3.0; // 3x wider stops
      recommendations.actions.push('Set stop-loss buffer to 3x normal width');
      recommendations.reasoning.push('Extreme volatility expected during release');
    } else if (minutesUntil <= 15) {
      recommendations.buffer = 2.5; // 2.5x wider stops
      recommendations.actions.push('Set stop-loss buffer to 2.5x normal width');
      recommendations.reasoning.push('High volatility expected in next 15 minutes');
    } else if (minutesUntil <= 30) {
      recommendations.buffer = 2.0; // 2x wider stops
      recommendations.actions.push('Set stop-loss buffer to 2x normal width');
      recommendations.reasoning.push('Moderate volatility expected in next 30 minutes');
    } else if (minutesUntil <= 60) {
      recommendations.buffer = 1.5; // 1.5x wider stops
      recommendations.actions.push('Set stop-loss buffer to 1.5x normal width');
      recommendations.reasoning.push('Prepare for potential volatility');
    }
    
    return recommendations;
  }

  async getLeverageRecommendations(currentLeverage, minutesUntil) {
    const recommendations = {
      suggestedLeverage: currentLeverage,
      actions: [],
      reasoning: []
    };
    
    if (minutesUntil <= 5) {
      recommendations.suggestedLeverage = Math.min(currentLeverage * 0.1, 1.0); // Max 1x
      recommendations.actions.push('Reduce leverage to maximum 1x');
      recommendations.reasoning.push('Extreme volatility expected during release');
    } else if (minutesUntil <= 15) {
      recommendations.suggestedLeverage = Math.min(currentLeverage * 0.3, 1.5); // Max 1.5x
      recommendations.actions.push('Reduce leverage to maximum 1.5x');
      recommendations.reasoning.push('High volatility expected in next 15 minutes');
    } else if (minutesUntil <= 30) {
      recommendations.suggestedLeverage = Math.min(currentLeverage * 0.5, 2.0); // Max 2x
      recommendations.actions.push('Reduce leverage to maximum 2x');
      recommendations.reasoning.push('Moderate volatility expected in next 30 minutes');
    } else if (minutesUntil <= 60) {
      recommendations.suggestedLeverage = Math.min(currentLeverage * 0.7, 3.0); // Max 3x
      recommendations.actions.push('Reduce leverage to maximum 3x');
      recommendations.reasoning.push('Prepare for potential volatility');
    }
    
    return recommendations;
  }

  async getPostReleaseStrategy(release, actualData, marketReaction) {
    const strategy = {
      immediate: [],
      shortTerm: [],
      mediumTerm: []
    };
    
    // Immediate actions (first 5 minutes)
    strategy.immediate = [
      'Assess market reaction and volatility',
      'Monitor for gap moves or flash crashes',
      'Check if stop-losses were triggered',
      'Evaluate if data was in line with expectations'
    ];
    
    // Short-term actions (next 30 minutes)
    strategy.shortTerm = [
      'Adjust positions based on market reaction',
      'Consider re-entering positions if volatility subsides',
      'Monitor for follow-through moves',
      'Update risk parameters based on new volatility regime'
    ];
    
    // Medium-term actions (next few hours)
    strategy.mediumTerm = [
      'Analyze data implications for Fed policy',
      'Update market outlook based on new information',
      'Consider new position entries at better levels',
      'Review and adjust overall portfolio allocation'
    ];
    
    return strategy;
  }
}

module.exports = StrategyAdvisorService;