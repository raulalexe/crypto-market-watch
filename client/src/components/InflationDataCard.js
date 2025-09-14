import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, RefreshCw, AlertTriangle, Calendar, BarChart3, DollarSign, Activity } from 'lucide-react';

const InflationDataCard = ({ userData }) => {
  const [inflationData, setInflationData] = useState(null);
  const [releases, setReleases] = useState([]);
  const [forecasts, setForecasts] = useState(null);
  const [expectations, setExpectations] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Only fetch once per component instance
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchInflationData();
    }
  }, []);

  const fetchInflationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataRes, releasesRes, forecastsRes, expectationsRes, sentimentRes] = await Promise.all([
        fetch('/api/inflation/latest'),
        fetch('/api/inflation/releases?days=7'),
        fetch('/api/inflation/forecasts'),
        fetch('/api/inflation/expectations'),
        fetch('/api/inflation/sentiment')
      ]);

      if (dataRes.ok) {
        const data = await dataRes.json();
        setInflationData(data);
      }

      if (releasesRes.ok) {
        const releasesData = await releasesRes.json();
        setReleases(releasesData.releases || []);
      }

      if (forecastsRes.ok) {
        const forecastsData = await forecastsRes.json();
        setForecasts(forecastsData);
      }

      if (expectationsRes.ok) {
        const expectationsData = await expectationsRes.json();
        setExpectations(expectationsData);
      }

      if (sentimentRes.ok) {
        const sentimentData = await sentimentRes.json();
        setSentiment(sentimentData.data);
      }
    } catch (err) {
      console.error('Error fetching inflation data:', err);
      setError('Failed to fetch inflation data');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'very_bullish': return <TrendingUp className="w-6 h-6 text-crypto-green" />;
      case 'bullish': return <TrendingUp className="w-5 h-5 text-crypto-green" />;
      case 'slightly_bullish': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'neutral': return <Minus className="w-5 h-5 text-slate-400" />;
      case 'slightly_bearish': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'bearish': return <TrendingDown className="w-5 h-5 text-crypto-red" />;
      case 'very_bearish': return <TrendingDown className="w-6 h-6 text-crypto-red" />;
      default: return <Minus className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'very_bullish': return 'text-crypto-green';
      case 'bullish': return 'text-crypto-green';
      case 'slightly_bullish': return 'text-green-400';
      case 'neutral': return 'text-slate-300';
      case 'slightly_bearish': return 'text-red-400';
      case 'bearish': return 'text-crypto-red';
      case 'very_bearish': return 'text-crypto-red';
      default: return 'text-slate-300';
    }
  };

  const getSentimentBg = (sentiment) => {
    switch (sentiment) {
      case 'very_bullish': return 'bg-green-900/20 border-green-500/30';
      case 'bullish': return 'bg-green-900/20 border-green-500/30';
      case 'slightly_bullish': return 'bg-green-900/10 border-green-400/20';
      case 'neutral': return 'bg-slate-700/20 border-slate-500/30';
      case 'slightly_bearish': return 'bg-red-900/10 border-red-400/20';
      case 'bearish': return 'bg-red-900/20 border-red-500/30';
      case 'very_bearish': return 'bg-red-900/20 border-red-500/30';
      default: return 'bg-slate-700/20 border-slate-500/30';
    }
  };

  const getMarketImpactColor = (impact) => {
    switch (impact) {
      case 'strong_positive': return 'text-crypto-green';
      case 'positive': return 'text-crypto-green';
      case 'slightly_positive': return 'text-green-400';
      case 'neutral': return 'text-slate-300';
      case 'slightly_negative': return 'text-red-400';
      case 'negative': return 'text-crypto-red';
      case 'strong_negative': return 'text-crypto-red';
      default: return 'text-slate-300';
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    // Convert to number if it's a string, then format to 2 decimal places
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return 'N/A';
    return number.toFixed(2);
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getNextRelease = () => {
    if (!releases || releases.length === 0) return null;
    const today = new Date();
    return releases.find(release => new Date(release.date) > today);
  };

  const nextRelease = getNextRelease();

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Inflation Data</h3>
          <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Inflation Data</h3>
          <button
            onClick={fetchInflationData}
            className="text-crypto-blue hover:text-crypto-blue-light text-sm"
          >
            Retry
          </button>
        </div>
        <div className="text-crypto-red text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${sentiment ? getSentimentBg(sentiment.sentiment) : 'border-slate-600'}`}>
      <div className="flex items-center space-x-3 mb-4">
        <BarChart3 className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">Inflation Data</h3>
        <button
          onClick={fetchInflationData}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Market Sentiment */}
      {sentiment && (
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-medium">Market Sentiment:</span>
            <div className="flex items-center space-x-2">
              {getSentimentIcon(sentiment.sentiment)}
              <span className={`font-bold text-lg ${getSentimentColor(sentiment.sentiment)}`}>
                {sentiment.sentiment.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          {sentiment.marketImpact && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Crypto Impact:</span>
                <span className={`font-medium ${getMarketImpactColor(sentiment.marketImpact.crypto)}`}>
                  {sentiment.marketImpact.crypto.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">{sentiment.marketImpact.description}</p>
            </div>
          )}
        </div>
      )}

      {/* CPI Data */}
      {inflationData?.cpi && (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Consumer Price Index (CPI)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Headline CPI (YoY %)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.cpi.cpiYoY !== null && inflationData.cpi.cpiYoY !== undefined ? `${formatNumber(inflationData.cpi.cpiYoY)}%` : 'N/A'}
                {expectations?.cpi?.headline && inflationData.cpi.cpiYoY !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.cpi.headline.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.cpi.cpiYoY);
                      const expected = parseFloat(expectations.cpi.headline.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.cpi.cpi)}
              </div>
            </div>
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Core CPI (ex. Food & Energy)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.cpi.coreCPIYoY !== null && inflationData.cpi.coreCPIYoY !== undefined ? `${formatNumber(inflationData.cpi.coreCPIYoY)}%` : 'N/A'}
                {expectations?.cpi?.core && inflationData.cpi.coreCPIYoY !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.cpi.core.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.cpi.coreCPIYoY);
                      const expected = parseFloat(expectations.cpi.core.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.cpi.coreCPI)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Date: {formatDate(inflationData.cpi.date)}
          </div>
        </div>
      )}

      {/* PCE Data */}
      {inflationData?.pce ? (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span>Personal Consumption Expenditures (PCE)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Headline PCE (YoY %)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.pce.pceYoY !== null ? `${formatNumber(inflationData.pce.pceYoY)}%` : 'N/A'}
                {expectations?.pce?.headline && inflationData.pce.pceYoY !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.pce.headline.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.pce.pceYoY);
                      const expected = parseFloat(expectations.pce.headline.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.pce.pce)}
              </div>
            </div>
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Core PCE (ex. Food & Energy)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.pce.corePCEYoY !== null ? `${formatNumber(inflationData.pce.corePCEYoY)}%` : 'N/A'}
                {expectations?.pce?.core && inflationData.pce.corePCEYoY !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.pce.core.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.pce.corePCEYoY);
                      const expected = parseFloat(expectations.pce.core.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.pce.corePCE)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Date: {formatDate(inflationData.pce.date)}
          </div>
        </div>
      ) : (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3">Personal Consumption Expenditures (PCE)</h4>
          <div className="text-sm text-slate-400 bg-slate-600 p-3 rounded-lg">
            PCE data temporarily unavailable
          </div>
        </div>
      )}

      {/* PPI Data */}
      {inflationData?.ppi ? (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span>Producer Price Index (PPI)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Headline PPI (MoM %)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.ppi.ppiMoM !== null && inflationData.ppi.ppiMoM !== undefined ? `${formatNumber(inflationData.ppi.ppiMoM)}%` : 'N/A'}
                {expectations?.ppi?.headline && inflationData.ppi.ppiMoM !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.ppi.headline.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.ppi.ppiMoM);
                      const expected = parseFloat(expectations.ppi.headline.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.ppi.ppi)} | YoY: {formatNumber(inflationData.ppi.ppiYoY)}%
              </div>
            </div>
            <div className="bg-slate-600 p-3 rounded-lg">
              <div className="text-sm text-slate-400">Core PPI (ex. Food & Energy)</div>
              <div className="text-lg font-semibold text-white">
                {inflationData.ppi.corePPIMoM !== null && inflationData.ppi.corePPIMoM !== undefined ? `${formatNumber(inflationData.ppi.corePPIMoM)}%` : 'N/A'}
                {expectations?.ppi?.core && inflationData.ppi.corePPIMoM !== null && (
                  <div className="text-xs text-slate-400 mt-1">
                    Expected: {formatNumber(expectations.ppi.core.consensus)}%
                    {(() => {
                      const actual = parseFloat(inflationData.ppi.corePPIMoM);
                      const expected = parseFloat(expectations.ppi.core.consensus);
                      const diff = actual - expected;
                      const diffColor = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-400';
                      return (
                        <span className={`ml-2 ${diffColor}`}>
                          ({diff > 0 ? '+' : ''}{formatNumber(diff)}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400">
                Index: {formatNumber(inflationData.ppi.corePPI)} | YoY: {formatNumber(inflationData.ppi.corePPIYoY)}%
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Date: {formatDate(inflationData.ppi.date)}
          </div>
        </div>
      ) : (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3">Producer Price Index (PPI)</h4>
          <div className="text-sm text-slate-400 bg-slate-600 p-3 rounded-lg">
            PPI data temporarily unavailable
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      {inflationData && (inflationData.cpi || inflationData.pce || inflationData.ppi) && (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-crypto-blue" />
            <span>AI Market Analysis</span>
          </h4>
          <div className="bg-slate-600 p-4 rounded-lg">
            <div 
              className="text-sm text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: (() => {
                const analysis = [];
                
                // CPI Analysis
                if (inflationData.cpi) {
                  const cpiYoY = parseFloat(inflationData.cpi.cpiYoY);
                  const coreCPIYoY = parseFloat(inflationData.cpi.coreCPIYoY);
                  
                  if (cpiYoY > 3.0) {
                    analysis.push(`📈 <strong>CPI at ${formatNumber(cpiYoY)}%</strong> indicates persistent inflation pressure. This suggests the Fed may need to maintain higher interest rates longer.`);
                  } else if (cpiYoY < 2.0) {
                    analysis.push(`📉 <strong>CPI at ${formatNumber(cpiYoY)}%</strong> shows cooling inflation, potentially giving the Fed room to cut rates.`);
                  } else {
                    analysis.push(`📊 <strong>CPI at ${formatNumber(cpiYoY)}%</strong> is within the Fed's target range, indicating balanced inflation.`);
                  }
                  
                  if (coreCPIYoY > cpiYoY) {
                    analysis.push(`Core CPI (${formatNumber(coreCPIYoY)}%) is higher than headline, suggesting underlying inflation pressure.`);
                  }
                }
                
                // PCE Analysis
                if (inflationData.pce) {
                  const pceYoY = parseFloat(inflationData.pce.pceYoY);
                  if (pceYoY > 2.5) {
                    analysis.push(`<br/>💰 <strong>PCE at ${formatNumber(pceYoY)}%</strong> shows strong consumer spending and price pressure.`);
                  } else if (pceYoY < 1.5) {
                    analysis.push(`<br/>💸 <strong>PCE at ${formatNumber(pceYoY)}%</strong> indicates weak consumer demand and deflationary pressure.`);
                  }
                }
                
                // PPI Analysis
                if (inflationData.ppi) {
                  const ppiMoM = parseFloat(inflationData.ppi.ppiMoM);
                  const ppiYoY = parseFloat(inflationData.ppi.ppiYoY);
                  
                  if (ppiMoM > 0.5) {
                    analysis.push(`🏭 <strong>PPI MoM at ${formatNumber(ppiMoM)}%</strong> suggests rising producer costs, which may lead to higher consumer prices.`);
                  } else if (ppiMoM < -0.2) {
                    analysis.push(`📉 <strong>PPI MoM at ${formatNumber(ppiMoM)}%</strong> indicates falling producer costs, potentially easing consumer price pressure.`);
                  }
                  
                  if (ppiYoY > 3.0) {
                    analysis.push(`📊 <strong>PPI YoY at ${formatNumber(ppiYoY)}%</strong> shows sustained producer price inflation.`);
                  }
                }
                
                // Market Impact Summary
                if (analysis.length > 0) {
                  analysis.push(`<br/><strong>Market Impact:</strong> ${sentiment?.marketImpact?.crypto ? `Crypto markets showing ${sentiment.marketImpact.crypto} sentiment. ` : ''}${sentiment?.marketImpact?.stocks ? `Equity markets ${sentiment.marketImpact.stocks}. ` : ''}${sentiment?.marketImpact?.bonds ? `Bond yields ${sentiment.marketImpact.bonds}.` : ''}`);
                }
                
                return analysis.length > 0 ? analysis.join(' ') : 'Inflation data analysis not available.';
                })()
              }}
            />
          </div>
        </div>
      )}

      {/* Next Release */}
      {nextRelease && (
        <div className="bg-slate-700 rounded-lg p-4 mb-4">
          <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-crypto-blue" />
            <span>Next Release</span>
          </h4>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-medium">{nextRelease.type}</div>
              <div className="text-slate-400 text-sm">
                {formatDate(nextRelease.date)}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Source: {nextRelease.source}
            </div>
          </div>
        </div>
      )}

      {/* AI Forecasts */}
      {forecasts && (forecasts.cpi || forecasts.pce) && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">AI Forecasts</h4>
          <div className="grid grid-cols-2 gap-4">
            {forecasts.cpi && (
              <div className="bg-slate-600 p-3 rounded-lg">
                <div className="text-sm font-medium text-white">CPI Forecast</div>
                <div className="text-xs text-slate-300 mt-1">
                  {(() => {
                    try {
                      if (!forecasts.cpi.forecast_data) return 'No forecast available';
                      const data = typeof forecasts.cpi.forecast_data === 'string' 
                        ? JSON.parse(forecasts.cpi.forecast_data) 
                        : forecasts.cpi.forecast_data;
                      return data.prediction || data.forecast || 'N/A';
                    } catch (error) {
                      return 'Forecast data unavailable';
                    }
                  })()}
                </div>
              </div>
            )}
            {forecasts.pce && (
              <div className="bg-slate-600 p-3 rounded-lg">
                <div className="text-sm font-medium text-white">PCE Forecast</div>
                <div className="text-xs text-slate-300 mt-1">
                  {(() => {
                    try {
                      if (!forecasts.pce.forecast_data) return 'No forecast available';
                      const data = typeof forecasts.pce.forecast_data === 'string' 
                        ? JSON.parse(forecasts.pce.forecast_data) 
                        : forecasts.pce.forecast_data;
                      return data.prediction || data.forecast || 'N/A';
                    } catch (error) {
                      return 'Forecast data unavailable';
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 text-center mt-4">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default InflationDataCard;

