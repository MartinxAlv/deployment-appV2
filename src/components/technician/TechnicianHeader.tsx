// src/components/technician/TechnicianHeader.tsx
import React from 'react';
import { ThemeToggleSwitch } from "../ThemeToggleSwitch";
import { LogoutButton } from "../LogoutButton";

interface TechnicianHeaderProps {
  onNavigateBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TechnicianHeader: React.FC<TechnicianHeaderProps> = ({
  onNavigateBack,
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-blue-500 py-3 px-4 z-10">
      {/* Grid layout with 3 sections: left, center, right */}
      <div className="grid grid-cols-3 items-center">
        {/* Left section */}
        <div className="flex items-center">
          <button
            onClick={onNavigateBack}
            className="px-4 py-2 rounded-md font-medium bg-white text-blue-600 hover:bg-blue-50 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </button>
        </div>
        
        {/* Center section - title */}
        <div className="flex justify-center">
          <h1 className="text-xl font-bold text-white">Technician Deployments</h1>
        </div>
        
        {/* Right section - refresh and user controls */}
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-md font-medium bg-white text-blue-600 hover:bg-blue-50 transition flex items-center"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
          
          <ThemeToggleSwitch />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default TechnicianHeader;