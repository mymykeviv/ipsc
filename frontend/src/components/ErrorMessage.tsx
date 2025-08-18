import React from 'react';
import { errorStyles } from '../utils/formStyles';

interface ErrorMessageProps {
  message: string | null;
  className?: string;
  style?: React.CSSProperties;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className = '', 
  style = {},
  type = 'error',
  showIcon = true,
  dismissible = false,
  onDismiss
}) => {
  if (!message) return null;

  const getIcon = () => {
    if (!showIcon) return null;
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getStyles = () => {
    const baseStyles = { ...errorStyles.container, ...style };
    
    switch (type) {
      case 'warning':
        return {
          ...baseStyles,
          color: '#856404',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7'
        };
      case 'info':
        return {
          ...baseStyles,
          color: '#0c5460',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb'
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div 
      className={className}
      style={getStyles()}
      role="alert"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {getIcon()}
          <span>{message}</span>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: 'inherit',
              padding: '0',
              marginLeft: '8px'
            }}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
