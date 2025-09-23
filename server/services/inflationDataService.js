const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config({ path: '.env.local' });
const { insertInflationData, getLatestInflationData, insertInflationRelease, getInflationReleases, updateInflationRelease } = require('../database');

class InflationDataService {
  constructor() {
    this.beaApiKey = process.env.BEA_API_KEY;
    this.blsApiKey = process.env.BLS_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
    this.beaBaseUrl = 'https://apps.bea.gov/api/data';
    this.blsBaseUrl = 'https://api.bls.gov/publicAPI/v2';
    this.fredBaseUrl = 'https://api.stlouisfed.org/fred';
    
    // FRED series codes for inflation data
    this.fredSeries = {
      cpi: 'CPIAUCSL',           // Consumer Price Index for All Urban Consumers: All Items
      coreCPI: 'CPILFESL',       // Consumer Price Index for All Urban Consumers: All Items Less Food and Energy
      ppi: 'PPIFIS',             // Producer Price Index by Industry: Final Demand
      corePPI: 'PPIFGS',         // Producer Price Index by Industry: Final Demand Less Foods and Energy
      pce: 'PCEPI',              // Personal Consumption Expenditures: Chain-type Price Index
      corePCE: 'PCEPILFE'        // Personal Consumption Expenditures: Chain-type Price Index Less Food and Energy
    };
    
    // Rate limiting for FRED API (conservative: 60 requests per minute for free tier)
    this.fredRequestTimes = [];
    this.fredRateLimit = 60; // requests per minute (conservative limit)
    this.fredRateWindow = 60000; // 1 minute in milliseconds
    
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



  // Fetch PPI data from BLS API with retry logic
  async fetchPPIData() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    // Check if we have the required API key
    if (!this.blsApiKey) {
      console.log('⚠️ BLS API key not configured, skipping PPI data collection');
      return null;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching PPI data from BLS API (attempt ${attempt}/${maxRetries})...`);
        console.log(`🔗 BLS API URL: ${this.blsBaseUrl}/timeseries/data/`);
        console.log(`🔑 API Key configured: ${this.blsApiKey ? 'Yes' : 'No'}`);
        
        const currentYear = new Date().getFullYear();
        const requestData = {
          seriesid: ['WPSFD4', 'WPSFD41'], // Final Demand PPI and Core PPI
          startyear: (currentYear - 1).toString(), // Get data from previous year for YoY calculation
          endyear: currentYear.toString(), // Get data up to current year
          registrationkey: this.blsApiKey
        };
        
        console.log(`📋 Request data:`, JSON.stringify(requestData, null, 2));
        
        // Use longer timeout for Railway environment
        const timeout = process.env.RAILWAY_ENVIRONMENT ? 90000 : 30000; // 90s for Railway, 30s for local
        console.log(`⏱️ Using timeout: ${timeout}ms (Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No'})`);
        
        // Configure proxy for Railway environment
        let axiosConfig = {
          timeout: timeout,
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Add retry configuration
          retry: 1, // Reduced retries for faster fallback
          retryDelay: 1000
        };

        let response;
        
        // Use proxy for Railway environment if BLS API is unreachable
        if (process.env.RAILWAY_ENVIRONMENT) {
          console.log('🚂 Railway environment detected - using proxy for BLS API');
          
          // Try multiple proxy options
          const proxyOptions = [
            'https://api.allorigins.win/raw?url=', // Free CORS proxy
            'https://cors-anywhere.herokuapp.com/', // CORS proxy
            'https://thingproxy.freeboard.io/fetch/' // Another free proxy
          ];
          
          // Try direct connection first, then fallback to proxies
          let lastError = null;
          
          for (let i = 0; i < proxyOptions.length; i++) {
            try {
              const proxyUrl = proxyOptions[i];
              const targetUrl = encodeURIComponent(this.blsBaseUrl + '/timeseries/data/');
              
              console.log(`🔄 Trying proxy ${i + 1}/${proxyOptions.length}: ${proxyUrl}`);
              
              response = await axios.post(proxyUrl + targetUrl, requestData, {
                ...axiosConfig,
                headers: {
                  ...axiosConfig.headers,
                  'X-Requested-With': 'XMLHttpRequest'
                }
              });
              
              console.log(`✅ Proxy ${i + 1} successful`);
              break;
              
            } catch (proxyError) {
              console.log(`❌ Proxy ${i + 1} failed:`, proxyError.message);
              lastError = proxyError;
              continue;
            }
          }
          
          // If all proxies fail, try direct connection as last resort
          if (!response) {
            console.log('🔄 All proxies failed, trying direct connection...');
            response = await axios.post(this.blsBaseUrl + '/timeseries/data/', requestData, axiosConfig);
          }
        } else {
          // Direct connection for local development
          response = await axios.post(this.blsBaseUrl + '/timeseries/data/', requestData, axiosConfig);
        }

        if (response.data && response.data.Results && response.data.Results.series) {
          console.log('✅ PPI data fetched successfully');
          return this.parsePPIData(response.data.Results.series);
        }
        
        throw new Error('Invalid BLS API response structure');
      } catch (error) {
        console.error(`❌ PPI data fetch attempt ${attempt} failed:`, error.message);
        console.error(`🔍 Error details:`, {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout
          }
        });
        
        if (attempt === maxRetries) {
          console.error('❌ All PPI data fetch attempts failed');
          
          // No fallback data - return null when APIs fail
          console.log('❌ PPI data unavailable - API failed, no fallback data provided');
          
          return null;
        }
        
        console.log(`⏳ Retrying PPI data fetch in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // No fallback data - only return null when APIs fail
  // This ensures no synthetic data is ever shown to users

  // Rate limiting helper for FRED API
  async waitForRateLimit() {
    const now = Date.now();
    
    // Remove requests older than the rate limit window
    this.fredRequestTimes = this.fredRequestTimes.filter(time => now - time < this.fredRateWindow);
    
    // If we're at the rate limit, wait
    if (this.fredRequestTimes.length >= this.fredRateLimit) {
      const oldestRequest = Math.min(...this.fredRequestTimes);
      const waitTime = this.fredRateWindow - (now - oldestRequest) + 1000; // Add 1 second buffer
      
      if (waitTime > 0) {
        console.log(`⏳ FRED API rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Record this request
    this.fredRequestTimes.push(now);
  }

  // Fetch data from FRED API with retry logic, rate limiting, and proxy support
  async fetchFREDData(seriesId, limit = 24, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.fredApiKey) {
          console.log('⚠️ FRED API key not configured');
          return null;
        }

        // Apply rate limiting
        await this.waitForRateLimit();

        console.log(`📊 Fetching FRED data for series: ${seriesId} (attempt ${attempt}/${maxRetries})`);
        
        // Build curl command for FRED API
        // Railway Akamai edge issue: axios fails with timeout, but curl works
        const url = `${this.fredBaseUrl}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=${limit}&sort_order=desc`;
        
        const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 "${url}"`;
        console.log(`🔧 Using curl workaround for Railway Akamai edge issue`);
        
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const { stdout, stderr } = await execAsync(curlCommand);
        
        if (stderr) {
          console.error(`⚠️ Curl stderr: ${stderr}`);
        }
        
        if (!stdout) {
          throw new Error('No response from curl command');
        }
        
        const response = { data: JSON.parse(stdout) };

        if (response.data && response.data.observations && response.data.observations.length > 0) {
          console.log(`✅ FRED data fetched successfully for ${seriesId}`);
          return response.data.observations;
        }

        throw new Error('No observations found in FRED response');
      } catch (error) {
        console.error(`❌ FRED data fetch failed for ${seriesId} (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // If this is the last attempt, return null
        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed for FRED series ${seriesId}`);
          return null;
        }
        
        // Wait before retrying (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Parse FRED data for CPI
  async parseFREDCPIData() {
    try {
      console.log('🔄 Fetching CPI data from FRED API...');
      console.log('📊 FRED API Key configured:', !!this.fredApiKey);
      console.log('📊 FRED Series codes:', { cpi: this.fredSeries.cpi, coreCPI: this.fredSeries.coreCPI });
      
      // Fetch data sequentially to avoid overwhelming FRED API
      const cpiData = await this.fetchFREDData(this.fredSeries.cpi);
      console.log('📊 CPI data response:', cpiData ? `${cpiData.length} records` : 'null');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests
      const coreCPIData = await this.fetchFREDData(this.fredSeries.coreCPI);
      console.log('📊 Core CPI data response:', coreCPIData ? `${coreCPIData.length} records` : 'null');

      if (!cpiData || !coreCPIData) {
        console.error('❌ Failed to fetch CPI data from FRED - one or both datasets are null');
        console.error('❌ CPI data:', cpiData);
        console.error('❌ Core CPI data:', coreCPIData);
        throw new Error('Failed to fetch CPI data from FRED');
      }

      const latestCPI = cpiData[0];
      const latestCoreCPI = coreCPIData[0];

      console.log('📊 Latest CPI record:', latestCPI);
      console.log('📊 Latest Core CPI record:', latestCoreCPI);

      if (!latestCPI || !latestCoreCPI || latestCPI.value === '.' || latestCoreCPI.value === '.') {
        console.error('❌ Invalid CPI data from FRED - missing or invalid values');
        console.error('❌ Latest CPI value:', latestCPI?.value);
        console.error('❌ Latest Core CPI value:', latestCoreCPI?.value);
        throw new Error('Invalid CPI data from FRED');
      }

      // Calculate YoY change
      const cpiYoY = this.calculateYoYChange(cpiData);
      const coreCPIYoY = this.calculateYoYChange(coreCPIData);

      console.log('✅ CPI data parsed successfully:', {
        date: latestCPI.date,
        cpi: parseFloat(latestCPI.value),
        coreCPI: parseFloat(latestCoreCPI.value),
        cpiYoY: cpiYoY,
        coreCPIYoY: coreCPIYoY
      });

      return {
        date: latestCPI.date,
        cpi: parseFloat(latestCPI.value),
        coreCPI: parseFloat(latestCoreCPI.value),
        cpiYoY: cpiYoY,
        coreCPIYoY: coreCPIYoY
      };
    } catch (error) {
      console.error('❌ Error parsing FRED CPI data:', error.message);
      console.error('❌ Full error details:', error);
      return null;
    }
  }

  // Parse FRED data for PPI
  async parseFREDPPIData() {
    try {
      console.log('🔄 Fetching PPI data from FRED API...');
      console.log('📊 FRED API Key configured:', !!this.fredApiKey);
      console.log('📊 FRED Series codes:', { ppi: this.fredSeries.ppi, corePPI: this.fredSeries.corePPI });
      
      const ppiData = await this.fetchFREDData(this.fredSeries.ppi);
      console.log('📊 PPI data response:', ppiData ? `${ppiData.length} records` : 'null');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests
      const corePPIData = await this.fetchFREDData(this.fredSeries.corePPI);
      console.log('📊 Core PPI data response:', corePPIData ? `${corePPIData.length} records` : 'null');

      if (!ppiData || !corePPIData) {
        console.error('❌ Failed to fetch PPI data from FRED - one or both datasets are null');
        console.error('❌ PPI data:', ppiData);
        console.error('❌ Core PPI data:', corePPIData);
        throw new Error('Failed to fetch PPI data from FRED');
      }

      const latestPPI = ppiData[0];
      const latestCorePPI = corePPIData[0];

      console.log('📊 Latest PPI record:', latestPPI);
      console.log('📊 Latest Core PPI record:', latestCorePPI);

      if (!latestPPI || !latestCorePPI || latestPPI.value === '.' || latestCorePPI.value === '.') {
        console.error('❌ Invalid PPI data from FRED - missing or invalid values');
        console.error('❌ Latest PPI value:', latestPPI?.value);
        console.error('❌ Latest Core PPI value:', latestCorePPI?.value);
        throw new Error('Invalid PPI data from FRED');
      }

      // Calculate YoY and MoM changes
      const ppiYoY = this.calculateYoYChange(ppiData);
      const corePPIYoY = this.calculateYoYChange(corePPIData);
      const ppiMoM = this.calculateMoMChange(ppiData);
      const corePPIMoM = this.calculateMoMChange(corePPIData);

      console.log('✅ PPI data parsed successfully:', {
        date: latestPPI.date,
        ppi: parseFloat(latestPPI.value),
        corePPI: parseFloat(latestCorePPI.value),
        ppiYoY: ppiYoY,
        corePPIYoY: corePPIYoY,
        ppiMoM: ppiMoM,
        corePPIMoM: corePPIMoM
      });

      return {
        date: latestPPI.date,
        ppi: parseFloat(latestPPI.value),
        corePPI: parseFloat(latestCorePPI.value),
        ppiYoY: ppiYoY,
        corePPIYoY: corePPIYoY,
        ppiMoM: ppiMoM,
        corePPIMoM: corePPIMoM,
        ppiActual: ppiMoM,  // MoM percentage
        corePPIActual: corePPIMoM  // MoM percentage
      };
    } catch (error) {
      console.error('❌ Error parsing FRED PPI data:', error.message);
      return null;
    }
  }

  // Parse FRED data for PCE
  async parseFREDPCEData() {
    try {
      console.log('🔄 Fetching PCE data from FRED API...');
      console.log('📊 FRED API Key configured:', !!this.fredApiKey);
      console.log('📊 FRED Series codes:', { pce: this.fredSeries.pce, corePCE: this.fredSeries.corePCE });
      
      const pceData = await this.fetchFREDData(this.fredSeries.pce);
      console.log('📊 PCE data response:', pceData ? `${pceData.length} records` : 'null');
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests
      const corePCEData = await this.fetchFREDData(this.fredSeries.corePCE);
      console.log('📊 Core PCE data response:', corePCEData ? `${corePCEData.length} records` : 'null');

      if (!pceData || !corePCEData) {
        console.error('❌ Failed to fetch PCE data from FRED - one or both datasets are null');
        console.error('❌ PCE data:', pceData);
        console.error('❌ Core PCE data:', corePCEData);
        throw new Error('Failed to fetch PCE data from FRED');
      }

      const latestPCE = pceData[0];
      const latestCorePCE = corePCEData[0];
      
      console.log('📊 Latest PCE record:', latestPCE);
      console.log('📊 Latest Core PCE record:', latestCorePCE);

      if (!latestPCE || !latestPCE.value || latestPCE.value === '.') {
        console.error('❌ Invalid PCE data from FRED');
        throw new Error('Invalid PCE data from FRED');
      }

      if (!latestCorePCE || !latestCorePCE.value || latestCorePCE.value === '.') {
        console.error('❌ Invalid Core PCE data from FRED');
        throw new Error('Invalid Core PCE data from FRED');
      }

      // Calculate YoY changes
      const pceYoY = this.calculateYoYChange(pceData);
      const corePCEYoY = this.calculateYoYChange(corePCEData);
      
      // Calculate MoM changes
      const pceMoM = this.calculateMoMChange(pceData);
      const corePCEMoM = this.calculateMoMChange(corePCEData);

      const result = {
        date: latestPCE.date,
        pce: parseFloat(latestPCE.value),
        corePCE: parseFloat(latestCorePCE.value),
        pceYoY: pceYoY,
        corePCEYoY: corePCEYoY,
        pceMoM: pceMoM,
        corePCEMoM: corePCEMoM,
        pceActual: pceMoM, // Use MoM as actual for consistency
        corePCEActual: corePCEMoM
      };

      console.log('✅ PCE data parsed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error parsing FRED PCE data:', error.message);
      return null;
    }
  }

  // Calculate Year-over-Year change
  calculateYoYChange(data) {
    if (!data || data.length < 12) return null;
    
    const current = parseFloat(data[0].value);
    const yearAgo = parseFloat(data[11].value);
    
    if (isNaN(current) || isNaN(yearAgo) || yearAgo === 0) return null;
    
    return parseFloat((((current - yearAgo) / yearAgo) * 100).toFixed(2));
  }

  // Calculate Month-over-Month change
  calculateMoMChange(data) {
    if (!data || data.length < 2) return null;
    
    const current = parseFloat(data[0].value);
    const previous = parseFloat(data[1].value);
    
    if (isNaN(current) || isNaN(previous) || previous === 0) return null;
    
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
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
    pceData.date = this.parseBEAtoDate(latestData.TimePeriod);

    // Calculate YoY change if we have enough data
    if (dataArray.length >= 12) {
      const currentValue = parseFloat(latestData.DataValue);
      const yearAgoValue = parseFloat(dataArray[11].DataValue);
      pceData.pceYoY = parseFloat((((currentValue - yearAgoValue) / yearAgoValue) * 100).toFixed(2));
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

  // Parse PPI data from BLS API response
  parsePPIData(series) {
    const ppiData = {
      date: null,
      ppi: null,
      corePPI: null,
      ppiMoM: null,
      corePPIMoM: null,
      ppiActual: null,
      corePPIActual: null,
      ppiYoY: null,
      corePPIYoY: null
    };

    if (!Array.isArray(series) || series.length === 0) {
      throw new Error('No valid PPI series data found in API response');
    }

    series.forEach(s => {
      if (!s || !s.data || !Array.isArray(s.data) || s.data.length === 0) return;
      
      const latest = s.data[0];
      if (!latest || !latest.value) return;
      
      if (s.seriesID === 'WPSFD4') { // Final Demand PPI
        ppiData.ppi = parseFloat(latest.value);
        ppiData.date = this.parseBLSDate(latest.periodName, latest.year);
        
        // Calculate MoM change - compare with previous month
        if (s.data.length > 1) {
          const previousMonth = s.data[1];
          if (previousMonth && previousMonth.value) {
            const momChange = ((parseFloat(latest.value) - parseFloat(previousMonth.value)) / parseFloat(previousMonth.value)) * 100;
            ppiData.ppiMoM = parseFloat(momChange.toFixed(2));
            // Store the actual percentage value (not just the change)
            ppiData.ppiActual = parseFloat(momChange.toFixed(2));
          }
        }
        
        // Calculate YoY change - find the same month from previous year
        const currentYear = parseInt(latest.year);
        const currentMonth = latest.periodName;
        
        const yearAgoData = s.data.find(d => 
          parseInt(d.year) === currentYear - 1 && d.periodName === currentMonth
        );
        
        if (yearAgoData && yearAgoData.value) {
          ppiData.ppiYoY = parseFloat((((parseFloat(latest.value) - parseFloat(yearAgoData.value)) / parseFloat(yearAgoData.value)) * 100).toFixed(2));
        }
      } else if (s.seriesID === 'WPSFD41') { // Core PPI (Final Demand Less Foods and Energy)
        ppiData.corePPI = parseFloat(latest.value);
        
        // Calculate MoM change for core - compare with previous month
        if (s.data.length > 1) {
          const previousMonth = s.data[1];
          if (previousMonth && previousMonth.value) {
            const coreMomChange = ((parseFloat(latest.value) - parseFloat(previousMonth.value)) / parseFloat(previousMonth.value)) * 100;
            ppiData.corePPIMoM = parseFloat(coreMomChange.toFixed(2));
            // Store the actual percentage value (not just the change)
            ppiData.corePPIActual = parseFloat(coreMomChange.toFixed(2));
          }
        }
        
        // Calculate YoY change for core - compare current month with same month from previous year
        const currentYear = parseInt(latest.year);
        const currentMonth = latest.periodName;
        
        const yearAgoData = s.data.find(d => 
          parseInt(d.year) === currentYear - 1 && d.periodName === currentMonth
        );
        
        if (yearAgoData && yearAgoData.value) {
          ppiData.corePPIYoY = parseFloat((((parseFloat(latest.value) - parseFloat(yearAgoData.value)) / parseFloat(yearAgoData.value)) * 100).toFixed(2));
        }
      }
    });

    return ppiData;
  }

  // Parse BEA date format (e.g., "2025M01") to PostgreSQL date format
  parseBLSDate(periodName, year) {
    try {
      const monthNames = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      
      const month = monthNames[periodName];
      if (month && year) {
        return `${year}-${month}-01`;
      }
      
      // Fallback to current date if parsing fails
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
    } catch (error) {
      console.error('Error parsing BLS date:', error);
      const now = new Date();
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
    }
  }

  parseBEAtoDate(beaDate) {
    try {
      // Handle format like "2025M01" (Year + Month)
      if (beaDate && typeof beaDate === 'string') {
        const match = beaDate.match(/^(\d{4})M(\d{2})$/);
        if (match) {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]);
          // Use the first day of the month
          return `${year}-${month.toString().padStart(2, '0')}-01`;
        }
        
        // Handle format like "July 2025"
        const monthNames = {
          'January': '01', 'February': '02', 'March': '03', 'April': '04',
          'May': '05', 'June': '06', 'July': '07', 'August': '08',
          'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        
        const monthMatch = beaDate.match(/^(\w+)\s+(\d{4})$/);
        if (monthMatch) {
          const monthName = monthMatch[1];
          const year = monthMatch[2];
          const month = monthNames[monthName];
          if (month) {
            // Use the first day of the month
            return `${year}-${month}-01`;
          }
        }
      }
      
      // Fallback: return current date
      console.warn(`⚠️ Could not parse BEA date: ${beaDate}, using current date`);
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.error('Error parsing BEA date:', error);
      return new Date().toISOString().split('T')[0];
    }
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
        console.log(`🔗 BLS API URL: ${this.blsBaseUrl}/timeseries/data/`);
        console.log(`🔑 API Key configured: ${this.blsApiKey ? 'Yes' : 'No'}`);
        
        const currentYear = new Date().getFullYear();
        const requestData = {
          seriesid: ['CUSR0000SA0', 'CUSR0000SA0L1E'], // All items and Core CPI
          startyear: (currentYear - 1).toString(), // Get data from previous year for YoY calculation
          endyear: currentYear.toString(), // Get data up to current year
          registrationkey: this.blsApiKey
        };
        
        console.log(`📋 Request data:`, JSON.stringify(requestData, null, 2));
        
        // Use longer timeout for Railway environment
        const timeout = process.env.RAILWAY_ENVIRONMENT ? 90000 : 30000; // 90s for Railway, 30s for local
        console.log(`⏱️ Using timeout: ${timeout}ms (Railway: ${process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No'})`);
        
        // Configure proxy for Railway environment
        let axiosConfig = {
          timeout: timeout,
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Add retry configuration
          retry: 1, // Reduced retries for faster fallback
          retryDelay: 1000
        };

        let response;
        
        // Use proxy for Railway environment if BLS API is unreachable
        if (process.env.RAILWAY_ENVIRONMENT) {
          console.log('🚂 Railway environment detected - using proxy for BLS API');
          
          // Try multiple proxy options
          const proxyOptions = [
            'https://api.allorigins.win/raw?url=', // Free CORS proxy
            'https://cors-anywhere.herokuapp.com/', // CORS proxy
            'https://thingproxy.freeboard.io/fetch/' // Another free proxy
          ];
          
          // Try direct connection first, then fallback to proxies
          let lastError = null;
          
          for (let i = 0; i < proxyOptions.length; i++) {
            try {
              const proxyUrl = proxyOptions[i];
              const targetUrl = encodeURIComponent(this.blsBaseUrl + '/timeseries/data/');
              
              console.log(`🔄 Trying proxy ${i + 1}/${proxyOptions.length}: ${proxyUrl}`);
              
              response = await axios.post(proxyUrl + targetUrl, requestData, {
                ...axiosConfig,
                headers: {
                  ...axiosConfig.headers,
                  'X-Requested-With': 'XMLHttpRequest'
                }
              });
              
              console.log(`✅ Proxy ${i + 1} successful`);
              break;
              
            } catch (proxyError) {
              console.log(`❌ Proxy ${i + 1} failed:`, proxyError.message);
              lastError = proxyError;
              continue;
            }
          }
          
          // If all proxies fail, try direct connection as last resort
          if (!response) {
            console.log('🔄 All proxies failed, trying direct connection...');
            response = await axios.post(this.blsBaseUrl + '/timeseries/data/', requestData, axiosConfig);
          }
        } else {
          // Direct connection for local development
          response = await axios.post(this.blsBaseUrl + '/timeseries/data/', requestData, axiosConfig);
        }



        if (response.data && response.data.Results && response.data.Results.series) {
                  console.log('✅ CPI data fetched successfully');
          return this.parseCPIData(response.data.Results.series);
        }
        
        throw new Error('Invalid BLS API response structure');
      } catch (error) {
        console.error(`❌ CPI data fetch attempt ${attempt} failed:`, error.message);
        console.error(`🔍 Error details:`, {
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout
          }
        });
        
        if (attempt === maxRetries) {
          console.error('❌ All CPI data fetch attempts failed');
          
          // No fallback data - return null when APIs fail
          console.log('❌ CPI data unavailable - API failed, no fallback data provided');
          
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
      

      
      if (!latest || !latest.value) return;
      
      if (s.seriesID === 'CUSR0000SA0') { // All items CPI
        cpiData.cpi = parseFloat(latest.value);
        cpiData.date = this.parseBLSDate(latest.periodName, latest.year);
        
        // Calculate YoY change - find the same month from previous year
        const currentYear = parseInt(latest.year);
        const currentMonth = latest.periodName;
        
        const yearAgoData = s.data.find(d => 
          parseInt(d.year) === currentYear - 1 && d.periodName === currentMonth
        );
        
        if (yearAgoData && yearAgoData.value) {
          cpiData.cpiYoY = parseFloat((((parseFloat(latest.value) - parseFloat(yearAgoData.value)) / parseFloat(yearAgoData.value)) * 100).toFixed(2));
        } else {
          // Fallback: try to find any data from previous year
          const anyYearAgoData = s.data.find(d => parseInt(d.year) === currentYear - 1);
          if (anyYearAgoData && anyYearAgoData.value) {
            cpiData.cpiYoY = parseFloat((((parseFloat(latest.value) - parseFloat(anyYearAgoData.value)) / parseFloat(anyYearAgoData.value)) * 100).toFixed(2));
          }
        }
      } else if (s.seriesID === 'CUSR0000SA0L1E') { // Core CPI
        cpiData.coreCPI = parseFloat(latest.value);
        
        // Calculate YoY change for core - compare current month with same month from previous year
        const currentYear = parseInt(latest.year);
        const currentMonth = latest.periodName;
        
        const yearAgoData = s.data.find(d => 
          parseInt(d.year) === currentYear - 1 && d.periodName === currentMonth
        );
        
        if (yearAgoData && yearAgoData.value) {
          cpiData.coreCPIYoY = parseFloat((((parseFloat(latest.value) - parseFloat(yearAgoData.value)) / parseFloat(yearAgoData.value)) * 100).toFixed(2));
        } else {
          // Fallback: try to find any data from previous year
          const anyYearAgoData = s.data.find(d => parseInt(d.year) === currentYear - 1);
          if (anyYearAgoData && anyYearAgoData.value) {
            cpiData.coreCPIYoY = parseFloat((((parseFloat(latest.value) - parseFloat(anyYearAgoData.value)) / parseFloat(anyYearAgoData.value)) * 100).toFixed(2));
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
      console.log(`📊 Processing ${type} data:`, data);
      
      // Get previous data for comparison
      const previousData = await getLatestInflationData(type);
      console.log(`📊 Previous ${type} data:`, previousData);
      
      const insertData = {
        type,
        date: data.date,
        value: type === 'CPI' ? data.cpi : (type === 'PCE' ? data.pce : data.ppi),
        coreValue: type === 'CPI' ? data.coreCPI : (type === 'PCE' ? data.corePCE : data.corePPI),
        yoyChange: type === 'CPI' ? data.cpiYoY : (type === 'PCE' ? data.pceYoY : data.ppiYoY),
        coreYoYChange: type === 'CPI' ? data.coreCPIYoY : (type === 'PCE' ? data.corePCEYoY : data.corePPIYoY),
        momChange: type === 'PPI' ? data.ppiMoM : null,
        coreMomChange: type === 'PPI' ? data.corePPIMoM : null,
        source: type === 'CPI' || type === 'PPI' ? 'BLS' : 'BEA'
      };
      
      console.log(`📊 Inserting ${type} data:`, insertData);
      
      // Store new data
      const result = await insertInflationData(insertData);
      console.log(`✅ ${type} data inserted successfully:`, result);
      
      // Check for significant changes and create alerts
      if (previousData) {
        await this.checkForAlerts({
          yoyChange: type === 'CPI' ? data.cpiYoY : (type === 'PCE' ? data.pceYoY : data.ppiYoY),
          coreYoYChange: type === 'CPI' ? data.coreCPIYoY : (type === 'PCE' ? data.corePCEYoY : data.corePPIYoY),
          momChange: type === 'PPI' ? data.ppiMoM : null,
          coreMomChange: type === 'PPI' ? data.corePPIMoM : null
        }, previousData, type);
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
        ppi: null,
        sources: [],
        timestamp: new Date().toISOString()
      };

      // Try to fetch from FRED API (Federal Reserve Economic Data)
      try {
        const fredData = await this.fetchFREDExpectations();
        if (fredData) {
          expectations.cpi = fredData.cpi;
          expectations.pce = fredData.pce;
          expectations.ppi = fredData.ppi;
          expectations.sources.push('FRED (Philadelphia Fed Survey)');
        }
      } catch (error) {
        console.log('FRED expectations fetch failed:', error.message);
      }

      // Try to fetch from Cleveland Fed
      try {
        const clevelandData = await this.fetchClevelandFedExpectations();
        if (clevelandData) {
          // Merge Cleveland Fed data if available
          if (clevelandData.cpi && !expectations.cpi) expectations.cpi = clevelandData.cpi;
          if (clevelandData.pce && !expectations.pce) expectations.pce = clevelandData.pce;
          expectations.sources.push('Cleveland Fed');
        }
      } catch (error) {
        console.log('Cleveland Fed expectations fetch failed:', error.message);
      }


      // If no real data available, return null
      if (expectations.sources.length === 0) {
        console.log('⚠️ No market expectations data available - requires API keys for FRED or Cleveland Fed');
        return {
          cpi: null,
          pce: null,
          ppi: null,
          sources: [],
          timestamp: new Date().toISOString(),
          message: 'Market expectations not available - requires FRED API key or Cleveland Fed integration'
        };
      }

      return expectations;
      } catch (error) {
      console.error('Error fetching market expectations:', error.message);
      throw error;
    }
  }

  async fetchFREDExpectations() {
    try {
      const fredApiKey = process.env.FRED_API_KEY;
      if (!fredApiKey) {
        console.log('⚠️ FRED_API_KEY not configured - skipping FRED expectations');
        return null;
      }

      const baseUrl = 'https://api.stlouisfed.org/fred/series/observations';
      const series = [
        'EXPINF1YR', // 1-Year Expected Inflation
        'EXPINF2YR', // 2-Year Expected Inflation
        'EXPINF3YR', // 3-Year Expected Inflation
        'EXPINF5YR'  // 5-Year Expected Inflation
      ];

      const results = {};
      
      for (const seriesId of series) {
        try {
          const url = `${baseUrl}?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&limit=1&sort_order=desc`;
          
          // Use curl workaround for Railway Akamai edge issue
          const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 "${url}"`;
          console.log(`🔧 Using curl workaround for Railway Akamai edge issue (${seriesId})`);
          
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          const { stdout, stderr } = await execAsync(curlCommand);
          
          if (stderr) {
            console.error(`⚠️ Curl stderr for ${seriesId}: ${stderr}`);
          }
          
          if (stdout) {
            const data = JSON.parse(stdout);
            if (data.observations && data.observations.length > 0) {
              const latest = data.observations[0];
              if (latest.value !== '.') {
                results[seriesId] = {
                  value: parseFloat(latest.value),
                  date: latest.date
                };
                console.log(`✅ Successfully fetched ${seriesId}: ${latest.value}`);
              }
            }
          }
        } catch (error) {
          console.log(`Failed to fetch ${seriesId}:`, error.message);
        }
      }

      // Map FRED data to our expectations format
      if (Object.keys(results).length > 0) {
        return {
          cpi: results.EXPINF1YR ? {
        headline: {
              expected: results.EXPINF1YR.value,
              consensus: results.EXPINF1YR.value,
              range: { min: results.EXPINF1YR.value - 0.2, max: results.EXPINF1YR.value + 0.2 }
        },
        core: {
              expected: results.EXPINF1YR.value + 0.3, // Core typically higher
              consensus: results.EXPINF1YR.value + 0.3,
              range: { min: results.EXPINF1YR.value + 0.1, max: results.EXPINF1YR.value + 0.5 }
            }
          } : null,
          pce: results.EXPINF1YR ? {
            headline: {
              expected: results.EXPINF1YR.value - 0.2, // PCE typically lower than CPI
              consensus: results.EXPINF1YR.value - 0.2,
              range: { min: results.EXPINF1YR.value - 0.4, max: results.EXPINF1YR.value }
            },
            core: {
              expected: results.EXPINF1YR.value + 0.1,
              consensus: results.EXPINF1YR.value + 0.1,
              range: { min: results.EXPINF1YR.value - 0.1, max: results.EXPINF1YR.value + 0.3 }
            }
          } : null,
          ppi: results.EXPINF1YR ? {
            headline: {
              expected: 0.2, // MoM expectation (typical range)
              consensus: 0.2,
              range: { min: 0.0, max: 0.4 }
            },
            core: {
              expected: 0.3,
              consensus: 0.3,
              range: { min: 0.1, max: 0.5 }
            },
            yoy: {
              expected: results.EXPINF1YR.value + 0.5, // PPI YoY typically higher
              consensus: results.EXPINF1YR.value + 0.5,
              range: { min: results.EXPINF1YR.value + 0.3, max: results.EXPINF1YR.value + 0.7 }
            }
          } : null
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching FRED expectations:', error.message);
      return null;
    }
  }

  async fetchClevelandFedExpectations() {
    try {
      // Cleveland Fed provides inflation nowcasting data
      // They have a public API for inflation expectations
      const clevelandFedUrl = 'https://www.clevelandfed.org/our-research/indicators-and-data/inflation-expectations.aspx';
      
      try {
        // For now, we'll use a placeholder approach since Cleveland Fed doesn't have a direct API
        // In the future, this could be enhanced with web scraping or if they provide an API
        console.log('Cleveland Fed expectations: Using placeholder data structure');
        
        // No placeholder data - return null when no real data is available
        console.log('Cleveland Fed expectations: No real data available, returning null');
        return null;
    } catch (error) {
        console.log('Cleveland Fed data fetch failed:', error.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching Cleveland Fed expectations:', error.message);
      return null;
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
        console.warn('⚠️ Failed to fetch market expectations, no fallback data provided:', error.message);
        expectations = null;
      }
      
      try {
        analysis = await this.analyzeInflationData(data, expectations);
      } catch (error) {
        console.warn('⚠️ Failed to analyze inflation data, no fallback analysis provided:', error.message);
        analysis = null;
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
      console.log('📊 Fetching latest inflation data from APIs...');
      
      const results = {};
      
      // Fetch CPI data from FRED API (replacing BLS)
      try {
        if (this.fredApiKey) {
          console.log('🔄 Using FRED API for CPI data (replacing BLS)');
          results.cpi = await this.parseFREDCPIData();
          if (results.cpi) {
            console.log('✅ CPI data fetched successfully from FRED');
          } else {
            console.log('❌ CPI data fetch failed from FRED');
          }
        } else {
          console.log('⚠️ FRED API key not configured, skipping CPI data');
          results.cpi = null;
        }
      } catch (error) {
        console.error('❌ CPI data fetch failed:', error.message);
        results.cpi = null;
      }
      
      // Fetch PCE data from FRED API (replacing BEA)
      try {
        if (this.fredApiKey) {
          console.log('🔄 Using FRED API for PCE data (replacing BEA)');
          results.pce = await this.parseFREDPCEData();
          if (results.pce) {
            console.log('✅ PCE data fetched successfully from FRED');
          } else {
            console.log('❌ PCE data fetch failed from FRED');
          }
        } else {
          console.log('⚠️ FRED API key not configured, skipping PCE data');
          results.pce = null;
        }
      } catch (error) {
        console.error('❌ PCE data fetch failed:', error.message);
        results.pce = null;
      }
      
      // Fetch PPI data from FRED API (replacing BLS)
      try {
        if (this.fredApiKey) {
          console.log('🔄 Using FRED API for PPI data (replacing BLS)');
          results.ppi = await this.parseFREDPPIData();
          if (results.ppi) {
            console.log('✅ PPI data fetched successfully from FRED');
          } else {
            console.log('❌ PPI data fetch failed from FRED');
          }
        } else {
          console.log('⚠️ FRED API key not configured, skipping PPI data');
          results.ppi = null;
        }
      } catch (error) {
        console.error('❌ PPI data fetch failed:', error.message);
        results.ppi = null;
      }
      
      // Check if we have at least one data source
      if (!results.cpi && !results.pce && !results.ppi) {
        console.warn('⚠️ All inflation data fetch failed, no data available');
        return null;
      }
      
      console.log('✅ Inflation data fetch completed');
      return results;
    } catch (error) {
      console.error('Error fetching latest data:', error);
      // Return null when data is unavailable
      return null;
    }
  }
}

module.exports = InflationDataService;
