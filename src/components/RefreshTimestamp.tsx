// src/components/RefreshTimestamp.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

const RefreshTimestamp: React.FC = () => {
  const [timestamp, setTimestamp] = useState<string>(new Date().toLocaleString());
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Set timestamp on initial load
  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
  }, []);

  return (
    <div className="w-full mt-8 mb-4 text-center">
      <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
      }`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Dashboard data last refreshed: <strong>{timestamp}</strong>
        </span>
      </div>
      <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        To see the latest deployment data, please refresh the page.
      </p>
    </div>
  );
};

export default RefreshTimestamp;