"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DeploymentData } from "@/lib/googleSheetsService";
import { useTheme } from "@/components/ThemeProvider";

interface DeploymentTableProps {
  allowEdit?: boolean;
}

export default function DeploymentTable({ allowEdit = false }: DeploymentTableProps) {
  const [deployments, setDeployments] = useState<DeploymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DeploymentData>({});
  const { themeObject, theme } = useTheme();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Column visibility state
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnVisibilityMap, setColumnVisibilityMap] = useState<Record<string, boolean>>({});
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  
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
      setDeployments(data);
      
      // Extract all unique column names from the deployments
      if (data.length > 0) {
        const columns = getColumnHeaders(data);
        setAllColumns(columns);
        
        // Initialize visible columns if not set yet
        if (visibleColumns.length === 0) {
          // Default to show all columns except 'id' and potentially long fields like 'notes'
          const defaultVisibleColumns = columns.filter(col => 
            col !== 'id' && col !== 'notes' && col !== 'createdBy' && col !== 'createdAt'
          );
          setVisibleColumns(defaultVisibleColumns);
          
          // Initialize visibility map
          const visibilityMap: Record<string, boolean> = {};
          columns.forEach(col => {
            visibilityMap[col] = defaultVisibleColumns.includes(col);
          });
          setColumnVisibilityMap(visibilityMap);
        }
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
  }, [visibleColumns.length]);

  // Initial data load
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

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
    
    // Convert to array and ensure 'id' is first if it exists
    const headers = Array.from(allKeys);
    if (headers.includes('id')) {
      headers.splice(headers.indexOf('id'), 1);
      headers.unshift('id');
    }
    
    return headers;
  };

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
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
  };

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    const defaultVisibleColumns = allColumns.filter(col => 
      col !== 'id' && col !== 'notes' && col !== 'createdBy' && col !== 'createdAt'
    );
    
    // Update visibility map
    const newVisibilityMap: Record<string, boolean> = {};
    allColumns.forEach(col => {
      newVisibilityMap[col] = defaultVisibleColumns.includes(col);
    });
    setColumnVisibilityMap(newVisibilityMap);
    
    // Update visible columns
    setVisibleColumns(defaultVisibleColumns);
  };

  // Get display columns in the correct order
  const getOrderedVisibleColumns = () => {
    return allColumns.filter(col => columnVisibilityMap[col]);
  };

  // Start editing a deployment
  const handleEdit = (deployment: DeploymentData) => {
    setEditingId(deployment.id || null);
    setEditFormData({ ...deployment });
  };

  // Handle input changes in edit form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Save edited deployment
  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/deployments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Update local state with the edited deployment
      setDeployments(
        deployments.map((d) => (d.id === editFormData.id ? editFormData : d))
      );
      
      setEditingId(null);
      setError(null);
      
      // Refresh data to ensure we have the latest changes
      fetchDeployments(false);
    } catch (err) {
      setError("Failed to save changes");
      console.error("Error updating deployment:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };

  // Create a new deployment
  const handleAdd = async () => {
    // Create a new empty form with a temporary ID
    const newDeployment: DeploymentData = {
      id: `new-${Date.now()}`, // Temporary ID for UI purposes
      deploymentDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
      // Add other default values as needed
    };
    
    setEditingId(newDeployment.id || null);
    setEditFormData(newDeployment);
    
    // Scroll to the top of the table to see the editing form
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  };

  // Save a new deployment
  const handleSaveNew = async () => {
    try {
      setLoading(true);
      
      // For new deployments, use POST method
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Refresh the deployment list
      await fetchDeployments();
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError("Failed to add new deployment");
      console.error("Error adding deployment:", err);
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
          {/* Add new deployment button */}
          {allowEdit && (
            <button
              onClick={handleAdd}
              disabled={loading || editingId !== null}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
            >
              Add New Deployment
            </button>
          )}
          
          {/* Refresh button */}
          <button
            onClick={() => fetchDeployments(false)}
            disabled={loading || isRefreshing || editingId !== null}
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
                    minWidth: column === 'id' ? '80px' : column === 'notes' ? '300px' : '150px'
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
          {deployments.map((deployment, index) => (
  <tr 
    key={deployment.id || `deployment-${index}`}
    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    style={{ backgroundColor: theme === 'dark' ? '#1e293b' : 'white' }}
  >
                {editingId === deployment.id ? (
                  // Edit mode row
                  <>
                    {orderedVisibleColumns.map((column) => (
                      <td 
                        key={column} 
                        className="px-6 py-4 whitespace-nowrap border-b border-r"
                        style={{ borderColor: themeObject.border }}
                      >
                        <input
                          type="text"
                          name={column}
                          value={editFormData[column as keyof DeploymentData] || ""}
                          onChange={handleInputChange}
                          className="border rounded px-2 py-1 w-full"
                          style={{ 
                            backgroundColor: themeObject.inputBackground,
                            color: themeObject.text,
                            borderColor: themeObject.border
                          }}
                        />
                      </td>
                    ))}
                    <td 
                      className="px-6 py-4 text-center border-b sticky right-0"
                      style={{ 
                        borderColor: themeObject.border,
                        backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                        width: actionColumnWidth
                      }}
                    >
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={deployment.id?.startsWith('new-') ? handleSaveNew : handleSave}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode row
                  <>
                    {orderedVisibleColumns.map((column) => (
                      <td 
                        key={column} 
                        className="px-6 py-4 border-b border-r"
                        style={{ 
                          borderColor: themeObject.border,
                          whiteSpace: column === 'notes' ? 'normal' : 'nowrap'
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
                          disabled={loading || editingId !== null}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
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
    </div>
  );
}