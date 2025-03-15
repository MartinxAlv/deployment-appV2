"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DeploymentData } from "@/lib/googleSheetsService";
import { useTheme } from "@/components/ThemeProvider";
import EditDeploymentModal from "@/components/EditDeploymentModal";

interface DeploymentTableProps {
  allowEdit?: boolean;
}

// Storage key for localStorage
const COLUMN_PREFS_STORAGE_KEY = 'deploymentColumnPreferences';

export default function DeploymentTable({ allowEdit = false }: DeploymentTableProps) {
  const [deployments, setDeployments] = useState<DeploymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDeployment, setEditingDeployment] = useState<DeploymentData | null>(null);
  const { themeObject, theme } = useTheme();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Column visibility state
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnVisibilityMap, setColumnVisibilityMap] = useState<Record<string, boolean>>({});
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  
  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch deployments
  const fetchDeployments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      if (!showLoading) {
        setIsRefreshing(true);
      }
      
      const response = await fetch("/api/deployments");
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Deployments from API:", data);
      setDeployments(data);
      
      // Extract all unique column names from the deployments
      if (data.length > 0) {
        const columns = getColumnHeaders(data);
        setAllColumns(columns);
      }
      
      setError(null);
    } catch (err) {
      if (showLoading) {
        setError("Failed to load deployment data");
      } else {
        setError("Failed to refresh data. Try again later.");
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      }
      console.error("Error fetching deployments:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      if (!showLoading) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // Helper function to set default columns
  const setDefaultColumns = useCallback(() => {
    // Default to show important deployment columns
    const defaultVisibleColumns = [
      "Status", 
      "Assigned To", 
      "Location", 
      "Deployment ID",
      "Deployment Type",
      "New Model", 
      "Technician", 
      "Deployment Date", 
      "Priority"
    ];
    
    // Filter to only include columns that actually exist in the data
    const availableDefaultColumns = defaultVisibleColumns.filter(col => 
      allColumns.includes(col)
    );
    
    setVisibleColumns(availableDefaultColumns);
    
    // Initialize visibility map
    const visibilityMap: Record<string, boolean> = {};
    allColumns.forEach(col => {
      visibilityMap[col] = availableDefaultColumns.includes(col);
    });
    setColumnVisibilityMap(visibilityMap);
    
    console.log('Set default column preferences');
  }, [allColumns]);

  // Load saved column preferences
  useEffect(() => {
    // Only run this once when allColumns are available and preferences haven't been loaded yet
    if (allColumns.length > 0 && !hasLoadedPreferences) {
      try {
        // Attempt to load saved preferences from localStorage
        const savedPrefsJson = localStorage.getItem(COLUMN_PREFS_STORAGE_KEY);
        
        if (savedPrefsJson) {
          // Parse the saved preferences
          const savedPrefs = JSON.parse(savedPrefsJson);
          
          // Only use saved columns that still exist in current data
          const validColumns = savedPrefs.visibleColumns.filter(
            (col: string) => allColumns.includes(col)
          );
          
          if (validColumns.length > 0) {
            // Set visible columns to the saved preferences
            setVisibleColumns(validColumns);
            
            // Recreate the visibility map based on saved preferences
            const newVisibilityMap: Record<string, boolean> = {};
            allColumns.forEach(col => {
              newVisibilityMap[col] = validColumns.includes(col);
            });
            setColumnVisibilityMap(newVisibilityMap);
            console.log('Loaded column preferences from localStorage');
          } else {
            // If no valid columns found, fall back to defaults
            setDefaultColumns();
          }
        } else {
          // If no saved preferences, set defaults
          setDefaultColumns();
        }
        
        // Mark preferences as loaded
        setHasLoadedPreferences(true);
      } catch (error) {
        console.error('Error loading column preferences:', error);
        setDefaultColumns();
        setHasLoadedPreferences(true);
      }
    }
  }, [allColumns, hasLoadedPreferences, setDefaultColumns]);

  // Save preferences when they change
  useEffect(() => {
    // Only save if we've already loaded preferences (prevents overwriting on initial load)
    // and we have visible columns selected
    if (hasLoadedPreferences && visibleColumns.length > 0) {
      try {
        const prefsToSave = {
          visibleColumns: visibleColumns,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(COLUMN_PREFS_STORAGE_KEY, JSON.stringify(prefsToSave));
        console.log('Saved column preferences to localStorage');
      } catch (error) {
        console.error('Error saving column preferences:', error);
      }
    }
  }, [visibleColumns, hasLoadedPreferences]);

  // Extract column names from deployments
  const getColumnHeaders = (data: DeploymentData[]) => {
    if (!data || data.length === 0) return [];
    
    // Get all unique keys from all deployments to ensure all columns are shown
    const allKeys = new Set<string>();
    data.forEach(deployment => {
      Object.keys(deployment).forEach(key => {
        allKeys.add(key);
      });
    });
    
    // Convert to array and ensure certain critical columns appear first
    const priorityColumns = ["Deployment ID", "Status", "Assigned To", "Location"];
    const headers = Array.from(allKeys);
    
    // Remove priority columns from original order
    priorityColumns.forEach(col => {
      const index = headers.indexOf(col);
      if (index !== -1) {
        headers.splice(index, 1);
      }
    });
    
    // Add priority columns at the beginning
    return [...priorityColumns.filter(col => allKeys.has(col)), ...headers];
  };

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((column: string) => {
    // Update visibility map
    setColumnVisibilityMap(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
    
    // Update visible columns based on the fixed order from allColumns
    setVisibleColumns(allColumns.filter(col => {
      if (col === column) {
        return !columnVisibilityMap[column]; // Toggle the clicked column
      }
      return columnVisibilityMap[col]; // Keep others the same
    }));
  }, [allColumns, columnVisibilityMap]);

  // Reset column visibility to default
  const resetColumnVisibility = useCallback(() => {
    setDefaultColumns();
  }, [setDefaultColumns]);

  // Get display columns in the correct order
  const getOrderedVisibleColumns = () => {
    return allColumns.filter(col => columnVisibilityMap[col]);
  };

  // Start editing a deployment
  const handleEdit = (deployment: DeploymentData) => {
    console.log("Editing deployment:", deployment);
    
    // Create a deep copy to avoid reference issues
    const editData = { ...deployment };
    
    // If the ID is missing, but we have Deployment ID, use that instead
    if (!editData.id && editData["Deployment ID"]) {
      editData.id = editData["Deployment ID"];
    }
    
    // Make sure Deployment ID is preserved in both places
    if (editData.id && !editData["Deployment ID"]) {
      editData["Deployment ID"] = editData.id;
    }
    
    setEditingDeployment(editData);
  };

  // Close the edit modal
  const handleCloseModal = () => {
    setEditingDeployment(null);
  };

  // Save edited deployment
  const handleSaveDeployment = async (deploymentToSave: DeploymentData) => {
    try {
      setLoading(true);
      
      // Add this debugging line to see exactly what's being sent
      console.log("Deployment data being saved:", JSON.stringify(deploymentToSave));
      
      // Make a complete copy to avoid reference issues
      const deploymentWithId = { ...deploymentToSave };
      
      // Ensure the ID is properly set
      if (!deploymentWithId.id && deploymentWithId["Deployment ID"]) {
        deploymentWithId.id = deploymentWithId["Deployment ID"];
      } else if (!deploymentWithId["Deployment ID"] && deploymentWithId.id) {
        deploymentWithId["Deployment ID"] = deploymentWithId.id;
      } else if (!deploymentWithId.id && !deploymentWithId["Deployment ID"]) {
        throw new Error("Missing ID: Deployment must have either 'id' or 'Deployment ID'");
      }
      
      // Double-check the ID is present
      console.log("ID being used:", deploymentWithId.id);
      
      const response = await fetch("/api/deployments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deploymentWithId),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      // Reset editing state
      setEditingDeployment(null);
      setError(null);
      
      // Refresh data to ensure we have the latest changes
      fetchDeployments(false);
    } catch (err) {
      setError("Failed to save changes: " + (err instanceof Error ? err.message : String(err)));
      console.error("Error updating deployment:", err);
      throw err; // Re-throw to be caught by the modal
    } finally {
      setLoading(false);
    }
  };

  // If loading, show loading indicator
  if (loading && deployments.length === 0) {
    return <div className="text-center py-8">Loading deployment data...</div>;
  }

  // If error, show error message
  if (error && deployments.length === 0) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}. Please try again later.
      </div>
    );
  }

  // Calculate sticky left column width for actions
  const actionColumnWidth = "100px";

  // Get ordered visible columns
  const orderedVisibleColumns = getOrderedVisibleColumns();
  
  const getColumnWidth = (column: string) => {
    // Set appropriate widths based on column content
    switch (column) {
      case 'id':
      case 'Deployment ID':
      case 'Unique ID':
        return '200px'; // Make this wider to ensure it's fully visible
      case 'Deployment Notes':
      case 'Technician Notes':
        return '300px';
      case 'SR Link':
      case 'Deployment SR Link':
      case 'SR#':
      case 'Deployment SR#':
        return '200px';
      case 'Signature Column':
      case 'Deployment Picture':
        return '150px';
      default:
        return '150px';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Error banner if there's an error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchDeployments(false)}
            disabled={loading || isRefreshing || editingDeployment !== null}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition flex items-center justify-center gap-2"
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </>
            )}
          </button>
        </div>
        
        {/* Column filter button */}
        <button
          onClick={() => setShowColumnFilter(!showColumnFilter)}
          className="px-4 py-2 rounded-md transition"
          style={{
            backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB',
            color: themeObject.text
          }}
        >
          {showColumnFilter ? "Hide Column Filter" : "Filter Columns"}
        </button>
      </div>

      {/* Column filter panel */}
      {showColumnFilter && (
        <div 
          className="mb-4 p-4 border rounded-md"
          style={{ 
            backgroundColor: themeObject.cardBackground,
            borderColor: themeObject.border,
            color: themeObject.text
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Select Columns to Display:</h3>
            <button
              onClick={resetColumnVisibility}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Reset to Default
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allColumns.map(column => (
              <div key={column} className="inline-flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer px-3 py-1 rounded-md"
                  style={{
                    backgroundColor: columnVisibilityMap[column] 
                      ? (theme === 'dark' ? '#1E40AF' : '#DBEAFE') 
                      : (theme === 'dark' ? '#374151' : '#F3F4F6'),
                    color: themeObject.text
                  }}
                >
                  <input
                    type="checkbox"
                    checked={columnVisibilityMap[column]}
                    onChange={() => toggleColumnVisibility(column)}
                    className="form-checkbox h-4 w-4"
                  />
                  <span>{column}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table container with horizontal scrolling */}
      <div 
        ref={tableContainerRef}
        className="w-full overflow-auto border rounded-lg shadow-sm"
        style={{ 
          maxHeight: "70vh",
          backgroundColor: themeObject.cardBackground,
          borderColor: themeObject.border
        }}
      >
        {/* Deployment table */}
        <table 
          className="min-w-full border-collapse table-fixed" 
          style={{ color: themeObject.text }}
        >
          <thead className="sticky top-0 z-10" style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc' }}>
            <tr>
              {orderedVisibleColumns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-r"
                  style={{ 
                    borderColor: themeObject.border,
                    minWidth: getColumnWidth(column)
                  }}
                >
                  {column}
                </th>
              ))}
              {allowEdit && (
                <th 
                  className="px-6 py-3 text-center border-b sticky right-0"
                  style={{ 
                    borderColor: themeObject.border,
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#f8fafc',
                    width: actionColumnWidth,
                    minWidth: actionColumnWidth
                  }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {deployments.map((deployment, index) => {
            // Create a unique identifier for the row that works across all cases
            const rowId = deployment.id || deployment["Deployment ID"] || `deployment-${index}`;
            
            return (
              <tr 
                key={rowId}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{ backgroundColor: theme === 'dark' ? '#1e293b' : 'white' }}
              >
                {orderedVisibleColumns.map((column) => (
                  <td 
                    key={column} 
                    className="px-6 py-4 border-b border-r"
                    style={{ 
                      borderColor: themeObject.border,
                      whiteSpace: column.includes('Notes') ? 'normal' : 'nowrap'
                    }}
                  >
                    {deployment[column as keyof DeploymentData] || ""}
                  </td>
                ))}
                {allowEdit && (
                  <td 
                    className="px-6 py-4 text-center border-b sticky right-0"
                    style={{ 
                      borderColor: themeObject.border,
                      backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                      width: actionColumnWidth
                    }}
                  >
                    <button
                      onClick={() => handleEdit(deployment)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      disabled={loading || editingDeployment !== null}
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          </tbody>
        </table>

        {/* Show message if no deployments */}
        {deployments.length === 0 && (
          <div className="text-center py-8">No deployment data available.</div>
        )}
      </div>
      
      {/* Last update notification */}
      <div className="mt-4 text-sm text-gray-500" style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
        <p>Click the refresh button to get the latest data. Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Edit Deployment Modal */}
      {editingDeployment && (
        <EditDeploymentModal
          deployment={editingDeployment}
          onClose={handleCloseModal}
          onSave={handleSaveDeployment}
        />
      )}
    </div>
  );
}