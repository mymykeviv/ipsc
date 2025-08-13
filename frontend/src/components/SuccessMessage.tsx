import React from 'react';
import { successStyles } from '../utils/formStyles';

interface SuccessMessageProps {
  message: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ 
  message, 
  className = '', 
  style = {} 
}) => {
  if (!message) return null;

  return (
    <div 
      className={className}
      style={{ ...successStyles.container, ...style }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};
