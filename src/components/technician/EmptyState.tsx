// src/components/technician/EmptyState.tsx
import React from 'react';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  themeObject: {
    background: string;
    text: string;
    cardBackground: string;
    inputBackground: string;
    border: string;
    button: string;
    buttonDisabled: string;
    buttonText: string;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, subMessage, themeObject }) => {
  const isDark = themeObject.background === '#121212';

  return (
    <div 
      className="w-full py-12 px-4 rounded-lg text-center border-2 border-dashed my-6"
      style={{ 
        borderColor: isDark ? '#374151' : '#E5E7EB',
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.7)'
      }}
    >
      <div className="max-w-md mx-auto">
        <svg 
          className="h-12 w-12 mx-auto mb-4 opacity-50" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ color: isDark ? '#64748B' : '#94A3B8' }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
          />
        </svg>
        <h3 
          className="text-lg font-medium mb-2" 
          style={{ color: themeObject.text }}
        >
          {message}
        </h3>
        {subMessage && (
          <p 
            className="text-sm" 
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmptyState;