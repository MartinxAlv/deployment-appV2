// src/components/technician/DeploymentFilters.tsx
import React from 'react';

interface DeploymentFiltersProps {
  technicians: string[];
  selectedTechnician: string;
  onTechnicianChange: (technician: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  themeObject: {
    text: string;
    cardBackground: string;
    border: string;
  };
}

const DeploymentFilters: React.FC<DeploymentFiltersProps> = ({
  technicians,
  selectedTechnician,
  onTechnicianChange,
  searchQuery,
  onSearchChange,
  themeObject
}) => {
  return (
    <div className="mb-6 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Technician Selection Dropdown */}
      <div>
        <label 
          htmlFor="technician-select" 
          className="block mb-2 font-medium"
          style={{ color: themeObject.text }}
        >
          Select Technician:
        </label>
        <select
          id="technician-select"
          value={selectedTechnician}
          onChange={(e) => onTechnicianChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          style={{
            backgroundColor: themeObject.cardBackground,
            color: themeObject.text,
            borderColor: themeObject.border
          }}
        >
          <option value="">-- Select a Technician --</option>
          {technicians.map(tech => (
            <option key={tech} value={tech}>{tech}</option>
          ))}
        </select>
      </div>
      
      {/* Search Input */}
      <div>
        <label 
          htmlFor="search-input" 
          className="block mb-2 font-medium"
          style={{ color: themeObject.text }}
        >
          Search Deployments:
        </label>
        <div className="relative">
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by any field..."
            className="w-full px-4 py-2 pl-10 border rounded-md"
            style={{
              backgroundColor: themeObject.cardBackground,
              color: themeObject.text,
              borderColor: themeObject.border
            }}
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 absolute left-3 top-2.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ color: themeObject.text }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-2.5"
              style={{ color: themeObject.text }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploymentFilters;