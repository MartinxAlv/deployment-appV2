// src/components/technician/LoadingState.tsx
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading deployment data...</p>
      </div>
    </div>
  );
};

export default LoadingState;