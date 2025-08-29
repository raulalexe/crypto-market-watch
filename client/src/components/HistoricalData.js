import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, TrendingDown, Minus, Download, ChevronUp, ChevronDown, Lock } from 'lucide-react';
import axios from 'axios';
import { hasProAccess } from '../utils/authUtils';

// Create axios instance without default headers for public endpoints
const publicAxios = axios.create();

const HistoricalData = ({ userData }) => {
  const [selectedDataType, setSelectedDataType] = useState('EQUITY_INDEX');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [predictions, setPredictions] = useState(null);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  const dataTypes = [
    { value: 'EQUITY_INDEX', label: 'Equity Indices', description: 'S&P 500, NASDAQ data' },
    { value: 'CRYPTO_PRICE', label: 'Crypto Prices', description: 'Bitcoin, Ethereum prices' },
    { value: 'DXY', label: 'Dollar Index', description: 'US Dollar strength' },
    { value: 'TREASURY_YIELD', label: 'Treasury Yields', description: '2Y, 10Y bond yields' },
    { value: 'VOLATILITY_INDEX', label: 'Volatility (VIX)', description: 'Market volatility index' },
    { value: 'ENERGY_PRICE', label: 'Energy Prices', description: 'Oil, gas prices' },
    { value: 'TOTAL_MARKET_CAP', label: 'Total Market Cap', description: 'Crypto market capitalization' },
    { value: 'ALTCOIN_SEASON', label: 'Altcoin Season', description: 'Altcoin dominance indicator' },
    { value: 'DERIVATIVES', label: 'Derivatives', description: 'Futures, options data' },
    { value: 'ONCHAIN', label: 'On-chain Data', description: 'Blockchain metrics' },
    { value: 'SEASON_INDICATOR', label: 'Season Indicator', description: 'Market season indicators' }
  ];

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use public axios instance without Authorization header
      const response = await publicAxios.get(`/api/history/${selectedDataType}?limit=100`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to load historical data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setPredictionsLoading(true);
      // Use public axios instance without Authorization header
      const response = await publicAxios.get('/api/predictions');
      setPredictions(response.data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions(null);
    } finally {
      setPredictionsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
    fetchPredictions();
  }, [selectedDataType]);

  // Sorting function
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle different data types for sorting
      if (key === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (key === 'value' || key === 'change' || key === 'changePercent') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else {
        // String comparison for other fields
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Handle sort click
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (!sortConfig.key || sortConfig.key !== key) {
      return <Minus className="w-4 h-4 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-crypto-blue" />
      : <ChevronDown className="w-4 h-4 text-crypto-blue" />;
  };

  // Get sorted data
  const sortedData = sortConfig.key ? sortData(data, sortConfig.key, sortConfig.direction) : data;

  // Process data to include change calculations
  const processedData = sortedData.map((item, index) => {
    const previousValue = index < sortedData.length - 1 ? sortedData[index + 1].value : null;
    const change = previousValue ? item.value - previousValue : null;
    const changePercent = previousValue ? ((change / previousValue) * 100) : null;
    
    return {
      ...item,
      change,
      changePercent
    };
  });

  // Re-sort if sorting by change
  const finalData = (sortConfig.key === 'change' || sortConfig.key === 'changePercent') && sortConfig.key
    ? sortData(processedData, sortConfig.key, sortConfig.direction)
    : processedData;

  // Export to CSV function
  const exportToCSV = () => {
    if (finalData.length === 0) return;

    const headers = ['Timestamp', 'Symbol', 'Value', 'Change', 'Change %', 'Source'];
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.join(','),
      ...finalData.map(item => [
        escapeCSV(new Date(item.timestamp).toLocaleString()),
        escapeCSV(item.symbol || 'N/A'),
        escapeCSV(formatValue(item.value, selectedDataType)),
        escapeCSV(item.change !== null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : 'N/A'),
        escapeCSV(item.changePercent !== null ? (item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A'),
        escapeCSV(item.source || 'N/A')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataType.toLowerCase()}_historical_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  // Export to JSON function
  const exportToJSON = () => {
    if (finalData.length === 0) return;

    const jsonExportData = {
      metadata: {
        dataType: selectedDataType,
        exportDate: new Date().toISOString(),
        recordCount: finalData.length,
        sortConfig: sortConfig
      },
      data: finalData.map(item => ({
        timestamp: item.timestamp,
        symbol: item.symbol,
        value: item.value,
        change: item.change,
        changePercent: item.changePercent,
        source: item.source,
        formattedValue: formatValue(item.value, selectedDataType)
      }))
    };

    const jsonContent = JSON.stringify(jsonExportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataType.toLowerCase()}_historical_data_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Excel (XLSX) function
  const exportToExcel = () => {
    if (finalData.length === 0) return;

    // Create a simple HTML table that Excel can open
    const headers = ['Timestamp', 'Symbol', 'Value', 'Change', 'Change %', 'Source'];
    const tableRows = finalData.map(item => [
      new Date(item.timestamp).toLocaleString(),
      item.symbol || 'N/A',
      formatValue(item.value, selectedDataType),
      item.change !== null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : 'N/A',
      item.changePercent !== null ? (item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A',
      item.source || 'N/A'
    ]);

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedDataType} Historical Data</title>
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tableRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataType.toLowerCase()}_historical_data_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (finalData.length === 0) return;

    const timestamp = new Date().toISOString();
    const reportTitle = `${selectedDataType.replace(/_/g, ' ')} Historical Data Report`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0;
          }
          .summary {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .summary h2 {
            color: #2563eb;
            margin-top: 0;
            font-size: 18px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 10px;
          }
          .summary-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #2563eb;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportTitle}</h1>
          <p>Generated on: ${new Date(timestamp).toLocaleString()}</p>
          <p>Data Type: ${selectedDataType.replace(/_/g, ' ').toUpperCase()}</p>
        </div>

        <div class="summary">
          <h2>Report Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${finalData.length}</div>
              <div class="summary-label">Total Records</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${selectedDataType.replace(/_/g, ' ').toUpperCase()}</div>
              <div class="summary-label">Data Type</div>
            </div>
          </div>
        </div>

        <h2>Data Table</h2>
        <table>
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>SYMBOL</th>
              <th>VALUE</th>
              <th>CHANGE</th>
              <th>CHANGE %</th>
              <th>SOURCE</th>
            </tr>
          </thead>
          <tbody>
            ${finalData.slice(0, 50).map(item => `
              <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.symbol || 'N/A'}</td>
                <td>${formatValue(item.value, selectedDataType)}</td>
                <td>${item.change !== null ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : 'N/A'}</td>
                <td>${item.changePercent !== null ? (item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A'}</td>
                <td>${item.source || 'N/A'}</td>
              </tr>
            `).join('')}
            ${finalData.length > 50 ? `<tr><td colspan="6" style="text-align: center; font-style: italic;">... and ${finalData.length - 50} more records</td></tr>` : ''}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by Crypto Market Monitor</p>
          <p>For professional use only - Not financial advice</p>
          <p>Report ID: ${Date.now()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedDataType.toLowerCase()}_historical_data_${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatValue = (value, dataType) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (dataType) {
      case 'CRYPTO_PRICE':
        return `$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'TOTAL_MARKET_CAP':
        return `$${(parseFloat(value) / 1e9).toFixed(2)}B`;
      case 'VOLATILITY_INDEX':
      case 'TREASURY_YIELD':
        return `${parseFloat(value).toFixed(2)}%`;
      case 'ALTCOIN_SEASON':
        return `${parseFloat(value).toFixed(2)}`;
      default:
        return parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', 'Data Type', 'Symbol', 'Value', 'Source'],
      ...data.map(item => [
        new Date(item.timestamp).toLocaleString(),
        item.data_type,
        item.symbol || 'N/A',
        item.value,
        item.source || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDataType}_historical_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-crypto-blue" />
          <div>
            <h1 className="text-2xl font-bold text-white">Historical Data</h1>
            <p className="text-slate-400">View and analyze historical market data</p>
          </div>
        </div>
        {data.length > 0 && (
          <div className="relative group">
            {hasProAccess(userData) ? (
              <>
                <button className="flex items-center space-x-2 px-3 py-1.5 bg-crypto-blue text-white text-sm rounded hover:bg-blue-600 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={exportToCSV}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CSV File</span>
                    </button>
                    <button
                      onClick={exportToJSON}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>JSON Data</span>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Excel File</span>
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>PDF Report</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative group">
                <button 
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-600 text-slate-300 text-sm rounded cursor-not-allowed"
                  title="Export requires Pro+ subscription"
                >
                  <Lock className="w-4 h-4" />
                  <span>Export</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-64 bg-slate-700 border border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lock className="w-4 h-4 text-crypto-blue" />
                      <span className="text-sm font-medium text-white">Pro+ Required</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-3">
                      Export functionality is available for Pro+ subscribers only.
                    </p>
                    <a
                      href="/app/subscription"
                      className="inline-block w-full text-center px-3 py-1.5 bg-crypto-blue text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Upgrade to Pro
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Predictions Section */}
      {predictions && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">AI Market Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Short Term */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Short Term (1-7 days)</h4>
                <span className="text-xs text-slate-400">1-7 days</span>
              </div>
              {predictions.short_term ? (
                <>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      predictions.short_term.market_direction === 'BULLISH' ? 'bg-green-900 text-green-300' :
                      predictions.short_term.market_direction === 'BEARISH' ? 'bg-red-900 text-red-300' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {predictions.short_term.market_direction}
                    </span>
                    <span className="text-sm text-slate-400">
                      {predictions.short_term.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">
                    {predictions.short_term.reasoning}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No short-term prediction available</p>
              )}
            </div>

            {/* Medium Term */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Medium Term (1-4 weeks)</h4>
                <span className="text-xs text-slate-400">1-4 weeks</span>
              </div>
              {predictions.medium_term ? (
                <>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      predictions.medium_term.market_direction === 'BULLISH' ? 'bg-green-900 text-green-300' :
                      predictions.medium_term.market_direction === 'BEARISH' ? 'bg-red-900 text-red-300' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {predictions.medium_term.market_direction}
                    </span>
                    <span className="text-sm text-slate-400">
                      {predictions.medium_term.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">
                    {predictions.medium_term.reasoning}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No medium-term prediction available</p>
              )}
            </div>

            {/* Long Term */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Long Term (1-6 months)</h4>
                <span className="text-xs text-slate-400">1-6 months</span>
              </div>
              {predictions.long_term ? (
                <>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      predictions.long_term.market_direction === 'BULLISH' ? 'bg-green-900 text-green-300' :
                      predictions.long_term.market_direction === 'BEARISH' ? 'bg-red-900 text-red-300' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {predictions.long_term.market_direction}
                    </span>
                    <span className="text-sm text-slate-400">
                      {predictions.long_term.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">
                    {predictions.long_term.reasoning}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No long-term prediction available</p>
              )}
            </div>
          </div>
          
          {/* Overall Summary */}
          <div className="mt-4 p-4 bg-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Overall Market Direction</h4>
                <p className="text-xs text-slate-400">
                  Based on analysis from {new Date(predictions.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-sm font-medium rounded ${
                  predictions.overall_direction === 'BULLISH' ? 'bg-green-900 text-green-300' :
                  predictions.overall_direction === 'BEARISH' ? 'bg-red-900 text-red-300' :
                  'bg-slate-600 text-slate-300'
                }`}>
                  {predictions.overall_direction}
                </span>
                <span className="text-sm text-slate-400">
                  {predictions.overall_confidence}% confidence
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {predictionsLoading && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-crypto-blue"></div>
            <span className="text-slate-400 ml-2">Loading AI predictions...</span>
          </div>
        </div>
      )}

      {/* Data Type Selector */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Select Data Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedDataType(type.value)}
              className={`p-4 rounded-lg border transition-colors text-left ${
                selectedDataType === type.value
                  ? 'bg-crypto-blue border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-sm opacity-75">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Display */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {dataTypes.find(t => t.value === selectedDataType)?.label} - Historical Data
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Click column headers to sort data
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <span className="font-medium">Sort:</span>
                <select
                  value={sortConfig.key ? `${sortConfig.key}-${sortConfig.direction}` : 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      setSortConfig({ key: null, direction: null });
                    } else {
                      const [key, direction] = e.target.value.split('-');
                      setSortConfig({ key, direction });
                    }
                  }}
                  className="bg-slate-700 border border-slate-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-crypto-blue focus:border-transparent hover:bg-slate-600 transition-colors min-w-[140px]"
                >
                  <option value="none">No Sorting</option>
                  <optgroup label="Timestamp">
                    <option value="timestamp-desc">Newest First</option>
                    <option value="timestamp-asc">Oldest First</option>
                  </optgroup>
                  <optgroup label="Symbol">
                    <option value="symbol-asc">A-Z</option>
                    <option value="symbol-desc">Z-A</option>
                  </optgroup>
                  <optgroup label="Value">
                    <option value="value-desc">Highest First</option>
                    <option value="value-asc">Lowest First</option>
                  </optgroup>
                  <optgroup label="Change">
                    <option value="change-desc">Largest First</option>
                    <option value="change-asc">Smallest First</option>
                  </optgroup>
                  <optgroup label="Source">
                    <option value="source-asc">A-Z</option>
                    <option value="source-desc">Z-A</option>
                  </optgroup>
                </select>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{data.length} records</span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-blue mx-auto"></div>
            <p className="text-slate-400 mt-2">Loading historical data...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchHistoricalData}
              className="mt-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-slate-400">No historical data available for this type.</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Timestamp</span>
                      {getSortIndicator('timestamp')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Symbol</span>
                      {getSortIndicator('symbol')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Value</span>
                      {getSortIndicator('value')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('change')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Change</span>
                      {getSortIndicator('change')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600 transition-colors"
                    onClick={() => handleSort('source')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Source</span>
                      {getSortIndicator('source')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {finalData.map((item, index) => {
                  const change = item.change;
                  const changePercent = item.changePercent;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {item.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {formatValue(item.value, selectedDataType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {change !== null ? (
                          <div className="flex items-center space-x-1">
                            {change >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                            <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}
                              {changePercent !== null && (
                                <span className="text-slate-400 ml-1">
                                  ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {item.source}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
};

export default HistoricalData;
