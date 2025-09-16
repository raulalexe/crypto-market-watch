import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Save, 
  Trash2, 
  Plus, 
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  BarChart3,
  Settings,
  AlertTriangle,
  Info,
  Brain
} from 'lucide-react';
import axios from 'axios';
import { shouldShowPremiumUpgradePrompt, isAuthenticated, hasProAccess } from '../utils/authUtils';
import ToastNotification from './ToastNotification';

const CustomAlertThresholds = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thresholds, setThresholds] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };


  useEffect(() => {
    checkAuthAndLoadThresholds();
  }, []);

  const checkAuthAndLoadThresholds = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setIsAuthenticated(true);

      // Check if user has Pro access (Pro, Premium, or Admin)
      const userData = response.data;
      const hasProAccess = userData && (
        userData.plan === 'pro' || 
        userData.plan === 'premium' || 
        userData.role === 'admin' || 
        userData.isAdmin === true
      );

      if (hasProAccess) {
        await loadThresholds();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThresholds = async () => {
    try {
      const response = await axios.get('/api/alerts/thresholds', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });
      console.log('Loaded thresholds from API:', response.data);
      setThresholds(response.data.length > 0 ? response.data : []);
    } catch (error) {
      console.error('Error loading thresholds:', error);
      setThresholds([]);
    }
  };

  const saveThresholds = async () => {
    try {
      setSaving(true);
      await axios.post('/api/alerts/thresholds', {
        thresholds: thresholds
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });
      showAlert('Custom alert thresholds saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      showAlert('Failed to save thresholds. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addThreshold = () => {
    const newThreshold = {
      id: `custom_${Date.now()}`,
      name: 'New Alert',
      description: 'Custom alert threshold',
      metric: 'btc_price',
      condition: 'above',
      value: 0,
      enabled: true,
      icon: 'Bell', // Store as string for database serialization
      unit: 'USD'
    };
    setThresholds([newThreshold, ...thresholds]); // Add to the top
  };

  const addAIThreshold = (metricType) => {
    const newThreshold = {
      id: `ai_${Date.now()}`,
      name: `AI ${metricType} Alert`,
      description: `Alert when AI prediction changes for ${metricType} term`,
      metric: `ai_prediction_${metricType}`,
      condition: 'changes_to_bullish',
      value: 'BULLISH',
      enabled: true,
      icon: 'Brain',
      unit: ''
    };
    setThresholds([newThreshold, ...thresholds]); // Add to the top
  };

  const updateThreshold = (id, field, value) => {
    setThresholds(thresholds.map(threshold => 
      threshold.id === id ? { ...threshold, [field]: value } : threshold
    ));
  };

  const deleteThreshold = (id) => {
    setThresholds(thresholds.filter(threshold => threshold.id !== id));
  };

  const toggleThreshold = (id) => {
    setThresholds(thresholds.map(threshold => 
      threshold.id === id ? { ...threshold, enabled: !threshold.enabled } : threshold
    ));
  };

  const getMetricOptions = () => [
    { value: 'btc_price', label: 'Bitcoin Price' },
    { value: 'eth_price', label: 'Ethereum Price' },
    { value: 'sol_price', label: 'Solana Price' },
    { value: 'ssr', label: 'Stablecoin Supply Ratio' },
    { value: 'btc_dominance', label: 'Bitcoin Dominance' },
    { value: 'exchange_flow', label: 'Exchange Flow' },
    { value: 'fear_greed', label: 'Fear & Greed Index' },
    { value: 'vix', label: 'VIX Index' },
    { value: 'dxy', label: 'Dollar Index' },
    { value: 'volume_24h', label: '24h Volume' },
    { value: 'ai_prediction_short', label: 'AI Prediction (Short Term)' },
    { value: 'ai_prediction_medium', label: 'AI Prediction (Medium Term)' },
    { value: 'ai_prediction_long', label: 'AI Prediction (Long Term)' },
    { value: 'ai_prediction_overall', label: 'AI Prediction (Overall)' }
  ];

  const getConditionOptions = (metric) => {
    const baseOptions = [
      { value: 'above', label: 'Above' },
      { value: 'below', label: 'Below' },
      { value: 'equals', label: 'Equals' },
      { value: 'changes_by', label: 'Changes by' }
    ];

    // Add AI prediction-specific conditions
    if (metric && metric.startsWith('ai_prediction_')) {
      return [
        ...baseOptions,
        { value: 'changes_to_bullish', label: 'Changes to Bullish' },
        { value: 'changes_to_bearish', label: 'Changes to Bearish' },
        { value: 'changes_to_neutral', label: 'Changes to Neutral' },
        { value: 'becomes_bullish', label: 'Becomes Bullish' },
        { value: 'becomes_bearish', label: 'Becomes Bearish' },
        { value: 'becomes_neutral', label: 'Becomes Neutral' }
      ];
    }

    return baseOptions;
  };

  // Function to get icon component from icon name or component
  const getIconComponent = (icon) => {
    console.log('getIconComponent called with:', icon, 'type:', typeof icon);
    
    if (typeof icon === 'string') {
      // Map string names to components
      const iconMap = {
        'Bell': Bell,
        'TrendingUp': TrendingUp,
        'TrendingDown': TrendingDown,
        'Activity': Activity,
        'DollarSign': DollarSign,
        'Target': Target,
        'Brain': Brain
      };
      const component = iconMap[icon];
      console.log('Icon mapping result:', icon, '->', component);
      return component || Bell; // Default to Bell if not found
    }
    
    // If it's already a component, return it
    if (typeof icon === 'function') {
      return icon;
    }
    
    // Fallback to Bell for any other case
    console.log('Fallback to Bell icon');
    return Bell;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Bell className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Custom Alert Thresholds</h2>
          <p className="text-slate-400 mb-6">
            Set personalized alert thresholds based on your trading preferences and risk tolerance.
          </p>
          <div className="space-y-3 text-sm text-slate-400 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Custom price thresholds</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Personalized risk levels</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Multiple alert conditions</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Real-time monitoring</span>
            </div>
          </div>
          <button className="w-full px-6 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
            Upgrade to Premium+
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Custom Alert Thresholds</h1>
            <p className="text-slate-400">Set personalized alert thresholds based on your trading preferences</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={addThreshold}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Threshold</span>
              </button>
              <div className="relative group">
                <button className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Alerts</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => addAIThreshold('short')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors text-sm"
                    >
                      Short Term AI Alert
                    </button>
                    <button
                      onClick={() => addAIThreshold('medium')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors text-sm"
                    >
                      Medium Term AI Alert
                    </button>
                    <button
                      onClick={() => addAIThreshold('long')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors text-sm"
                    >
                      Long Term AI Alert
                    </button>
                    <button
                      onClick={() => addAIThreshold('overall')}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 transition-colors text-sm"
                    >
                      Overall AI Alert
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={saveThresholds}
              disabled={saving}
              className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 mb-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Alert Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-blue mb-2">
                {thresholds.length}
              </div>
              <p className="text-slate-400">Total Thresholds</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-green mb-2">
                {thresholds.filter(t => t.enabled).length}
              </div>
              <p className="text-slate-400">Active Alerts</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-yellow mb-2">
                {thresholds.filter(t => t.metric === 'btc_price').length}
              </div>
              <p className="text-slate-400">Price Alerts</p>
            </div>
          </div>
        </div>

        {/* Thresholds List */}
        <div className="space-y-6">
          {thresholds.map((threshold) => {
            const IconComponent = getIconComponent(threshold.icon);
            console.log('Rendering threshold:', threshold.id, 'with icon:', threshold.icon, 'IconComponent:', IconComponent);
            
            // Safety check - if IconComponent is undefined, use Bell
            if (!IconComponent) {
              console.error('IconComponent is undefined for threshold:', threshold);
              return null; // Skip rendering this threshold
            }
            
            return (
              <div key={threshold.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                  {IconComponent ? (
                    <IconComponent className="w-6 h-6 text-crypto-blue" />
                  ) : (
                    <Bell className="w-6 h-6 text-crypto-blue" />
                  )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{threshold.name}</h3>
                      <p className="text-slate-400">{threshold.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleThreshold(threshold.id)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        threshold.enabled 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {threshold.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => deleteThreshold(threshold.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-1 gap-4 ${threshold.metric && threshold.metric.startsWith('ai_prediction_') ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Metric</label>
                    <select
                      value={threshold.metric}
                      onChange={(e) => updateThreshold(threshold.id, 'metric', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                    >
                      {getMetricOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Condition</label>
                    <select
                      value={threshold.condition}
                      onChange={(e) => updateThreshold(threshold.id, 'condition', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                    >
                      {getConditionOptions(threshold.metric).map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Value</label>
                    {threshold.metric && threshold.metric.startsWith('ai_prediction_') ? (
                      <select
                        value={threshold.value}
                        onChange={(e) => updateThreshold(threshold.id, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                      >
                        <option value="BULLISH">Bullish</option>
                        <option value="BEARISH">Bearish</option>
                        <option value="NEUTRAL">Neutral</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={threshold.value}
                        onChange={(e) => updateThreshold(threshold.id, 'value', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                        placeholder="0"
                      />
                    )}
                  </div>

                  {!(threshold.metric && threshold.metric.startsWith('ai_prediction_')) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                      <input
                        type="text"
                        value={threshold.unit}
                        onChange={(e) => updateThreshold(threshold.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                        placeholder="USD"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Alert Name</label>
                  <input
                    type="text"
                    value={threshold.name}
                    onChange={(e) => updateThreshold(threshold.id, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                    placeholder="Enter alert name"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={threshold.description}
                    onChange={(e) => updateThreshold(threshold.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                    placeholder="Enter description"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Toast Notification */}
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default CustomAlertThresholds;
