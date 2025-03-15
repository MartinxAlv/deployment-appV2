// src/components/technician/TechnicianEditModal.tsx
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { DeploymentData } from "@/lib/googleSheetsService";

interface TechnicianEditModalProps {
  deployment: DeploymentData;
  onClose: () => void;
  onSave: (deployment: DeploymentData, changedFields: string[]) => Promise<void>;
}

export default function TechnicianEditModal({ 
  deployment, 
  onClose, 
  onSave
}: TechnicianEditModalProps) {
  const [formData, setFormData] = useState<DeploymentData>({ ...deployment });
  const [originalData, setOriginalData] = useState<DeploymentData>({ ...deployment });
  const [changedFields, setChangedFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { themeObject } = useTheme();

  // Reset original data when deployment prop changes
  useEffect(() => {
    setOriginalData({ ...deployment });
    setFormData({ ...deployment });
    setChangedFields([]);
  }, [deployment]);

  // Define editable fields for technicians
  const editableFields = [
    "Status",
    "Assigned To",
    "Location",
    "Current Model",
    "Current SN",
    "New Model",
    "New SN",
    "New Monitor Type",
    "New Monitor 1 SN",
    "New Monitor 2 SN",
    "New Other",
    "Technician Notes"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track changed fields by comparing with original values
    const originalValue = originalData[name];
    
    // If value is different from original, add to changed fields
    // If it's now the same as original, remove from changed fields
    if (value !== originalValue) {
      if (!changedFields.includes(name)) {
        setChangedFields(prev => [...prev, name]);
      }
    } else {
      setChangedFields(prev => prev.filter(field => field !== name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Don't submit if nothing has changed
    if (changedFields.length === 0) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a minimal object with only the ID and changed fields
      const deploymentToSave: DeploymentData = {
        // Always include the ID for identifying the record
        id: formData.id || formData["Deployment ID"],
        "Deployment ID": formData["Deployment ID"] || formData.id
      };
      
      // Add only the changed fields
      changedFields.forEach(field => {
        deploymentToSave[field] = formData[field];
      });
      
      // Pass both the minimal deployment object and list of changed fields
      await onSave(deploymentToSave, changedFields);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine what type of input to use
  const getInputType = (fieldName: string) => {
    if (fieldName === "Status") {
      return "select";
    }
    if (fieldName.includes("Notes")) {
      return "textarea";
    }
    return "text";
  };

  // Status options for the dropdown
  const statusOptions = [
    "Pending",
    "Assigned",
    "In Progress",
    "Ready to Deploy",
    "Deployed",
    "Completed",
    "Cancelled",
    "On Hold"
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div
        className="rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Edit Deployment {changedFields.length > 0 && 
              <span className="text-sm font-normal text-blue-500 ml-2">
                ({changedFields.length} field{changedFields.length !== 1 ? 's' : ''} changed)
              </span>
            }
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            style={{ color: themeObject.text }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div
            className="p-4 rounded-md mb-4"
            style={{
              backgroundColor: themeObject.cardBackground === "#1f3a24" ? "#3b1818" : "#fee2e2",
              color: themeObject.text === "#4ade80" ? "#f87171" : "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Show Deployment ID as read-only for reference */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-medium mb-1" style={{ color: themeObject.text }}>
                Deployment ID
              </label>
              <input
                type="text"
                name="Deployment ID"
                value={formData["Deployment ID"] || formData.id || ""}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: themeObject.inputBackground,
                  color: themeObject.text,
                  borderColor: themeObject.border,
                }}
                disabled
              />
            </div>
            
            {/* Map through all editable fields */}
            {editableFields.map((field) => {
              const inputType = getInputType(field);
              const isChanged = changedFields.includes(field);
              
              // Always include notes field, otherwise skip empty fields
              if (!formData[field] && !originalData[field] && !field.includes('Notes')) return null;

              return (
                <div key={field} className={inputType === "textarea" ? "col-span-1 md:col-span-2" : ""}>
                  <label 
                    className={`block font-medium mb-1 ${isChanged ? "text-blue-500" : ""}`}
                    style={{ color: isChanged ? undefined : themeObject.text }}
                  >
                    {field} {isChanged && "✱"}
                  </label>
                  
                  {inputType === "select" ? (
                    <select
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md ${isChanged ? "border-blue-500" : ""}`}
                      style={{
                        backgroundColor: themeObject.inputBackground,
                        color: themeObject.text,
                        borderColor: isChanged ? undefined : themeObject.border,
                      }}
                    >
                      <option value="">Select Status</option>
                      {statusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : inputType === "textarea" ? (
                    <textarea
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md ${isChanged ? "border-blue-500" : ""}`}
                      style={{
                        backgroundColor: themeObject.inputBackground,
                        color: themeObject.text,
                        borderColor: isChanged ? undefined : themeObject.border,
                      }}
                      placeholder={field === "Technician Notes" ? "Add your deployment notes here..." : ""}
                    />
                  ) : (
                    <input
                      type={inputType}
                      name={field}
                      value={formData[field] || ""}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md ${isChanged ? "border-blue-500" : ""}`}
                      style={{
                        backgroundColor: themeObject.inputBackground,
                        color: themeObject.text,
                        borderColor: isChanged ? undefined : themeObject.border,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
              style={{
                backgroundColor: themeObject.background === "#000000" ? "#374151" : "#f3f4f6",
                color: themeObject.text,
                borderColor: themeObject.border,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || changedFields.length === 0}
              className={`text-white px-4 py-2 rounded-md transition ${
                changedFields.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? "Saving..." : 
               changedFields.length === 0 ? "No Changes" : 
               `Save ${changedFields.length} Change${changedFields.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}