const { insertErrorLog, getErrorLogs } = require('../database');

class ErrorLogger {
  constructor() {
    this.errorTypes = {
      API_FAILURE: 'api_failure',
      DATA_COLLECTION: 'data_collection',
      DATABASE: 'database',
      AUTHENTICATION: 'authentication',
      VALIDATION: 'validation',
      SYSTEM: 'system'
    };
  }

  async logError(type, source, message, details = null, timestamp = new Date()) {
    try {
      await insertErrorLog({
        type,
        source,
        message,
        details: details ? JSON.stringify(details) : null,
        timestamp
      });
      
      console.error(`[${type.toUpperCase()}] ${source}: ${message}`, details);
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  async logApiFailure(apiName, endpoint, error, response = null) {
    const details = {
      api: apiName,
      endpoint,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      response: response ? JSON.stringify(response) : null,
      timestamp: new Date().toISOString()
    };

    await this.logError(
      this.errorTypes.API_FAILURE,
      apiName,
      `API call failed: ${error.message}`,
      details
    );
  }

  async logDataCollectionError(source, error, data = null) {
    const details = {
      source,
      error: error.message,
      stack: error.stack,
      data: data ? JSON.stringify(data) : null,
      timestamp: new Date().toISOString()
    };

    await this.logError(
      this.errorTypes.DATA_COLLECTION,
      source,
      `Data collection failed: ${error.message}`,
      details
    );
  }

  async getRecentErrors(limit = 50) {
    try {
      return await getErrorLogs(limit);
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  async getErrorsByType(type, limit = 50) {
    try {
      const allErrors = await getErrorLogs(limit * 2); // Get more to filter
      return allErrors.filter(error => error.type === type).slice(0, limit);
    } catch (error) {
      console.error('Failed to get errors by type:', error);
      return [];
    }
  }

  async getApiFailures(limit = 50) {
    return await this.getErrorsByType(this.errorTypes.API_FAILURE, limit);
  }

  async clearOldErrors(daysOld = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      // This would need to be implemented in the database
      console.log(`Clearing errors older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      console.error('Failed to clear old errors:', error);
    }
  }
}

module.exports = ErrorLogger;
