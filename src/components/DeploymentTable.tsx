"use client";

import { useState, useEffect } from "react";
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
  const { themeObject } = useTheme();

  // Fetch deployments on component mount
  useEffect(() => {
    fetchDeployments();
  }, []);

  // Function to fetch deployments
  const fetchDeployments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/deployments");
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setDeployments(data);
      setError(null);
    } catch (err) {
      setError("Failed to load deployment data");
      console.error("Error fetching deployments:", err);
    } finally {
      setLoading(false);
    }
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

  // Extract column names from first deployment
  const getColumnHeaders = () => {
    if (deployments.length === 0) return [];
    
    // Get all unique keys from all deployments to ensure all columns are shown
    const allKeys = new Set<string>();
    deployments.forEach(deployment => {
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

  const columns = getColumnHeaders();

  return (
    <div className="w-full overflow-x-auto">
      {/* Error banner if there's an error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {/* Add new deployment button */}
      {allowEdit && (
        <div className="mb-4">
          <button
            onClick={handleAdd}
            disabled={loading || editingId !== null}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
          >
            Add New Deployment
          </button>
        </div>
      )}

      {/* Deployment table */}
      <table 
        className="min-w-full divide-y divide-gray-200" 
        style={{ 
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ backgroundColor: themeObject.cardBackground, color: themeObject.text }}
              >
                {column}
              </th>
            ))}
            {allowEdit && <th className="px-6 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {deployments.map((deployment) => (
            <tr key={deployment.id}>
              {editingId === deployment.id ? (
                // Edit mode row
                <>
                  {columns.map((column) => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={deployment.id?.startsWith('new-') ? handleSaveNew : handleSave}
                      className="text-green-600 hover:text-green-900 mr-2"
                      disabled={loading}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                // View mode row
                <>
                  {columns.map((column) => (
                    <td 
                      key={column} 
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ color: themeObject.text }}
                    >
                      {deployment[column as keyof DeploymentData] || ""}
                    </td>
                  ))}
                  {allowEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(deployment)}
                        className="text-blue-600 hover:text-blue-900"
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
  );
}