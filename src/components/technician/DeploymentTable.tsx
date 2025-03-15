import React from 'react';
import { DeploymentData } from '@/lib/googleSheetsService';
import { StatusBadge, PriorityBadge } from './StatusBadges';

interface DeploymentTableProps {
  deployments: DeploymentData[];
  selectedTechnician: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  onViewDetails: (deployment: DeploymentData) => void;
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

const DeploymentTable: React.FC<DeploymentTableProps> = ({
  deployments,
  selectedTechnician,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onViewDetails,
  themeObject
}) => {
  // Function to format a date string
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString();
    } catch (error) {
      console.warn("Date formatting error:", error);
      return dateStr;
    }
  };

  // Handle sort click
  const handleSortClick = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default ascending
      onSortFieldChange(field);
      onSortDirectionChange('asc');
    }
  };

  // Sort icon based on current sort state
  const getSortIcon = (field: string) => {
    if (field !== sortField) {
      // Not sorted by this field
      return <span className="text-gray-400">↕</span>;
    }
    
    return sortDirection === 'asc' 
      ? <span className="text-blue-500">↑</span> 
      : <span className="text-blue-500">↓</span>;
  };

  const isDark = themeObject.background === '#121212';

  // Column definitions
  const columns = [
    { field: "Status", label: "Status", render: (d: DeploymentData) => <StatusBadge status={d.Status} /> },
    { field: "Deployment ID", label: "ID", render: (d: DeploymentData) => d["Deployment ID"] || '-' },
    { field: "Deployment Date", label: "Date", render: (d: DeploymentData) => formatDate(d["Deployment Date"]) },
    { field: "Location", label: "Location", render: (d: DeploymentData) => d.Location || '-' },
    { field: "Assigned To", label: "User", render: (d: DeploymentData) => d["Assigned To"] || '-' },
    { field: "New Device Type", label: "Device Type", render: (d: DeploymentData) => d["New Device Type"] || d["Deployment Type"] || '-' },
    { field: "New Model", label: "Model", render: (d: DeploymentData) => d["New Model"] || '-' },
    { field: "Priority", label: "Priority", render: (d: DeploymentData) => <PriorityBadge priority={d.Priority} /> }
  ];

  return (
    <div 
      className="w-full overflow-x-auto rounded-lg shadow-sm border"
      style={{ 
        backgroundColor: themeObject.cardBackground,
        borderColor: themeObject.border
      }}
    >
      <table className="min-w-full">
        <thead>
          <tr className={isDark ? "bg-gray-800" : "bg-gray-50"}>
            {columns.map((column) => (
              <th 
                key={column.field}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                onClick={() => handleSortClick(column.field)}
              >
                <div className="flex items-center">
                  <span>{column.label}</span>
                  <span className="ml-1">{getSortIcon(column.field)}</span>
                </div>
              </th>
            ))}
            <th 
              className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-center"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {deployments.map((deployment) => {
            // Get a unique key for the row
            const rowKey = deployment.id || deployment["Deployment ID"] || Math.random().toString();
            
            return (
              <tr 
                key={rowKey} 
                className={isDark 
                  ? "hover:bg-gray-700 transition-colors" 
                  : "hover:bg-gray-50 transition-colors"
                }
              >
                {columns.map((column) => (
                  <td 
                    key={`${rowKey}-${column.field}`}
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ color: themeObject.text }}
                  >
                    {column.render(deployment)}
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    onClick={() => onViewDetails(deployment)}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition"
                    style={{ 
                      backgroundColor: themeObject.button,
                      color: themeObject.buttonText
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border-t">
        Showing {deployments.length} deployments for {selectedTechnician}
      </div>
    </div>
  );
};

export default DeploymentTable;