import React, { useState, useEffect } from 'react';
import { Zap, Gauge } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartComponent from './ChartComponent';
import { kafkaConsumer } from '../services/kafkaConsumer';
import styles from '../styles/DashboardLayout.module.css';

// Status calculations helper
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

// Unified data hook using Kafka
const useElectricalData = () => {
  const [currentData, setCurrentData] = useState({
    energyConsumption: 0,
    cosPhi: 0,
    amperage: 0,
    power: 0,
    frequency: 0
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds] = useState({
    cosPhi: { excellent: 0.95, good: 0.90, warning: 0.85 },
    amperage: { normal: 16, warning: 20 },
    frequency: { stable_min: 49.9, stable_max: 50.1, acceptable_min: 49.5, acceptable_max: 50.5 }
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = null;

    const start = async () => {
      try {
        await kafkaConsumer.connect();

        // subscribe returns an unsubscribe function in this assumed API
        unsubscribe = await kafkaConsumer.subscribe(({ type, value }) => {
          if (!mounted) return;

          // Map incoming types to currentData keys
          setCurrentData(prev => {
            const next = { ...prev };
            switch (type) {
              case 'energy':
                next.energyConsumption = value;
                break;
              case 'cosPhi':
                next.cosPhi = value;
                break;
              case 'amperage':
                next.amperage = value;
                break;
              case 'power':
                next.power = value;
                break;
              case 'frequency':
                next.frequency = value;
                break;
              default:
                break;
            }
            return next;
          });

          // Append historical record with timestamp
          setHistoricalData(prev => {
            const record = {
              time: new Date().toLocaleTimeString(),
              type,
              value
            };
            return [...prev, record].slice(-200); // keep last 200 records
          });

          setIsLoading(false);
        });
      } catch (err) {
        if (!mounted) return;
        console.error('Kafka consumer error', err);
        setError(err?.message || 'Kafka error');
        setIsLoading(false);
      }
    };

    start();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (_) {}
      }
      try { kafkaConsumer.disconnect(); } catch (_) {}
    };
  }, []);

  return { currentData, historicalData, isLoading, thresholds, error };
};

// Main Dashboard Component
const ElectricCounterDashboard = () => {
  const { currentData, historicalData, isLoading, thresholds, error } = useElectricalData();
  const [darkMode, setDarkMode] = useState(false);

  const statusData = {
    cosPhi: getStatusFromThresholds(currentData.cosPhi, thresholds, 'cosPhi'),
    amperage: getStatusFromThresholds(currentData.amperage, thresholds, 'amperage'),
    frequency: getStatusFromThresholds(currentData.frequency, thresholds, 'frequency')
  };

  const chartConfigs = [
    {
      title: "Energy Consumption Trend",
      data: historicalData.filter(item => item.type === 'energy'),
      dataKey: "value",
      chartType: "area",
      color: "#3B82F6",
      icon: Zap,
      unit: "kWh",
      xAxis: {
        dataKey: "time",
        type: "category"
      }
    },
    {
      title: "Current Load Monitoring",
      data: historicalData.filter(item => item.type === 'amperage'),
      dataKey: "value",
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
        type: "category"
      }
    }
  ];

  return (
    <div className={`${styles.dashboard} ${darkMode ? styles['dashboard--dark'] : styles['dashboard--light']}`}>
      {error && <div className="text-red-500">Error: {error}</div>}
      {isLoading && <div>Loading data...</div>}

      <div className="metrics-grid">
        <MetricCard title="Energy (kWh)" value={currentData.energyConsumption} unit="kWh" />
        <MetricCard title="Power (W)" value={currentData.power} unit="W" />
        <MetricCard title="Cos Φ" value={currentData.cosPhi} unit="" status={statusData.cosPhi} />
        <MetricCard title="Amperage (A)" value={currentData.amperage} unit="A" status={statusData.amperage} />
        <MetricCard title="Frequency (Hz)" value={currentData.frequency} unit="Hz" status={statusData.frequency} />
      </div>

      <div className="charts">
        {chartConfigs.map((cfg, idx) => (
          <ChartComponent key={idx} config={cfg} />
        ))}
      </div>
    </div>
  );
};

export default ElectricCounterDashboard;