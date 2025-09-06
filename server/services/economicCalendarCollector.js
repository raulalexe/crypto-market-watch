const EconomicDataService = require('./economicDataService');
const AIAnalyzer = require('./aiAnalyzer');
const AlertService = require('./alertService');
const { 
  insertEconomicData, 
  insertUpcomingEvent,
  getUpcomingEvents,
  getEconomicEventsForAnalysis,
  updateEconomicDataAnalysis,
  markEconomicDataAlertSent
} = require('../database');
const moment = require('moment-timezone');

class EconomicCalendarCollector {
  constructor() {
    this.economicDataService = new EconomicDataService();
    this.aiAnalyzer = new AIAnalyzer();
    this.alertService = new AlertService();
  }

  // Collect and store economic calendar events
  async collectEconomicCalendar() {
    try {
      console.log('📅 Collecting economic calendar events...');
      
      const schedule = this.economicDataService.getEconomicReleaseSchedule();
      const storedEvents = [];
      
      for (const event of schedule) {
        try {
          // Convert economic calendar event to upcoming event format
          const upcomingEvent = {
            title: event.title,
            description: event.description,
            category: event.category,
            impact: event.impact,
            date: new Date(`${event.date}T${event.time || '00:00'}`),
            source: event.source
          };
          
          const eventId = await insertUpcomingEvent(
            upcomingEvent.title,
            upcomingEvent.description,
            upcomingEvent.category,
            upcomingEvent.impact,
            upcomingEvent.date,
            upcomingEvent.source
          );
          
          if (eventId) {
            storedEvents.push({ ...upcomingEvent, dbId: eventId });
            console.log(`✅ Stored calendar event: ${event.title} (${event.date})`);
          }
        } catch (error) {
          console.error(`❌ Error storing event ${event.title}:`, error.message);
        }
      }
      
      console.log(`✅ Economic calendar collection completed: ${storedEvents.length} events stored`);
      return storedEvents;
    } catch (error) {
      console.error('❌ Error in economic calendar collection:', error.message);
      throw error;
    }
  }

  // Collect economic data and store it
  async collectEconomicData() {
    try {
      console.log('📊 Collecting economic data...');
      
      const results = await this.economicDataService.collectAllEconomicData();
      const storedData = [];
      
      // Store employment data
      if (results.employment.nonfarmPayrolls) {
        const id = await insertEconomicData(results.employment.nonfarmPayrolls);
        if (id) {
          storedData.push({ ...results.employment.nonfarmPayrolls, dbId: id });
          console.log(`✅ Stored Nonfarm Payrolls: ${results.employment.nonfarmPayrolls.value}`);
        }
      }
      
      if (results.employment.unemploymentRate) {
        const id = await insertEconomicData(results.employment.unemploymentRate);
        if (id) {
          storedData.push({ ...results.employment.unemploymentRate, dbId: id });
          console.log(`✅ Stored Unemployment Rate: ${results.employment.unemploymentRate.value}%`);
        }
      }
      
      // Store inflation data (if available from economic data service)
      if (results.inflation.cpi) {
        const id = await insertEconomicData(results.inflation.cpi);
        if (id) {
          storedData.push({ ...results.inflation.cpi, dbId: id });
          console.log(`✅ Stored CPI: ${results.inflation.cpi.value}`);
        }
      }
      
      if (results.inflation.pce) {
        const id = await insertEconomicData(results.inflation.pce);
        if (id) {
          storedData.push({ ...results.inflation.pce, dbId: id });
          console.log(`✅ Stored PCE: ${results.inflation.pce.value}`);
        }
      }
      
      // Store monetary policy data
      if (results.monetary.federalFundsRate) {
        const id = await insertEconomicData(results.monetary.federalFundsRate);
        if (id) {
          storedData.push({ ...results.monetary.federalFundsRate, dbId: id });
          console.log(`✅ Stored Federal Funds Rate: ${results.monetary.federalFundsRate.value}%`);
        }
      }
      
      // Store GDP data
      if (results.gdp) {
        const id = await insertEconomicData(results.gdp);
        if (id) {
          storedData.push({ ...results.gdp, dbId: id });
          console.log(`✅ Stored GDP: ${results.gdp.value}`);
        }
      }
      
      // Store retail sales data
      if (results.retail) {
        const id = await insertEconomicData(results.retail);
        if (id) {
          storedData.push({ ...results.retail, dbId: id });
          console.log(`✅ Stored Retail Sales: ${results.retail.value}`);
        }
      }
      
      console.log(`✅ Economic data collection completed: ${storedData.length} data points stored`);
      return { storedData, newReleases: results.newReleases };
    } catch (error) {
      console.error('❌ Error in economic data collection:', error.message);
      throw error;
    }
  }

  // Process economic data for AI analysis
  async processEconomicDataForAnalysis() {
    try {
      console.log('🤖 Processing economic data for AI analysis...');
      
      const eventsForAnalysis = await getEconomicEventsForAnalysis();
      
      if (!eventsForAnalysis || eventsForAnalysis.length === 0) {
        console.log('ℹ️ No economic data ready for AI analysis');
        return [];
      }

      console.log(`📊 Found ${eventsForAnalysis.length} economic data points ready for analysis`);

      const analyzedEvents = [];
      for (const event of eventsForAnalysis) {
        try {
          // Analyze the economic data with AI
          const analysis = await this.analyzeEconomicDataWithAI(event);
          
          if (analysis) {
            // Update the event with AI analysis
            await updateEconomicDataAnalysis(event.id, analysis);
            
            // Create market alert if significant
            if (this.shouldCreateAlert(event, analysis)) {
              await this.createMarketAlert(event, analysis);
              await markEconomicDataAlertSent(event.id);
            }
            
            analyzedEvents.push({ ...event, analysis });
            console.log(`✅ Analyzed economic data: ${event.description || event.series_id}`);
          }
        } catch (error) {
          console.error(`❌ Error analyzing economic data ${event.series_id}:`, error.message);
        }
      }

      console.log(`✅ AI analysis completed for ${analyzedEvents.length} economic data points`);
      return analyzedEvents;
    } catch (error) {
      console.error('❌ Error processing economic data for analysis:', error.message);
      throw error;
    }
  }

  // Analyze economic data with AI
  async analyzeEconomicDataWithAI(event) {
    try {
      // Prepare economic data for AI analysis
      const economicData = {
        seriesId: event.series_id,
        description: event.description || event.title,
        category: event.category,
        impact: event.impact,
        value: event.value,
        previousValue: event.previous_value,
        change: event.change_value,
        coreValue: event.core_value,
        previousCoreValue: event.previous_core_value,
        source: event.source,
        date: event.date
      };

      // Create a focused prompt for economic data analysis
      const prompt = this.createEconomicDataPrompt(economicData);
      
      // Use Venice AI for analysis (following user preference for real models only)
      const analysis = await this.aiAnalyzer.getVeniceAnalysis(
        { economic_data: [economicData] }, 
        null, 
        null
      );

      return {
        market_impact: analysis?.market_direction || 'neutral',
        confidence: analysis?.confidence || 0.5,
        reasoning: analysis?.reasoning || 'Analysis completed',
        factors: analysis?.factors_analyzed || [],
        surprise_analysis: this.analyzeSurprise(economicData),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error in AI analysis for economic data:', error.message);
      return null;
    }
  }

  // Create a focused prompt for economic data analysis
  createEconomicDataPrompt(economicData) {
    const changeText = economicData.change !== null ? 
      `The value changed by ${economicData.change > 0 ? '+' : ''}${economicData.change} from the previous reading of ${economicData.previousValue}.` :
      'No previous data available for comparison.';

    const coreText = economicData.coreValue ? 
      `Core value: ${economicData.coreValue} (previous: ${economicData.previousCoreValue || 'N/A'})` :
      '';

    return `
Analyze the following economic data and its potential market impact:

Economic Indicator: ${economicData.description}
Category: ${economicData.category}
Impact Level: ${economicData.impact}
Source: ${economicData.source}
Date: ${economicData.date}

Data:
- Current Value: ${economicData.value}
- Previous Value: ${economicData.previousValue || 'N/A'}
${coreText}

${changeText}

Please provide:
1. Market impact assessment (bullish/bearish/neutral)
2. Confidence level (0-1)
3. Detailed reasoning
4. Key factors to consider
5. Potential effects on crypto markets specifically

Focus on how this economic data might affect cryptocurrency markets, considering factors like:
- Federal Reserve policy implications
- Inflation expectations
- Risk-on vs risk-off sentiment
- Dollar strength implications
- Market volatility expectations
- Employment market conditions
- Economic growth prospects
`;
  }

  // Analyze the surprise factor
  analyzeSurprise(economicData) {
    if (economicData.change === null || economicData.previousValue === null) {
      return { significance: 'none', description: 'No previous data available for comparison' };
    }

    const changePercent = (economicData.change / economicData.previousValue) * 100;
    const direction = economicData.change > 0 ? 'positive' : 'negative';

    let significance = 'low';
    if (Math.abs(changePercent) > 20) significance = 'very_high';
    else if (Math.abs(changePercent) > 10) significance = 'high';
    else if (Math.abs(changePercent) > 5) significance = 'medium';

    return {
      significance,
      direction,
      changePercent: Math.abs(changePercent),
      description: `${direction} change of ${Math.abs(changePercent).toFixed(2)}%`
    };
  }

  // Determine if an alert should be created
  shouldCreateAlert(event, analysis) {
    // Create alerts for high-impact events with significant changes
    const isHighImpact = event.impact === 'high';
    const hasSignificantChange = event.change_value && Math.abs(event.change_value) > 0.5;
    const isMarketMoving = analysis.market_impact !== 'neutral' && analysis.confidence > 0.6;

    return isHighImpact && (hasSignificantChange || isMarketMoving);
  }

  // Create a market alert for the economic data
  async createMarketAlert(event, analysis) {
    try {
      const changeText = event.change_value ? 
        ` (${event.change_value > 0 ? '+' : ''}${event.change_value} change)` : '';

      const alert = {
        type: 'ECONOMIC_DATA',
        message: `${event.description || event.title}${changeText}: ${analysis.reasoning}`,
        severity: this.getAlertSeverity(event, analysis),
        metric: 'economic_data',
        value: event.value,
        eventId: event.series_id,
        eventDate: event.date,
        eventTitle: event.description || event.title,
        eventCategory: event.category,
        change: event.change_value,
        marketImpact: analysis.market_impact,
        confidence: analysis.confidence
      };

      await this.alertService.insertAlertIfNotExists(alert, 3600000); // 1 hour window
      console.log(`🚨 Created market alert for: ${event.description || event.title}`);
    } catch (error) {
      console.error('❌ Error creating market alert:', error.message);
    }
  }

  // Get alert severity based on event and analysis
  getAlertSeverity(event, analysis) {
    if (event.impact === 'high' && event.change_value && Math.abs(event.change_value) > 1.0) return 'high';
    if (event.impact === 'high' || (event.change_value && Math.abs(event.change_value) > 0.5)) return 'medium';
    return 'low';
  }

  // Main collection and analysis function
  async collectAndAnalyze() {
    try {
      console.log('🚀 Starting economic calendar collection and analysis...');
      
      // Collect calendar events
      const calendarEvents = await this.collectEconomicCalendar();
      
      // Collect economic data
      const { storedData, newReleases } = await this.collectEconomicData();
      
      // Process data for AI analysis
      const analyzedEvents = await this.processEconomicDataForAnalysis();
      
      return {
        calendarEvents: calendarEvents.length,
        storedData: storedData.length,
        analyzedEvents: analyzedEvents.length,
        newReleases: newReleases.length,
        success: true
      };
    } catch (error) {
      console.error('❌ Error in economic calendar collection and analysis:', error.message);
      throw error;
    }
  }
}

module.exports = EconomicCalendarCollector;
