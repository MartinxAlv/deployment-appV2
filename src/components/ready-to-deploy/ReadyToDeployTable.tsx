// src/components/ready-to-deploy/ReadyToDeployTable.tsx
import React from 'react';
import { DeploymentData } from '@/lib/googleSheetsService';

interface ReadyToDeployTableProps {
  deployments: DeploymentData[];
  selectedTechnician: string;
  onEditDeployment: (deployment: DeploymentData) => void;
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

const ReadyToDeployTable: React.FC<ReadyToDeployTableProps> = ({
  deployments,
  selectedTechnician,
  onEditDeployment,
  themeObject
}) => {
  const isDark = themeObject.background === '#121212';

  // Define the specific columns we want to show for Ready to Deploy items
  const columns = [
    { field: "Assigned To", label: "Assigned To", render: (d: DeploymentData) => d["Assigned To"] || '-' },
    { field: "Location", label: "Location", render: (d: DeploymentData) => d.Location || '-' },
    { field: "Current Model", label: "Current Model", render: (d: DeploymentData) => d["Current Model"] || '-' },
    { field: "Current SN", label: "Current SN", render: (d: DeploymentData) => d["Current SN"] || '-' },
    { field: "New Model", label: "New Model", render: (d: DeploymentData) => d["New Model"] || '-' },
    { field: "New SN", label: "New SN", render: (d: DeploymentData) => d["New SN"] || '-' },
    { field: "New Monitor Type", label: "Monitor Type", render: (d: DeploymentData) => d["New Monitor Type"] || '-' },
    { field: "New Monitor 1 SN", label: "Monitor 1 SN", render: (d: DeploymentData) => d["New Monitor 1 SN"] || '-' },
    { field: "New Monitor 2 SN", label: "Monitor 2 SN", render: (d: DeploymentData) => d["New Monitor 2 SN"] || '-' },
    { field: "New Other", label: "Other", render: (d: DeploymentData) => d["New Other"] || '-' }
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
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
              >
                <div className="flex items-center">
                  <span>{column.label}</span>
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
                    onClick={() => onEditDeployment(deployment)}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition"
                    style={{ 
                      backgroundColor: themeObject.button,
                      color: themeObject.buttonText
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 border-t">
        Showing {deployments.length} Ready to Deploy items for {selectedTechnician}
      </div>
    </div>
  );
};

export default ReadyToDeployTable;