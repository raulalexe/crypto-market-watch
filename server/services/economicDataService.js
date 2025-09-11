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

class EconomicDataService {
  constructor() {
    this.beaApiKey = process.env.BEA_API_KEY;
    this.blsApiKey = process.env.BLS_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
    
    this.beaBaseUrl = 'https://apps.bea.gov/api/data';
    this.blsBaseUrl = 'https://api.bls.gov/publicAPI/v2';
    this.fredBaseUrl = 'https://api.stlouisfed.org/fred';
    
    this.errorLogger = new (require('./errorLogger'))();
  }

  // ===== BLS PPI DATA =====

  // Fetch PPI data from BLS
  async fetchPPIData() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for PPI data');
        return null;
      }

      console.log('📊 Fetching PPI data from BLS...');
      
      const response = await axios.post(`${this.blsBaseUrl}/timeseries/data`, {
        seriesid: ['WPSFD4', 'WPSFD41'], // Final Demand PPI and Core PPI
        startyear: moment().subtract(1, 'year').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      if (response.data.status === 'REQUEST_SUCCEEDED' && response.data.Results.series.length > 0) {
        const series = response.data.Results.series;
        const ppiData = {
          date: null,
          ppi: null,
          corePPI: null,
          ppiMoM: null,
          corePPIMoM: null,
          ppiYoY: null,
          corePPIYoY: null
        };

        series.forEach(s => {
          if (!s || !s.data || !Array.isArray(s.data) || s.data.length === 0) return;
          
          const latest = s.data[0];
          if (!latest || !latest.value) return;
          
          if (s.seriesID === 'WPSFD4') { // Final Demand PPI
            ppiData.ppi = parseFloat(latest.value);
            ppiData.date = `${latest.year}-${latest.periodName}-01`;
            
            // Calculate MoM change
            if (s.data.length > 1) {
              const previousMonth = s.data[1];
              if (previousMonth && previousMonth.value) {
                ppiData.ppiMoM = ((parseFloat(latest.value) - parseFloat(previousMonth.value)) / parseFloat(previousMonth.value)) * 100;
              }
            }
          } else if (s.seriesID === 'WPSFD41') { // Core PPI
            ppiData.corePPI = parseFloat(latest.value);
            
            // Calculate MoM change for core
            if (s.data.length > 1) {
              const previousMonth = s.data[1];
              if (previousMonth && previousMonth.value) {
                ppiData.corePPIMoM = ((parseFloat(latest.value) - parseFloat(previousMonth.value)) / parseFloat(previousMonth.value)) * 100;
              }
            }
          }
        });

        console.log('✅ PPI data fetched successfully');
        return ppiData;
      } else {
        console.error('❌ PPI data fetch failed:', response.data.message);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching PPI data:', error.message);
      return null;
    }
  }

  // ===== BLS EMPLOYMENT DATA =====

  // Fetch Nonfarm Payrolls data from BLS
  async fetchNonfarmPayrolls() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for employment data');
        return null;
      }

      console.log('📊 Fetching Nonfarm Payrolls data from BLS...');
      
      const seriesId = 'CES0000000001'; // Total nonfarm employment
      const response = await axios.post(`${this.blsBaseUrl}/timeseries/data`, {
        seriesid: [seriesId],
        startyear: moment().subtract(2, 'years').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // Increased to 30 seconds for BLS API
      });

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
          source: 'BLS',
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

  // Fetch Unemployment Rate data from BLS
  async fetchUnemploymentRate() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for employment data');
        return null;
      }

      console.log('📊 Fetching Unemployment Rate data from BLS...');
      
      const seriesId = 'LNS14000000'; // Unemployment rate
      const response = await axios.post(`${this.blsBaseUrl}/timeseries/data`, {
        seriesid: [seriesId],
        startyear: moment().subtract(2, 'years').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // Increased to 30 seconds for BLS API
      });

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
          source: 'BLS',
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

  // Fetch data from FRED API
  async fetchFREDData(seriesId, description) {
    try {
      if (!this.fredApiKey) {
        console.log('⚠️ FRED API key not configured');
        return null;
      }

      console.log(`📊 Fetching ${description} from FRED...`);
      
      const response = await axios.get(`${this.fredBaseUrl}/series/observations`, {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          limit: 2,
          sort_order: 'desc'
        },
        timeout: 30000 // Increased to 30 seconds for BLS API
      });

      if (response.data.observations && response.data.observations.length > 0) {
        const latest = response.data.observations[0];
        const previous = response.data.observations[1];
        
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
      console.error(`❌ Error fetching ${description} from FRED:`, error.message);
      await this.errorLogger.logError('fred_data', error.message, { seriesId, description });
      return null;
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

  // Fetch CPI data from BLS (existing method)
  async fetchCPIData() {
    try {
      if (!this.blsApiKey) {
        console.log('⚠️ BLS API key not configured for CPI data');
        return null;
      }

      console.log('📊 Fetching CPI data from BLS...');
      
      const seriesIds = ['CUSR0000SA0', 'CUSR0000SA0L1E']; // Headline and Core CPI
      const response = await axios.post(`${this.blsBaseUrl}/timeseries/data`, {
        seriesid: seriesIds,
        startyear: moment().subtract(2, 'years').year(),
        endyear: moment().year(),
        registrationkey: this.blsApiKey
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // Increased to 30 seconds for BLS API
      });

      if (response.data.status === 'REQUEST_SUCCEEDED' && response.data.Results.series.length > 0) {
        const headlineSeries = response.data.Results.series.find(s => s.seriesID === 'CUSR0000SA0');
        const coreSeries = response.data.Results.series.find(s => s.seriesID === 'CUSR0000SA0L1E');
        
        if (headlineSeries && coreSeries) {
          const headlineLatest = headlineSeries.data[0];
          const coreLatest = coreSeries.data[0];
          
          // Extract month from period (e.g., "M08" -> "08")
          console.log(`🔍 CPI Debug - Period: "${headlineLatest.period}", Year: "${headlineLatest.year}"`);
          
          // More robust period parsing
          let month;
          if (headlineLatest.period.startsWith('M')) {
            month = headlineLatest.period.substring(1).padStart(2, '0');
          } else if (headlineLatest.period.length === 2) {
            month = headlineLatest.period.padStart(2, '0');
          } else {
            console.error(`❌ Unexpected period format: "${headlineLatest.period}"`);
            month = '01'; // fallback
          }
          
          const dateString = headlineLatest.year + '-' + month + '-01';
          console.log(`🔍 CPI Debug - Formatted date: "${dateString}"`);
          
          return {
            seriesId: 'CPI',
            date: dateString,
            value: parseFloat(headlineLatest.value),
            coreValue: parseFloat(coreLatest.value),
            previousValue: headlineSeries.data[1] ? parseFloat(headlineSeries.data[1].value) : null,
            previousCoreValue: coreSeries.data[1] ? parseFloat(coreSeries.data[1].value) : null,
            source: 'BLS',
            description: 'Consumer Price Index'
          };
        }
      } else {
        throw new Error(`BLS API error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error fetching CPI data:', error.message);
      await this.errorLogger.logError('bls_cpi', error.message);
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
