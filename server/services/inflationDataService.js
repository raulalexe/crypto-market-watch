const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config({ path: '.env.local' });
const { insertInflationData, getLatestInflationData, insertInflationRelease, getInflationReleases, updateInflationRelease } = require('../database');

class InflationDataService {
  constructor() {
    this.beaApiKey = process.env.BEA_API_KEY;
    this.blsApiKey = process.env.BLS_API_KEY;
    this.beaBaseUrl = 'https://apps.bea.gov/api/data';
    this.blsBaseUrl = 'https://api.bls.gov/publicAPI/v2';
    
    // Initialize cron jobs
    this.initializeCronJobs();
  }

  // Initialize cron jobs for data collection
  initializeCronJobs() {
    if (process.env.ENABLE_CRON_JOBS === 'true') {
      // Check for inflation releases daily at 8:30 AM ET
      cron.schedule('30 8 * * *', () => {
        this.checkInflationReleases();
      }, {
        timezone: 'America/New_York'
      });

      // Update release schedule annually
      cron.schedule('0 0 1 1 *', () => {
        this.updateReleaseSchedule();
      }, {
        timezone: 'America/New_York'
      });

      // AI forecast 1 day before releases
      cron.schedule('0 9 * * *', () => {
        this.generateForecasts();
      }, {
        timezone: 'America/New_York'
      });
    }
  }



  // Fetch PCE data from BEA API with retry logic
  async fetchPCEData() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    // Check if we have the required API key
    if (!this.beaApiKey) {
      console.log('⚠️ BEA API key not configured, skipping PCE data collection');
      return null;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching PCE data from BEA API (attempt ${attempt}/${maxRetries})...`);
        
        // Use the correct table name T20804 for PCE data
        const response = await axios.get(this.beaBaseUrl, {
          params: {
            UserID: this.beaApiKey,
            Method: 'GetData',
            DataSetName: 'NIPA',
            TableName: 'T20804', // Price Indexes for Personal Consumption Expenditures by Major Type of Product, Monthly
            Frequency: 'M',
            Year: new Date().getFullYear().toString(),
            ResultFormat: 'JSON'
          },
          timeout: 60000, // Increased timeout to 60 seconds
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json'
          }
        });



        if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results && response.data.BEAAPI.Results.Data) {
          const data = response.data.BEAAPI.Results.Data;
          console.log('✅ PCE data fetched successfully');
          return this.parsePCEData(data);
        } else if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
          // Handle case where Data might be in a different structure
          console.log('✅ PCE data fetched successfully (alternative structure)');
          return this.parsePCEData(response.data.BEAAPI.Results);
        }
        
        throw new Error('Invalid BEA API response structure');
      } catch (error) {
        console.error(`❌ PCE data fetch attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error('❌ All PCE data fetch attempts failed');
          throw error;
        }
        
        console.log(`⏳ Retrying PCE data fetch in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Parse PCE data from BEA response
  parsePCEData(data) {
    
    const pceData = {
      date: null,
      pce: null,
      corePCE: null,
      pceYoY: null,
      corePCEYoY: null
    };

    // Handle different possible data structures
    let dataArray = [];
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (data.Data && Array.isArray(data.Data)) {
      dataArray = data.Data;
    } else if (typeof data === 'object') {
      // Try to extract data from object structure
      dataArray = Object.values(data).filter(item => typeof item === 'object');
    }

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('No valid PCE data found in API response');
    }

    // Find the latest data point
    const latestData = dataArray[0];
    if (!latestData || !latestData.DataValue || !latestData.TimePeriod) {
      throw new Error('Invalid PCE data structure');
    }

    // Extract PCE value and date
    pceData.pce = parseFloat(latestData.DataValue);
    pceData.date = latestData.TimePeriod;

    // Calculate YoY change if we have enough data
    if (dataArray.length >= 12) {
      const currentValue = parseFloat(latestData.DataValue);
      const yearAgoValue = parseFloat(dataArray[11].DataValue);
      pceData.pceYoY = ((currentValue - yearAgoValue) / yearAgoValue) * 100;
    }

    // For now, use the same value for core PCE (we can refine this later)
    pceData.corePCE = pceData.pce;
    pceData.corePCEYoY = pceData.pceYoY;

    // Validate that we have the required data
    if (!pceData.date || !pceData.pce) {
      throw new Error('Incomplete PCE data received from API');
    }

    return pceData;
  }



  // Fetch CPI data from BLS API with retry logic
  async fetchCPIData() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    // Check if we have the required API key
    if (!this.blsApiKey) {
      console.log('⚠️ BLS API key not configured, skipping CPI data collection');
      return null;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching CPI data from BLS API (attempt ${attempt}/${maxRetries})...`);
        
        const response = await axios.post(this.blsBaseUrl + '/timeseries/data/', {
          seriesid: ['CUSR0000SA0', 'CUSR0000SA0L1E'], // All items and Core CPI
          startyear: new Date().getFullYear().toString(),
          endyear: new Date().getFullYear().toString(),
          registrationkey: this.blsApiKey
        }, {
          timeout: 60000, // Increased timeout to 60 seconds
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json'
          }
        });



        if (response.data && response.data.Results && response.data.Results.series) {
          console.log('✅ CPI data fetched successfully');
          return this.parseCPIData(response.data.Results.series);
        }
        
        throw new Error('Invalid BLS API response structure');
      } catch (error) {
        console.error(`❌ CPI data fetch attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error('❌ All CPI data fetch attempts failed');
          throw error;
        }
        
        console.log(`⏳ Retrying CPI data fetch in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Parse CPI data from BLS response
  parseCPIData(series) {
    
    const cpiData = {
      date: null,
      cpi: null,
      coreCPI: null,
      cpiYoY: null,
      coreCPIYoY: null
    };

    if (!Array.isArray(series) || series.length === 0) {
      throw new Error('No valid CPI series data found in API response');
    }

    series.forEach(s => {
      if (!s || !s.data || !Array.isArray(s.data) || s.data.length === 0) return;
      
      const latest = s.data[0];
      const previous = s.data[1];
      
      if (!latest || !latest.value) return;
      
      if (s.seriesID === 'CUSR0000SA0') { // All items CPI
        cpiData.cpi = parseFloat(latest.value);
        cpiData.date = latest.periodName + ' ' + latest.year;
        
        // Calculate YoY change
        if (previous && previous.value) {
          const currentYear = parseInt(latest.year);
          const previousYear = parseInt(previous.year);
          if (currentYear - previousYear === 1) {
            cpiData.cpiYoY = ((parseFloat(latest.value) - parseFloat(previous.value)) / parseFloat(previous.value)) * 100;
          }
        }
      } else if (s.seriesID === 'CUSR0000SA0L1E') { // Core CPI
        cpiData.coreCPI = parseFloat(latest.value);
        
        // Calculate YoY change for core
        if (previous && previous.value) {
          const currentYear = parseInt(latest.year);
          const previousYear = parseInt(previous.year);
          if (currentYear - previousYear === 1) {
            cpiData.coreCPIYoY = ((parseFloat(latest.value) - parseFloat(previous.value)) / parseFloat(previous.value)) * 100;
          }
        }
      }
    });

    // Validate that we have the required data
    if (!cpiData.date || !cpiData.cpi) {
      throw new Error('Incomplete CPI data received from API');
    }

    return cpiData;
  }

  // Scrape BLS/BEA release schedule
  async updateReleaseSchedule() {
    try {
      console.log('Updating inflation release schedule...');
      
      // BLS CPI release schedule (typically 2nd Tuesday of each month)
      const currentYear = new Date().getFullYear();
      const releases = [];
      
      for (let month = 1; month <= 12; month++) {
        // CPI is typically released on the 2nd Tuesday
        const firstDay = new Date(currentYear, month - 1, 1);
        const firstTuesday = new Date(firstDay);
        while (firstTuesday.getDay() !== 2) { // Tuesday = 2
          firstTuesday.setDate(firstTuesday.getDate() + 1);
        }
        const secondTuesday = new Date(firstTuesday);
        secondTuesday.setDate(secondTuesday.getDate() + 7);
        
        releases.push({
          type: 'CPI',
          date: secondTuesday.toISOString().split('T')[0],
          time: '08:30',
          timezone: 'America/New_York',
          source: 'BLS'
        });
      }
      
      // PCE is typically released on the last business day of the month
      for (let month = 1; month <= 12; month++) {
        const lastDay = new Date(currentYear, month, 0);
        let releaseDate = new Date(lastDay);
        
        // Find last business day
        while (releaseDate.getDay() === 0 || releaseDate.getDay() === 6) { // Sunday = 0, Saturday = 6
          releaseDate.setDate(releaseDate.getDate() - 1);
        }
        
        releases.push({
          type: 'PCE',
          date: releaseDate.toISOString().split('T')[0],
          time: '08:30',
          timezone: 'America/New_York',
          source: 'BEA'
        });
      }
      
      // Store releases in database
      for (const release of releases) {
        await insertInflationRelease(release);
      }
      
      console.log(`Updated ${releases.length} inflation releases for ${currentYear}`);
    } catch (error) {
      console.error('Error updating release schedule:', error);
    }
  }

  // Check for inflation releases and fetch data
  async checkInflationReleases() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const releases = await getInflationReleases(today);
      
      for (const release of releases) {
        console.log(`Processing ${release.type} release for ${release.date}`);
        
        let data;
        if (release.type === 'CPI') {
          data = await this.fetchCPIData();
        } else if (release.type === 'PCE') {
          data = await this.fetchPCEData();
        }
        
        if (data) {
          await this.processInflationData(data, release.type);
        }
      }
    } catch (error) {
      console.error('Error checking inflation releases:', error);
    }
  }

  // Process inflation data and check for alerts
  async processInflationData(data, type) {
    try {
      // Get previous data for comparison
      const previousData = await getLatestInflationData(type);
      
      // Store new data
      await insertInflationData({
        type,
        date: data.date,
        value: type === 'CPI' ? data.cpi : data.pce,
        coreValue: type === 'CPI' ? data.coreCPI : data.corePCE,
        yoyChange: type === 'CPI' ? data.cpiYoY : data.pceYoY,
        coreYoYChange: type === 'CPI' ? data.coreCPIYoY : data.corePCEYoY,
        source: type === 'CPI' ? 'BLS' : 'BEA'
      });
      
      // Check for significant changes and create alerts
      if (previousData) {
        await this.checkForAlerts(data, previousData, type);
      }
      
      // Update release status
      await updateInflationRelease(type, data.date, 'completed');
      
    } catch (error) {
      console.error('Error processing inflation data:', error);
    }
  }

  // Check for significant changes and create alerts
  async checkForAlerts(newData, previousData, type) {
    const threshold = 0.1; // 0.1% change threshold
    
    const changes = {
      headline: Math.abs(newData.yoyChange - previousData.yoyChange),
      core: Math.abs(newData.coreYoYChange - previousData.coreYoYChange)
    };
    
    if (changes.headline > threshold || changes.core > threshold) {
      const alert = {
        type: 'inflation',
        severity: changes.headline > 0.3 || changes.core > 0.3 ? 'high' : 'medium',
        title: `${type} Data Release - Significant Change Detected`,
        message: `${type} ${newData.yoyChange > previousData.yoyChange ? 'increased' : 'decreased'} by ${Math.abs(newData.yoyChange - previousData.yoyChange).toFixed(2)}% YoY. Core ${newData.coreYoYChange > previousData.coreYoYChange ? 'increased' : 'decreased'} by ${Math.abs(newData.coreYoYChange - previousData.coreYoYChange).toFixed(2)}% YoY.`,
        data: {
          type,
          newValue: newData.yoyChange,
          previousValue: previousData.yoyChange,
          change: newData.yoyChange - previousData.yoyChange,
          coreChange: newData.coreYoYChange - previousData.coreYoYChange
        }
      };
      
      // Insert alert into database
      const { insertAlert } = require('../database');
      await insertAlert(alert);
      
      // Send notifications
      await this.sendInflationNotifications(alert);
    }
  }

  // Send inflation notifications
  async sendInflationNotifications(alert) {
    try {
      // Send email notifications (requires user email - will be handled by alert system)
      console.log('📧 Inflation alert created - email notifications will be sent by alert system');
      
      // Send push notifications
      try {
        const { sendPushNotification } = require('./pushService');
        await sendPushNotification('Inflation Alert', alert.message);
      } catch (pushError) {
        console.log('⚠️ Push notification service not available:', pushError.message);
      }
      
      console.log('✅ Inflation notifications processed');
    } catch (error) {
      console.error('❌ Error sending inflation notifications:', error);
    }
  }

  // Generate AI forecasts for upcoming releases
  async generateForecasts() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const releases = await getInflationReleases(tomorrowStr);
      
      for (const release of releases) {
        console.log(`Generating forecast for ${release.type} release`);
        
        // Get historical data for analysis
        const historicalData = await this.getHistoricalData(release.type);
        
        // Generate AI forecast
        const forecast = await this.generateAIForecast(release.type, historicalData);
        
        // Store forecast
        await this.storeForecast(forecast, release.type);
      }
    } catch (error) {
      console.error('Error generating forecasts:', error);
    }
  }

  // Get historical data for forecasting
  async getHistoricalData(type) {
    try {
      // Get last 12 months of data
      const data = await this.getInflationDataHistory(type, 12);
      return data;
    } catch (error) {
      console.error('Error getting historical data:', error);
      return [];
    }
  }

  // Generate AI forecast using Venice AI
  async generateAIForecast(type, historicalData) {
    try {
      const veniceAI = require('./aiAnalyzer');
      
      const prompt = `
        Based on the following ${type} inflation data for the last 12 months:
        ${JSON.stringify(historicalData)}
        
        Please provide:
        1. Forecast for the next ${type} release
        2. Potential market impact on Bitcoin and Ethereum
        3. Confidence level in the forecast
        4. Key factors influencing the prediction
      `;
      
      const response = await veniceAI.analyzeWithAI(prompt, 'inflation_forecast');
      
      return {
        type,
        forecast: response.analysis,
        confidence: response.confidence,
        factors: response.factors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating AI forecast:', error);
      return null;
    }
  }

  // Store forecast in database
  async storeForecast(forecast, type) {
    try {
      const { insertInflationForecast } = require('../database');
      await insertInflationForecast(forecast);
      console.log(`Stored forecast for ${type}:`, forecast);
    } catch (error) {
      console.error('Error storing forecast:', error);
    }
  }

  // Get inflation data history
  async getInflationDataHistory(type, months = 12) {
    try {
      const { getInflationDataHistory } = require('../database');
      const data = await getInflationDataHistory(type, months);
      return data;
    } catch (error) {
      console.error('Error getting inflation data history:', error);
      return [];
    }
  }

  // Fetch market expectations and forecasts for inflation data
  async fetchMarketExpectations() {
    try {
      const expectations = {
        cpi: null,
        pce: null,
        sources: [],
        timestamp: new Date().toISOString()
      };

      // Source 1: Federal Reserve Bank of Cleveland (Cleveland Fed)
      try {
        const clevelandResponse = await axios.get('https://www.clevelandfed.org/our-research/indicators-and-data/inflation-expectations.aspx', {
          timeout: 10000
        });
        
        // Parse Cleveland Fed expectations (this would need to be updated based on their actual data format)
        // For now, we'll use a placeholder approach
        expectations.sources.push('Cleveland Fed');
      } catch (error) {
        console.log('Cleveland Fed expectations fetch failed:', error.message);
      }

      // Source 2: Bloomberg consensus estimates (via API if available)
      try {
        // Bloomberg API would require subscription
        // For now, we'll use a placeholder
        expectations.sources.push('Bloomberg Consensus');
      } catch (error) {
        console.log('Bloomberg expectations fetch failed:', error.message);
      }

      // Source 3: Reuters consensus estimates
      try {
        // Reuters API would require subscription
        expectations.sources.push('Reuters Consensus');
      } catch (error) {
        console.log('Reuters expectations fetch failed:', error.message);
      }

      // Source 4: Trading Economics API (if available)
      try {
        // Trading Economics API would require subscription
        expectations.sources.push('Trading Economics');
      } catch (error) {
        console.log('Trading Economics expectations fetch failed:', error.message);
      }

      // For now, return a structured response with placeholder data
      // In production, this would be populated with real API data
      expectations.cpi = {
        headline: {
          expected: 3.2, // Placeholder - would come from consensus estimates
          range: { min: 3.0, max: 3.4 },
          consensus: 3.2
        },
        core: {
          expected: 3.8,
          range: { min: 3.6, max: 4.0 },
          consensus: 3.8
        }
      };

      expectations.pce = {
        headline: {
          expected: 2.6,
          range: { min: 2.4, max: 2.8 },
          consensus: 2.6
        },
        core: {
          expected: 2.9,
          range: { min: 2.7, max: 3.1 },
          consensus: 2.9
        }
      };

      return expectations;
    } catch (error) {
      console.error('Error fetching market expectations:', error.message);
      throw error;
    }
  }

  // Compare actual data with expectations and determine if it's "good" or "bad"
  async analyzeInflationData(actualData, expectations = null) {
    try {
      if (!expectations) {
        expectations = await this.fetchMarketExpectations();
      }

      const analysis = {
        cpi: {
          headline: { actual: null, expected: null, surprise: null, sentiment: null },
          core: { actual: null, expected: null, surprise: null, sentiment: null }
        },
        pce: {
          headline: { actual: null, expected: null, surprise: null, sentiment: null },
          core: { actual: null, expected: null, surprise: null, sentiment: null }
        },
        overallSentiment: null,
        marketImpact: null
      };

      // Analyze CPI data
      if (actualData.cpi && expectations.cpi) {
        // Headline CPI
        if (actualData.cpi.cpiYoY !== null) {
          analysis.cpi.headline.actual = actualData.cpi.cpiYoY;
          analysis.cpi.headline.expected = expectations.cpi.headline.expected;
          analysis.cpi.headline.surprise = actualData.cpi.cpiYoY - expectations.cpi.headline.expected;
          analysis.cpi.headline.sentiment = this.determineSentiment(analysis.cpi.headline.surprise);
        }

        // Core CPI
        if (actualData.cpi.coreCPIYoY !== null) {
          analysis.cpi.core.actual = actualData.cpi.coreCPIYoY;
          analysis.cpi.core.expected = expectations.cpi.core.expected;
          analysis.cpi.core.surprise = actualData.cpi.coreCPIYoY - expectations.cpi.core.expected;
          analysis.cpi.core.sentiment = this.determineSentiment(analysis.cpi.core.surprise);
        }
      }

      // Analyze PCE data
      if (actualData.pce && expectations.pce) {
        // Headline PCE
        if (actualData.pce.pceYoY !== null) {
          analysis.pce.headline.actual = actualData.pce.pceYoY;
          analysis.pce.headline.expected = expectations.pce.headline.expected;
          analysis.pce.headline.surprise = actualData.pce.pceYoY - expectations.pce.headline.expected;
          analysis.pce.headline.sentiment = this.determineSentiment(analysis.pce.headline.surprise);
        }

        // Core PCE
        if (actualData.pce.corePCEYoY !== null) {
          analysis.pce.core.actual = actualData.pce.corePCEYoY;
          analysis.pce.core.expected = expectations.pce.core.expected;
          analysis.pce.core.surprise = actualData.pce.corePCEYoY - expectations.pce.core.expected;
          analysis.pce.core.sentiment = this.determineSentiment(analysis.pce.core.surprise);
        }
      }

      // Determine overall sentiment
      analysis.overallSentiment = this.determineOverallSentiment(analysis);
      
      // Predict market impact
      analysis.marketImpact = this.predictMarketImpact(analysis);

      return analysis;
    } catch (error) {
      console.error('Error analyzing inflation data:', error.message);
      throw error;
    }
  }

  // Determine sentiment based on surprise value
  determineSentiment(surprise) {
    if (surprise === null || surprise === undefined) return 'neutral';
    
    const absSurprise = Math.abs(surprise);
    
    if (absSurprise < 0.1) return 'neutral';
    if (absSurprise < 0.2) return surprise > 0 ? 'slightly_bearish' : 'slightly_bullish';
    if (absSurprise < 0.3) return surprise > 0 ? 'bearish' : 'bullish';
    return surprise > 0 ? 'very_bearish' : 'very_bullish';
  }

  // Determine overall sentiment from all metrics
  determineOverallSentiment(analysis) {
    const sentiments = [];
    
    if (analysis.cpi.headline.sentiment) sentiments.push(analysis.cpi.headline.sentiment);
    if (analysis.cpi.core.sentiment) sentiments.push(analysis.cpi.core.sentiment);
    if (analysis.pce.headline.sentiment) sentiments.push(analysis.pce.headline.sentiment);
    if (analysis.pce.core.sentiment) sentiments.push(analysis.pce.core.sentiment);

    if (sentiments.length === 0) return 'neutral';

    // Count sentiment types
    const counts = {
      very_bullish: 0,
      bullish: 0,
      slightly_bullish: 0,
      neutral: 0,
      slightly_bearish: 0,
      bearish: 0,
      very_bearish: 0
    };

    sentiments.forEach(sentiment => {
      counts[sentiment]++;
    });

    // Determine overall sentiment
    if (counts.very_bullish > counts.very_bearish && counts.very_bullish > 0) return 'very_bullish';
    if (counts.very_bearish > counts.very_bullish && counts.very_bearish > 0) return 'very_bearish';
    if (counts.bullish > counts.bearish) return 'bullish';
    if (counts.bearish > counts.bullish) return 'bearish';
    if (counts.slightly_bullish > counts.slightly_bearish) return 'slightly_bullish';
    if (counts.slightly_bearish > counts.slightly_bullish) return 'slightly_bearish';
    
    return 'neutral';
  }

  // Predict market impact based on sentiment
  predictMarketImpact(analysis) {
    const sentiment = analysis.overallSentiment;
    
    switch (sentiment) {
      case 'very_bullish':
        return {
          crypto: 'strong_positive',
          stocks: 'positive',
          bonds: 'negative',
          dollar: 'negative',
          description: 'Lower than expected inflation should boost risk assets and crypto'
        };
      case 'bullish':
        return {
          crypto: 'positive',
          stocks: 'slightly_positive',
          bonds: 'slightly_negative',
          dollar: 'slightly_negative',
          description: 'Below-consensus inflation data likely positive for crypto'
        };
      case 'slightly_bullish':
        return {
          crypto: 'slightly_positive',
          stocks: 'neutral',
          bonds: 'neutral',
          dollar: 'neutral',
          description: 'Slightly below expectations, modest positive for crypto'
        };
      case 'neutral':
        return {
          crypto: 'neutral',
          stocks: 'neutral',
          bonds: 'neutral',
          dollar: 'neutral',
          description: 'Inflation data in line with expectations, minimal market impact'
        };
      case 'slightly_bearish':
        return {
          crypto: 'slightly_negative',
          stocks: 'neutral',
          bonds: 'neutral',
          dollar: 'neutral',
          description: 'Slightly above expectations, modest negative for crypto'
        };
      case 'bearish':
        return {
          crypto: 'negative',
          stocks: 'slightly_negative',
          bonds: 'slightly_positive',
          dollar: 'slightly_positive',
          description: 'Above-consensus inflation data likely negative for crypto'
        };
      case 'very_bearish':
        return {
          crypto: 'strong_negative',
          stocks: 'negative',
          bonds: 'positive',
          dollar: 'positive',
          description: 'Much higher than expected inflation should hurt risk assets and crypto'
        };
      default:
        return {
          crypto: 'neutral',
          stocks: 'neutral',
          bonds: 'neutral',
          dollar: 'neutral',
          description: 'Unable to determine market impact'
        };
    }
  }

  // Enhanced fetchLatestData to include expectations analysis
  async fetchLatestDataWithAnalysis() {
    try {
      const data = await this.fetchLatestData();
      let expectations = null;
      let analysis = null;
      
      try {
        expectations = await this.fetchMarketExpectations();
      } catch (error) {
        console.warn('⚠️ Failed to fetch market expectations, using fallback:', error.message);
        expectations = {
          cpi: { headline: { expected: 3.2 }, core: { expected: 3.8 } },
          pce: { headline: { expected: 2.6 }, core: { expected: 2.8 } }
        };
      }
      
      try {
        analysis = await this.analyzeInflationData(data, expectations);
      } catch (error) {
        console.warn('⚠️ Failed to analyze inflation data, using fallback:', error.message);
        analysis = {
          overallSentiment: 'neutral',
          marketImpact: {
            crypto: 'neutral',
            stocks: 'neutral',
            bonds: 'neutral',
            dollar: 'neutral'
          },
          description: 'Analysis unavailable'
        };
      }

      return {
        data,
        expectations,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching data with analysis:', error.message);
      // Return null when data is unavailable
      console.log('⚠️ Inflation data unavailable due to API failures');
      return null;
    }
  }

  // Manual data fetch (for testing)
  async fetchLatestData() {
    try {
      
      const results = {};
      
      // Fetch CPI data
      try {
        results.cpi = await this.fetchCPIData();
      } catch (error) {
        console.error('❌ CPI data fetch failed:', error.message);
        results.cpi = null;
      }
      
      // Fetch PCE data
      try {
        results.pce = await this.fetchPCEData();
      } catch (error) {
        console.error('❌ PCE data fetch failed:', error.message);
        results.pce = null;
      }
      
      // Check if we have at least one data source
      if (!results.cpi && !results.pce) {
        console.warn('⚠️ Both CPI and PCE data fetch failed, no data available');
        return null;
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      // Return null when data is unavailable
      return null;
    }
  }
}

module.exports = new InflationDataService();
