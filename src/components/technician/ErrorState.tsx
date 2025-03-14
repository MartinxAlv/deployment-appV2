// src/components/technician/ErrorState.tsx
import React from 'react';

interface ErrorStateProps {
  error: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg my-4">
      <p className="font-medium">Error loading deployments</p>
      <p className="text-sm">{error}</p>
      <p className="text-sm mt-2">Please try refreshing the page or contact support if the problem persists.</p>
    </div>
  );
};

export default ErrorState;