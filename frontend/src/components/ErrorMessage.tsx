import React from 'react';
import { errorStyles } from '../utils/formStyles';

interface ErrorMessageProps {
  message: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className = '', 
  style = {} 
}) => {
  if (!message) return null;

  return (
    <div 
      className={className}
      style={{ ...errorStyles.container, ...style }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
};
