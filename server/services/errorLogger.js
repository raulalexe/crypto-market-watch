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
      // Truncate fields to prevent database varchar limit errors
      const truncatedType = this.truncateString(type, 100);
      const truncatedSource = this.truncateString(source, 500);
      const truncatedMessage = this.truncateString(message, 10000); // TEXT field, but reasonable limit
      
      await insertErrorLog({
        type: truncatedType,
        source: truncatedSource,
        message: truncatedMessage,
        details: details ? this.truncateString(JSON.stringify(details), 50000) : null,
        timestamp
      });
      
      console.error(`[${(type || 'UNKNOWN').toUpperCase()}] ${source || 'UNKNOWN'}: ${message || 'No message'}`, details);
    } catch (error) {
      console.error('Failed to log error:', error);
      
      // Fallback: try to log a simplified version
      try {
        await insertErrorLog({
          type: 'SYSTEM',
          source: 'ErrorLogger',
          message: `Failed to log error: ${error.message}`,
          details: JSON.stringify({ 
            originalType: type?.substring(0, 50),
            originalSource: source?.substring(0, 100),
            originalMessage: message?.substring(0, 200),
            logError: error.message
          }),
          timestamp
        });
      } catch (fallbackError) {
        console.error('Failed to log fallback error:', fallbackError);
      }
    }
  }

  // Helper method to truncate strings safely
  truncateString(str, maxLength) {
    if (!str) return str;
    if (typeof str !== 'string') str = String(str);
    
    if (str.length <= maxLength) return str;
    
    // Truncate and add indicator
    return str.substring(0, maxLength - 10) + '...[TRUNC]';
  }

  async logApiFailure(apiName, endpoint, error, response = null) {
    const details = {
      api: apiName,
      endpoint,
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      response: response ? this.truncateString(JSON.stringify(response), 5000) : null,
      timestamp: new Date().toISOString()
    };

    // Create a concise source identifier
    const source = `${apiName}${endpoint ? `::${endpoint}` : ''}`;

    await this.logError(
      this.errorTypes.API_FAILURE,
      source,
      `API call failed: ${error.message}`,
      details
    );
  }

  async logDataCollectionError(source, error, data = null) {
    const details = {
      source,
      error: error.message,
      stack: this.truncateString(error.stack, 5000),
      data: data ? this.truncateString(JSON.stringify(data), 5000) : null,
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
