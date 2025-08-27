import React, { useState, useEffect } from 'react';
import { Activity, Zap, Gauge, TrendingUp, Radio, Moon, Sun } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartComponent from './ChartComponent';
import electricalData from '../electrical_data.json';
import styles from '../styles/DashboardLayout.module.css';

// Status calculations based on thresholds from JSON
const getStatusFromThresholds = (value, thresholds, type) => {
  const t = thresholds[type];
  
  switch (type) {
    case 'cosPhi':
      if (value >= t.excellent) return { status: 'Excellent', color: 'text-green-600' };
      if (value >= t.good) return { status: 'Good', color: 'text-green-600' };
      if (value >= t.warning) return { status: 'Warning', color: 'text-yellow-600' };
      return { status: 'Poor', color: 'text-red-600' };
    
    case 'amperage':
      if (value <= t.normal) return { status: 'Normal', color: 'text-green-600' };
      if (value <= t.warning) return { status: 'Warning', color: 'text-yellow-600' };
      return { status: 'Critical', color: 'text-red-600' };
    
    case 'frequency':
      if (value >= t.stable_min && value <= t.stable_max) return { status: 'Stable', color: 'text-green-600' };
      if (value >= t.acceptable_min && value <= t.acceptable_max) return { status: 'Acceptable', color: 'text-yellow-600' };
      return { status: 'Unstable', color: 'text-red-600' };
    
    default:
      return { status: 'Unknown', color: 'text-gray-600' };
  }
};

// Custom hook for loading data from JSON file
const useElectricalDataFromJSON = () => {
  const [currentData, setCurrentData] = useState({
    energyConsumption: 0,
    cosPhi: 0,
    amperage: 0,
    power: 0,
    frequency: 0
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState({
    cosPhi: { excellent: 0.95, good: 0.90, warning: 0.85 },
    amperage: { normal: 16, warning: 20 },
    frequency: { stable_min: 49.9, stable_max: 50.1, acceptable_min: 49.5, acceptable_max: 50.5 }
  });
  const [error, setError] = useState(null);

  // Load JSON data from file
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        setCurrentData({
          energyConsumption: electricalData.currentData.energyConsumption,
          cosPhi: electricalData.currentData.cosPhi,
          amperage: electricalData.currentData.amperage,
          power: electricalData.currentData.power,
          frequency: electricalData.currentData.frequency
        });
        setHistoricalData(electricalData.historicalData);
        setThresholds(electricalData.thresholds);
        
        console.log('Successfully loaded data from electrical-data.json');
      } catch (error) {
        console.error('Error loading JSON file:', error);
        setError('Failed to load electrical data file. Using fallback data.');
        
        // Fallback data if file cannot be loaded
        const fallbackData = {
          currentData: {
            energyConsumption: 1247.5,
            cosPhi: 0.92,
            amperage: 15.8,
            power: 3634,
            frequency: 50.0
          },
          historicalData: [
            { time: "14:30:00", energy: 1245.2, cosPhi: 0.91, amperage: 14.5, power: 3580, frequency: 49.98 },
            { time: "14:30:03", energy: 1245.7, cosPhi: 0.93, amperage: 15.2, power: 3612, frequency: 50.01 },
            { time: "14:30:06", energy: 1246.1, cosPhi: 0.89, amperage: 16.1, power: 3645, frequency: 49.99 }
          ],
          thresholds: {
            cosPhi: { excellent: 0.95, good: 0.90, warning: 0.85 },
            amperage: { normal: 16, warning: 20 },
            frequency: { stable_min: 49.9, stable_max: 50.1, acceptable_min: 49.5, acceptable_max: 50.5 }
          }
        };
        
        setCurrentData(fallbackData.currentData);
        setHistoricalData(fallbackData.historicalData);
        setThresholds(fallbackData.thresholds);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Simulate real-time updates by cycling through historical data
  useEffect(() => {
    if (historicalData.length === 0) return;
    
    let dataIndex = 0;
    const interval = setInterval(() => {
      const nextData = historicalData[dataIndex % historicalData.length];
      setCurrentData({
        energyConsumption: nextData.energy,
        cosPhi: nextData.cosPhi,
        amperage: nextData.amperage,
        power: nextData.power,
        frequency: nextData.frequency
      });
      dataIndex++;
    }, 3000);

    return () => clearInterval(interval);
  }, [historicalData]);

  return { currentData, historicalData, isLoading, thresholds, error };
};

// Main Dashboard Component
const ElectricCounterDashboard = () => {
  const { currentData, historicalData, isLoading, thresholds, error } = useElectricalDataFromJSON();
  const [darkMode, setDarkMode] = useState(false);
  
  // Status calculations based on JSON thresholds
  const statusData = {
    cosPhi: getStatusFromThresholds(currentData.cosPhi, thresholds, 'cosPhi'),
    amperage: getStatusFromThresholds(currentData.amperage, thresholds, 'amperage'),
    frequency: getStatusFromThresholds(currentData.frequency, thresholds, 'frequency')
  };

  // Chart configurations
  const chartConfigs = [
    {
      title: "Energy Consumption Trend",
      data: historicalData,
      dataKey: "energy",
      chartType: "area",
      color: "#3B82F6",
      icon: Zap,
      unit: "kWh",
      xAxis: {
        dataKey: "time",
        type: "category",
        tickFormatter: (time) => {
          const date = new Date();
          const [hours, minutes, seconds] = time.split(":");
          date.setHours(hours, minutes, seconds);
          return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
    },
    {
      title: "Current Load Monitoring",
      data: historicalData,
      dataKey: "amperage",
      chartType: "line",
      color: "#F59E0B",
      icon: Gauge,
      unit: "A",
      yAxisDomain: [0, 25],
      showReferenceLines: true,
      referenceLines: [
        { value: thresholds.amperage.normal, color: '#10B981' },
        { value: thresholds.amperage.warning, color: '#EF4444' }
      ],
      showLegend: true,
      legendItems: [
        { color: '#10B981', label: `Safe (≤${thresholds.amperage.normal}A)` },
        { color: '#F59E0B', label: `Warning (${thresholds.amperage.normal}-${thresholds.amperage.warning}A)` },
        { color: '#EF4444', label: `Critical (>${thresholds.amperage.warning}A)` }
      ],
      xAxis: {
        dataKey: "time",
        type: "category",
        tickFormatter: (time) => {
          const date = new Date();
          const [hours, minutes, seconds] = time.split(":");
          date.setHours(hours, minutes, seconds);
          return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
    }
  ];

  return (
    <div className={`${styles.dashboard} ${darkMode ? styles['dashboard--dark'] : styles['dashboard--light']}`}>
      <div className={styles.container}>
        {/* Enhanced Header */}
        <div className={styles.header}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`${styles.darkModeToggle} ${
              darkMode ? styles['darkModeToggle--dark'] : styles['darkModeToggle--light']
            }`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          
          <h1 className={`${styles.title} ${darkMode ? styles['title--dark'] : styles['title--light']}`}>
            Smart Electric Dashboard
          </h1>
          <p className={`${styles.subtitle} ${darkMode ? styles['subtitle--dark'] : styles['subtitle--light']}`}>
            Advanced Real-time Electrical Parameter Monitoring
          </p>
          <div className={`${styles.statusBadge} ${darkMode ? styles['statusBadge--dark'] : styles['statusBadge--light']}`}>
            <div className={styles.statusIndicator}></div>
            Live • Last updated: {new Date().toLocaleString()}
            {error && <span className="ml-2 text-yellow-500">({error})</span>}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <MetricCard
            icon={Zap}
            title="Energy Consumption"
            value={currentData.energyConsumption}
            unit="kWh"
            color="#3B82F6"
            showStatus={false}
            isLoading={isLoading}
            darkMode={darkMode}
            cardType="energy-consumption"
          />
          
          <MetricCard
            icon={Activity}
            title="Power Factor (cos φ)"
            value={currentData.cosPhi}
            unit=""
            color="#10B981"
            status={statusData.cosPhi.status}
            statusColor={statusData.cosPhi.color}
            isLoading={isLoading}
            darkMode={darkMode}
            cardType="power-factor"
          />
          
          <MetricCard
            icon={Gauge}
            title="Current"
            value={currentData.amperage}
            unit="A"
            color="#F59E0B"
            status={statusData.amperage.status}
            statusColor={statusData.amperage.color}
            isLoading={isLoading}
            darkMode={darkMode}
            cardType="current-load"
          />
          
          <MetricCard
            icon={TrendingUp}
            title="Active Power"
            value={currentData.power}
            unit="W"
            color="#8B5CF6"
            showStatus={false}
            isLoading={isLoading}
            darkMode={darkMode}
            cardType="active-power"
          />

          <MetricCard
            icon={Radio}
            title="Frequency"
            value={currentData.frequency}
            unit="Hz"
            color="#EF4444"
            status={statusData.frequency.status}
            statusColor={statusData.frequency.color}
            isLoading={isLoading}
            darkMode={darkMode}
            cardType="frequency"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {chartConfigs.map((config, index) => (
            <ChartComponent key={index} {...config} darkMode={darkMode} />
          ))}
        </div>

        {/* Status Overview */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8 transition-colors duration-300`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            <Gauge className="mr-3 text-green-500" size={24} />
            System Health Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Power Factor', status: statusData.cosPhi, gradient: darkMode ? 'from-green-900 to-green-800' : 'from-green-50 to-green-100' },
              { label: 'Current Load', status: statusData.amperage, gradient: darkMode ? 'from-yellow-900 to-yellow-800' : 'from-yellow-50 to-yellow-100' },
              { label: 'Frequency', status: statusData.frequency, gradient: darkMode ? 'from-red-900 to-red-800' : 'from-red-50 to-red-100' },
              { label: 'System', status: { status: 'Online', color: 'text-green-500' }, gradient: darkMode ? 'from-blue-900 to-blue-800' : 'from-blue-50 to-blue-100' }
            ].map((item, index) => (
              <div key={index} className={`text-center p-6 rounded-xl bg-gradient-to-br ${item.gradient} transform hover:scale-105 transition-transform duration-200`}>
                <div className={`w-8 h-8 rounded-full mx-auto mb-4 shadow-lg ${
                  item.status.status === 'Excellent' || item.status.status === 'Good' || item.status.status === 'Normal' || item.status.status === 'Stable' || item.status.status === 'Online'
                    ? 'bg-green-500 shadow-green-500/50' 
                    : item.status.status === 'Warning' || item.status.status === 'Acceptable'
                      ? 'bg-yellow-500 shadow-yellow-500/50' 
                      : 'bg-red-500 shadow-red-500/50'
                }`}></div>
                <div className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.label}</div>
                <div className={`text-xs font-medium mt-2 ${item.status.color}`}>{item.status.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Panel */}
        <div className={`${styles.infoPanel} ${darkMode ? styles['infoPanel--dark'] : styles['infoPanel--light']}`}>
          <h4 className={styles.infoPanelTitle}>
            <Activity className={styles.infoPanelIcon} size={24} />
            Parameter Reference Guide
          </h4>
          <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            <div className={`space-y-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} p-4 rounded-lg`}>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Power Factor (cos φ):</span> Measures electrical efficiency. Values above 0.95 indicate excellent power quality.</p>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Current Load:</span> Current flow through the system. Safe operation ≤16A, warning at 16-20A.</p>
            </div>
            <div className={`space-y-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} p-4 rounded-lg`}>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Energy Consumption:</span> Cumulative energy usage measured in kilowatt-hours (kWh).</p>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Active Power:</span> Real electrical power being consumed by the load in Watts.</p>
            </div>
            <div className={`space-y-3 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} p-4 rounded-lg`}>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Frequency:</span> AC system frequency. Stable at 50Hz ±0.1Hz for optimal performance.</p>
              <p><span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>Real-time Monitoring:</span> Data updates every 3 seconds using JSON configuration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricCounterDashboard;