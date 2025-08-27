import React, { useCallback, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import styles from '../styles/Charts.module.css';

const ChartComponent = React.memo(({ 
  title, 
  data, 
  dataKey, 
  chartType = 'line', 
  color = '#3B82F6', 
  icon: Icon,
  unit = '',
  showReferenceLines = false,
  referenceLines = [],
  showLegend = false,
  legendItems = [],
  yAxisDomain = 'auto',
  height = 320,
  darkMode = false,
  xAxis = { dataKey: 'time', type: 'category', tickFormatter: (value) => value.slice(0, 5) }
}) => {
  const [currentData, setCurrentData] = useState([...data]);

  const formatTooltipValue = useCallback((value) => 
    [Number(value).toFixed(2) + ` ${unit}`, title.split(' ')[0]], 
    [unit, title]
  );

  const tooltipStyle = {
    backgroundColor: darkMode ? '#374151' : '#ffffff',
    border: `1px solid ${darkMode ? '#4B5563' : '#e2e8f0'}`,
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontSize: '14px',
    color: darkMode ? '#121d86ff' : '#000000'
  };

  const gradientId = `${dataKey}Gradient`;
    
  const renderChart = () => {
    if (chartType === 'area') {
      return (
        <AreaChart data={currentData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#f1f5f9"} />
          <XAxis 
            dataKey={xAxis.dataKey}
            type={xAxis.type}
            tickFormatter={xAxis.tickFormatter}
            stroke={darkMode ? "#9CA3AF" : "#64748b"}
            fontSize={11}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke={darkMode ? "#9CA3AF" : "#64748b"}
            fontSize={11}
            domain={yAxisDomain === 'auto' ? ['dataMin - 5', 'dataMax + 5'] : yAxisDomain}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={formatTooltipValue}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
          {showReferenceLines && referenceLines.map((line, index) => (
            <ReferenceLine 
              key={index} 
              y={line.value} 
              stroke={line.color} 
              strokeDasharray="8 8"
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );
    } else {
      return (
        <LineChart data={currentData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#f1f5f9"} />
          <XAxis 
            dataKey={xAxis.dataKey}
            type={xAxis.type}
            tickFormatter={xAxis.tickFormatter}
            stroke={darkMode ? "#9CA3AF" : "#64748b"}
            fontSize={11}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke={darkMode ? "#9CA3AF" : "#64748b"}
            fontSize={11}
            domain={yAxisDomain === 'auto' ? ['dataMin - 5', 'dataMax + 5'] : yAxisDomain}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={tooltipStyle}
            formatter={formatTooltipValue}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#ffffff' }}
          />
          {showReferenceLines && referenceLines.map((line, index) => (
            <ReferenceLine 
              key={index} 
              y={line.value} 
              stroke={line.color} 
              strokeDasharray="8 8"
              strokeWidth={2}
            />
          ))}
        </LineChart>
      );
    }
  };

  useEffect(() => {
    if (data.length === 0) return;
    
    let dataIndex = 0;
    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      setCurrentData(prevData => {
        const newData = [...prevData];
        newData[dataIndex % data.length] = {
          ...data[dataIndex % data.length],
          time: currentTime
        };
        return newData;
      });
      
      dataIndex++;
    }, 3000);

    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    setCurrentData([...data]);
  }, [data]);

  return (
    <div className={`${styles['chart-container']} ${
      darkMode ? styles['chart-container--dark'] : styles['chart-container--light']
    }`}>
      <h3 className={styles['chart-title']}>
        <div className={styles['chart-title__icon']}>
          <Icon size={20} />
        </div>
        {title}
      </h3>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className={styles['chart-legend']}>
          {legendItems.map((item, index) => (
            <div key={index} className={styles['legend-item']}>
              <div 
                className={styles['legend-item__indicator']} 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className={`${styles['legend-item__label']} ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default ChartComponent;