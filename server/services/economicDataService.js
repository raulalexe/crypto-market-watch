const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '.env.local' });
const { 
  insertInflationData, 
  getLatestInflationData, 
  insertInflationRelease, 
  getInflationReleases, 
  updateInflationRelease 
} = require('../database');
const InflationDataService = require('./inflationDataService');

class EconomicDataService {
  constructor() {
    this.beaApiKey = process.env.BEA_API_KEY;
    this.blsApiKey = process.env.BLS_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
    
    this.beaBaseUrl = 'https://apps.bea.gov/api/data';
    this.blsBaseUrl = 'https://api.bls.gov/publicAPI/v2';
    this.fredBaseUrl = 'https://api.stlouisfed.org/fred';
    
    this.errorLogger = new (require('./errorLogger'))();
    this.inflationDataService = new InflationDataService();
  }

  // ===== INFLATION DATA (FRED API) =====

  // Fetch PPI data using inflation data service (FRED API)
  async fetchPPIData() {
    try {
      console.log('📊 Fetching PPI data using inflation data service (FRED API)...');
      return await this.inflationDataService.fetchPPIData();
    } catch (error) {
      console.error('❌ Error fetching PPI data:', error.message);
      await this.errorLogger.logError('ppi_data', error.message);
      return null;
    }
  }

  // ===== BLS EMPLOYMENT DATA =====

  // Fetch Nonfarm Payrolls data from BLS using curl (Railway Akamai edge workaround)
  async fetchNonfarmPayrolls() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for employment data');
        return null;
      }

      console.log('📊 Fetching Nonfarm Payrolls data from BLS...');
      
      const seriesId = 'CES0000000001'; // Total nonfarm employment
      const requestData = {
        seriesid: [seriesId],
        startyear: moment().subtract(2, 'years').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      };
      
      // Use curl workaround for Railway Akamai edge issue
      const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 -X POST -H "Content-Type: application/json" -d '${JSON.stringify(requestData)}' "${this.blsBaseUrl}/timeseries/data"`;
      console.log(`🔧 Using curl workaround for Railway Akamai edge issue (NFP)`);
      
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.error(`⚠️ Curl stderr for NFP: ${stderr}`);
      }
      
      if (!stdout) {
        throw new Error('No response from curl command');
      }
      
      const response = { data: JSON.parse(stdout) };

      if (response.data.status === 'REQUEST_SUCCEEDED' && response.data.Results.series.length > 0) {
        const series = response.data.Results.series[0];
        const latestData = series.data[0]; // Most recent data point
        
        // Extract month from period (e.g., "M08" -> "08")
        console.log(`🔍 NFP Debug - Period: "${latestData.period}", Year: "${latestData.year}"`);
        
        // More robust period parsing
        let month;
        if (latestData.period.startsWith('M')) {
          month = latestData.period.substring(1).padStart(2, '0');
        } else if (latestData.period.length === 2) {
          month = latestData.period.padStart(2, '0');
        } else {
          console.error(`❌ Unexpected period format: "${latestData.period}"`);
          month = '01'; // fallback
        }
        
        const dateString = latestData.year + '-' + month + '-01';
        console.log(`🔍 NFP Debug - Formatted date: "${dateString}"`);
        
        return {
          seriesId: 'NFP',
          date: dateString,
          value: parseFloat(latestData.value),
          previousValue: series.data[1] ? parseFloat(series.data[1].value) : null,
          change: series.data[1] ? parseFloat(latestData.value) - parseFloat(series.data[1].value) : null,
          source: 'BLS (curl)',
          description: 'Total Nonfarm Payrolls'
        };
      } else {
        throw new Error(`BLS API error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching Nonfarm Payrolls:', error.message);
      await this.errorLogger.logError('bls_nonfarm_payrolls', error.message);
      return null;
    }
  }

  // Fetch Unemployment Rate data from BLS using curl (Railway Akamai edge workaround)
  async fetchUnemploymentRate() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for employment data');
        return null;
      }

      console.log('📊 Fetching Unemployment Rate data from BLS...');
      
      const seriesId = 'LNS14000000'; // Unemployment rate
      const requestData = {
        seriesid: [seriesId],
        startyear: moment().subtract(2, 'years').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      };
      
      // Use curl workaround for Railway Akamai edge issue
      const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 -X POST -H "Content-Type: application/json" -d '${JSON.stringify(requestData)}' "${this.blsBaseUrl}/timeseries/data"`;
      console.log(`🔧 Using curl workaround for Railway Akamai edge issue (Unemployment Rate)`);
      
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.error(`⚠️ Curl stderr for Unemployment Rate: ${stderr}`);
      }
      
      if (!stdout) {
        throw new Error('No response from curl command');
      }
      
      const response = { data: JSON.parse(stdout) };

      if (response.data.status === 'REQUEST_SUCCEEDED' && response.data.Results.series.length > 0) {
        const series = response.data.Results.series[0];
        const latestData = series.data[0]; // Most recent data point
        
        // Extract month from period (e.g., "M08" -> "08")
        console.log(`🔍 UNRATE Debug - Period: "${latestData.period}", Year: "${latestData.year}"`);
        
        // More robust period parsing
        let month;
        if (latestData.period.startsWith('M')) {
          month = latestData.period.substring(1).padStart(2, '0');
        } else if (latestData.period.length === 2) {
          month = latestData.period.padStart(2, '0');
        } else {
          console.error(`❌ Unexpected period format: "${latestData.period}"`);
          month = '01'; // fallback
        }
        
        const dateString = latestData.year + '-' + month + '-01';
        console.log(`🔍 UNRATE Debug - Formatted date: "${dateString}"`);
        
        return {
          seriesId: 'UNRATE',
          date: dateString,
          value: parseFloat(latestData.value),
          previousValue: series.data[1] ? parseFloat(series.data[1].value) : null,
          change: series.data[1] ? parseFloat(latestData.value) - parseFloat(series.data[1].value) : null,
          source: 'BLS (curl)',
          description: 'Unemployment Rate'
        };
      } else {
        throw new Error(`BLS API error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching Unemployment Rate:', error.message);
      await this.errorLogger.logError('bls_unemployment_rate', error.message);
      return null;
    }
  }

  // ===== FRED API DATA =====

  // Fetch data from FRED API with retry logic and proxy support
  async fetchFREDData(seriesId, description, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.fredApiKey) {
          console.log('⚠️ FRED API key not configured');
          return null;
        }

        console.log(`📊 Fetching ${description} from FRED... (attempt ${attempt}/${maxRetries})`);
        
        // Build curl command for FRED API
        // Railway Akamai edge issue: axios fails with timeout, but curl works
        const url = `${this.fredBaseUrl}/series/observations?series_id=${seriesId}&api_key=${this.fredApiKey}&file_type=json&limit=2&sort_order=desc`;
        
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

        if (response.data.observations && response.data.observations.length > 0) {
          const latest = response.data.observations[0];
          const previous = response.data.observations[1];
          
          console.log(`✅ ${description} fetched successfully from FRED`);
          return {
            seriesId: seriesId,
            date: latest.date,
            value: parseFloat(latest.value),
            previousValue: previous ? parseFloat(previous.value) : null,
            change: previous ? parseFloat(latest.value) - parseFloat(previous.value) : null,
            source: 'FRED',
            description: description
          };
        } else {
          throw new Error('No data returned from FRED API');
        }
      } catch (error) {
        console.error(`❌ Error fetching ${description} from FRED (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // If this is the last attempt, log error and return null
        if (attempt === maxRetries) {
          console.error(`❌ All ${maxRetries} attempts failed for ${description}`);
          await this.errorLogger.logError('fred_data', error.message, { seriesId, description });
          return null;
        }
        
        // Wait before retrying (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // Fetch Federal Funds Rate
  async fetchFederalFundsRate() {
    return await this.fetchFREDData('FEDFUNDS', 'Federal Funds Rate');
  }

  // Fetch GDP data
  async fetchGDP() {
    return await this.fetchFREDData('GDP', 'Gross Domestic Product');
  }

  // Fetch Retail Sales
  async fetchRetailSales() {
    return await this.fetchFREDData('RSAFS', 'Retail Sales');
  }

  // ===== ECONOMIC CALENDAR =====

  // Get economic release schedule
  getEconomicReleaseSchedule() {
    const now = moment();
    const schedule = [];

    // Employment Situation (First Friday of each month)
    const firstFriday = moment(now).startOf('month').day(5);
    if (firstFriday.date() > 7) firstFriday.add(7, 'days');
    schedule.push({
      id: 'employment_situation',
      title: 'Employment Situation',
      description: 'Nonfarm Payrolls, Unemployment Rate',
      date: firstFriday.format('YYYY-MM-DD'),
      time: '08:30',
      timezone: 'America/New_York',
      impact: 'high',
      source: 'BLS',
      category: 'employment'
    });

    // CPI (Second Tuesday of each month)
    const secondTuesday = moment(now).startOf('month').day(2).add(7, 'days');
    schedule.push({
      id: 'cpi',
      title: 'Consumer Price Index',
      description: 'CPI and Core CPI',
      date: secondTuesday.format('YYYY-MM-DD'),
      time: '08:30',
      timezone: 'America/New_York',
      impact: 'high',
      source: 'BLS',
      category: 'inflation'
    });

    // PPI (Second Tuesday of each month, usually same week as CPI)
    const ppiTuesday = moment(now).startOf('month').day(2).add(7, 'days');
    schedule.push({
      id: 'ppi',
      title: 'Producer Price Index',
      description: 'PPI and Core PPI (MoM and YoY)',
      date: ppiTuesday.format('YYYY-MM-DD'),
      time: '08:30',
      timezone: 'America/New_York',
      impact: 'high',
      source: 'BLS',
      category: 'inflation'
    });

    // PCE (Last business day of each month)
    const lastDay = moment(now).endOf('month');
    while (lastDay.day() === 0 || lastDay.day() === 6) {
      lastDay.subtract(1, 'day');
    }
    schedule.push({
      id: 'pce',
      title: 'Personal Consumption Expenditures',
      description: 'PCE and Core PCE',
      date: lastDay.format('YYYY-MM-DD'),
      time: '08:30',
      timezone: 'America/New_York',
      impact: 'high',
      source: 'BEA',
      category: 'inflation'
    });

    // Federal Reserve FOMC meetings (8 times per year)
    const fomcDates = [
      '2025-01-29', '2025-03-19', '2025-04-30', '2025-06-11',
      '2025-07-30', '2025-09-17', '2025-10-29', '2025-12-17'
    ];
    
    fomcDates.forEach(date => {
      if (moment(date).isAfter(now.subtract(1, 'day'))) {
        schedule.push({
          id: 'fomc_meeting',
          title: 'FOMC Meeting',
          description: 'Federal Funds Rate Decision',
          date: date,
          time: '14:00',
          timezone: 'America/New_York',
          impact: 'high',
          source: 'FED',
          category: 'monetary_policy'
        });
      }
    });

    return schedule.filter(event => moment(event.date).isAfter(now.subtract(1, 'day')));
  }

  // Check for new economic data releases
  async checkForNewReleases() {
    try {
      console.log('📅 Checking for new economic data releases...');
      
      const schedule = this.getEconomicReleaseSchedule();
      const today = moment().format('YYYY-MM-DD');
      const todayEvents = schedule.filter(event => event.date === today);
      
      const newReleases = [];
      
      for (const event of todayEvents) {
        const currentTime = moment().tz(event.timezone);
        const releaseTime = moment.tz(`${event.date} ${event.time}`, event.timezone);
        
        // Check if it's past the release time
        if (currentTime.isAfter(releaseTime)) {
          let data = null;
          
          switch (event.id) {
            case 'employment_situation':
              data = await this.fetchNonfarmPayrolls();
              break;
            case 'cpi':
              data = await this.fetchCPIData();
              break;
            case 'ppi':
              data = await this.fetchPPIData();
              break;
            case 'pce':
              data = await this.fetchPCEData();
              break;
            case 'fomc_meeting':
              data = await this.fetchFederalFundsRate();
              break;
          }
          
          if (data) {
            newReleases.push({
              event: event,
              data: data,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return newReleases;
    } catch (error) {
      console.error('❌ Error checking for new releases:', error.message);
      await this.errorLogger.logError('economic_releases_check', error.message);
      return [];
    }
  }

  // ===== EXISTING INFLATION DATA METHODS =====

  // Fetch CPI data using inflation data service (FRED API)
  async fetchCPIData() {
    try {
      console.log('📊 Fetching CPI data using inflation data service (FRED API)...');
      return await this.inflationDataService.fetchCPIData();
    } catch (error) {
      console.error('❌ Error fetching CPI data:', error.message);
      await this.errorLogger.logError('cpi_data', error.message);
      return null;
    }
  }

  // Fetch PCE data from BEA (existing method)
  async fetchPCEData() {
    const maxRetries = 3;
    const retryDelay = 2000;
    
    if (!this.beaApiKey) {
      console.log('⚠️ BEA API key not configured for PCE data');
      return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📊 Fetching PCE data from BEA API (attempt ${attempt}/${maxRetries})...`);
        
        const response = await axios.get(this.beaBaseUrl, {
          params: {
            USERID: this.beaApiKey,
            METHOD: 'GetData',
            DATASETNAME: 'NIPA',
            TABLEID: 'T20804',
            FREQUENCY: 'M',
            YEAR: moment().subtract(1, 'year').year() + ',' + moment().year(),
            FORMAT: 'json'
          },
          timeout: 15000
        });

        if (response.data && response.data.BEAAPI && response.data.BEAAPI.Results) {
          const data = response.data.BEAAPI.Results.Data;
          if (data && data.length > 0) {
            // Get the latest data point
            const latestData = data[0];
            
            return {
              seriesId: 'PCE',
              date: latestData.TimePeriod,
              value: parseFloat(latestData.DataValue),
              previousValue: data[1] ? parseFloat(data[1].DataValue) : null,
              source: 'BEA',
              description: 'Personal Consumption Expenditures'
            };
          }
        }
        
        throw new Error('No PCE data returned from BEA API');
      } catch (error) {
        console.error(`❌ BEA API attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          await this.errorLogger.logError('bea_pce', error.message);
          return null;
        }
        
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  // ===== MAIN COLLECTION METHOD =====

  // Collect all economic data
  async collectAllEconomicData() {
    try {
      console.log('📊 Starting comprehensive economic data collection...');
      
      const results = {
        employment: {},
        inflation: {},
        monetary: {},
        gdp: {},
        retail: {},
        newReleases: []
      };

      // Collect employment data
      results.employment.nonfarmPayrolls = await this.fetchNonfarmPayrolls();
      results.employment.unemploymentRate = await this.fetchUnemploymentRate();

      // Skip inflation data collection - handled by dedicated inflation data service
      // This prevents duplicates since collectInflationData() already handles CPI and PCE
      console.log('ℹ️ Skipping inflation data collection (handled by dedicated service)');
      results.inflation.cpi = null;
      results.inflation.pce = null;

      // Collect monetary policy data
      results.monetary.federalFundsRate = await this.fetchFederalFundsRate();

      // Collect GDP data
      results.gdp = await this.fetchGDP();

      // Collect retail sales data
      results.retail = await this.fetchRetailSales();

      // Check for new releases
      results.newReleases = await this.checkForNewReleases();

      console.log('✅ Economic data collection completed');
      return results;
    } catch (error) {
      console.error('❌ Error in economic data collection:', error.message);
      await this.errorLogger.logError('economic_data_collection', error.message);
      throw error;
    }
  }
}

module.exports = EconomicDataService;
