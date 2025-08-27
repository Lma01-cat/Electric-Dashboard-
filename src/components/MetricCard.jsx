import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import styles from '../styles/MetricCards.module.css';

const MetricCard = React.memo(({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  color, 
  status, 
  statusColor,
  showStatus = true,
  isLoading = false,
  darkMode = false,
  cardType
}) => {
  return (
    <div 
      className={`${styles['metric-card']} ${styles[`${cardType}-card`]} ${
        darkMode ? styles['metric-card--dark'] : styles['metric-card--light']
      }`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <div className={styles['metric-card__icon-wrapper']}>
              {Icon && <Icon size={20} />}
            </div>
            <h3 className={`${styles['metric-card__title']} ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {title}
            </h3>
          </div>
          
          <div className="flex items-baseline space-x-2 mb-2">
            {isLoading ? (
              <div className={styles['loading-placeholder']} />
            ) : (
              <span className={`${styles['metric-card__value']} ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            )}
            <span className={`${styles['metric-card__unit']} ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {unit}
            </span>
          </div>
          
          {showStatus && status && (
            <div className={`${styles['status-indicator']} ${statusColor}`}>
              {statusColor.includes('green') && <CheckCircle size={16} className="mr-1" />}
              {statusColor.includes('yellow') && <AlertTriangle size={16} className="mr-1" />}
              {statusColor.includes('red') && <AlertTriangle size={16} className="mr-1" />}
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MetricCard;