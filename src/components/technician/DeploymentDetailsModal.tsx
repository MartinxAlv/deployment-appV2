import React from 'react';
import { DeploymentData } from '@/lib/googleSheetsService';
import { useTheme } from "@/components/ThemeProvider";

interface DeploymentDetailsModalProps {
  deployment: DeploymentData;
  onClose: () => void;
}

interface FieldDefinition {
  key: string;
  label: string;
  format?: (value: string) => string;
  isMultiline?: boolean;
  isLink?: boolean;
}

interface SectionDefinition {
  title: string;
  fields: FieldDefinition[];
}

const DeploymentDetailsModal: React.FC<DeploymentDetailsModalProps> = ({
  deployment,
  onClose
}) => {
  // Use the theme from context
  const { themeObject, theme } = useTheme();
  
  // Format date values safely
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not specified';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString();
    } catch (error) {
      console.warn("Date formatting error:", error);
      return dateStr;
    }
  };

  // Get status color for badge
  const getStatusColorClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    const s = status.toLowerCase();
    if (s.includes('complete') || s === 'deployed') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (s.includes('progress') || s === 'ready to deploy') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (s === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (s === 'on hold') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  // Determine if we're in dark mode
  const isDark = theme === 'dark';

  // Group fields into sections
  const sections: SectionDefinition[] = [
    {
      title: 'Deployment Information',
      fields: [
        { key: 'Deployment ID', label: 'Deployment ID' },
        { key: 'Status', label: 'Status' },
        { key: 'Deployment Date', label: 'Date', format: formatDate },
        { key: 'Priority', label: 'Priority' },
      ]
    },
    {
      title: 'Location & Assignment',
      fields: [
        { key: 'Location', label: 'Location' },
        { key: 'Department', label: 'Department' },
        { key: 'Division', label: 'Division' },
        { key: 'Department - Division', label: 'Department - Division' },
        { key: 'Assigned To', label: 'Assigned To' },
        { key: 'Technician', label: 'Technician' },
      ]
    },
    {
      title: 'Device Information',
      fields: [
        { key: 'Deployment Type', label: 'Deployment Type' },
        { key: 'New Device Type', label: 'Device Type' },
        { key: 'New Model', label: 'Model' },
        { key: 'New SN', label: 'Serial Number' },
        { key: 'Current Model', label: 'Current Model' },
        { key: 'Current SN', label: 'Current Serial Number' },
      ]
    },
    {
      title: 'Additional Information',
      fields: [
        { key: 'SR#', label: 'SR#' },
        { key: 'SR Link', label: 'SR Link', isLink: true },
        { key: 'Deployment SR#', label: 'Deployment SR#' },
        { key: 'Deployment SR Link', label: 'Deployment SR Link', isLink: true },
      ]
    },
    {
      title: 'Notes',
      fields: [
        { key: 'Deployment Notes', label: 'Deployment Notes', isMultiline: true },
        { key: 'Technician Notes', label: 'Technician Notes', isMultiline: true },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div 
        className="rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: themeObject.border }}>
          <div>
            <h2 className="text-xl font-bold">Deployment Details</h2>
            {deployment.Status && (
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(deployment.Status)}`}>
                  {deployment.Status}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {sections.map((section, sectionIndex) => {
            // Skip sections with no data
            const hasData = section.fields.some(field => {
              const value = deployment[field.key as keyof DeploymentData];
              return value !== undefined && value !== '';
            });
            
            if (!hasData) return null;
            
            return (
              <div 
                key={`section-${sectionIndex}`}
                className={`mb-6 ${sectionIndex > 0 ? 'pt-6 border-t' : ''}`}
                style={{ borderColor: themeObject.border }}
              >
                <h3 className="text-lg font-medium mb-3">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => {
                    const value = deployment[field.key as keyof DeploymentData];
                    
                    // Skip fields with no value
                    if (value === undefined || value === '') return null;
                    
                    // Format value if needed
                    const displayValue = field.format ? field.format(value as string) : value;
                    
                    // For multiline fields, use the full width
                    const isFullWidth = field.isMultiline;
                    
                    return (
                      <div 
                        key={`field-${fieldIndex}`}
                        className={isFullWidth ? 'col-span-1 md:col-span-2' : ''}
                      >
                        <div className="text-sm font-medium mb-1" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                          {field.label}
                        </div>
                        
                        {field.isMultiline ? (
                          <div 
                            className="p-3 rounded-md border whitespace-pre-wrap"
                            style={{ 
                              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                              borderColor: themeObject.border,
                              minHeight: '60px'
                            }}
                          >
                            {displayValue as string || 'No notes provided'}
                          </div>
                        ) : field.isLink && displayValue ? (
                          <a 
                            href={displayValue as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            {displayValue as string}
                          </a>
                        ) : (
                          <div>{displayValue as string}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: themeObject.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white rounded-md hover:bg-blue-700 transition"
            style={{ backgroundColor: themeObject.button, color: themeObject.buttonText }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetailsModal;