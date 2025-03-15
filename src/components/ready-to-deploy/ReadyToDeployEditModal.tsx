// src/components/ready-to-deploy/ReadyToDeployEditModal.tsx
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { DeploymentData } from "@/lib/googleSheetsService";

interface ReadyToDeployEditModalProps {
  deployment: DeploymentData;
  onClose: () => void;
  onSave: (deployment: DeploymentData, changedFields: string[]) => Promise<void>;
}

export default function ReadyToDeployEditModal({ 
  deployment, 
  onClose, 
  onSave
}: ReadyToDeployEditModalProps) {
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

  // Define editable fields specifically for Ready to Deploy items
  const editableFields = [
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
    "Technician Notes",
    "Deployment Picture",
    "Signatory Name",
    "Signature Column",
    "Refuse to sign"
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

  // Handle checkbox for "Refuse to sign"
  const handleRefuseToSignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const value = checked ? "Yes" : "No";
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Track changed fields
    const originalValue = originalData[name];
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
      
      // Add Status to changed fields to mark as "Deployed" if not already marked
      if (formData.Status === "Ready to Deploy") {
        formData.Status = "Deployed";
        if (!changedFields.includes("Status")) {
          changedFields.push("Status");
        }
      }
      
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
    if (fieldName.includes("Notes")) {
      return "textarea";
    }
    if (fieldName === "Refuse to sign") {
      return "checkbox";
    }
    if (fieldName === "Signature Column" || fieldName === "Deployment Picture") {
      return "file-placeholder"; // We can't actually upload files, so we'll use a placeholder
    }
    return "text";
  };

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
            Complete Deployment {changedFields.length > 0 && 
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
            
            {/* Show confirmation message */}
            <div className="col-span-1 md:col-span-2 p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md mb-2">
              <p className="font-medium">Ready to Deploy Item</p>
              <p className="text-sm">Complete the deployment process by filling in the required information and confirming with the user&apos;s signature. Once completed, this item will be marked as &quot;Deployed&quot;.</p>
            </div>
            
            {/* Map through all editable fields */}
            {editableFields.map((field) => {
              const inputType = getInputType(field);
              const isChanged = changedFields.includes(field);
              
              return (
                <div key={field} className={inputType === "textarea" ? "col-span-1 md:col-span-2" : ""}>
                  <label 
                    className={`block font-medium mb-1 ${isChanged ? "text-blue-500" : ""}`}
                    style={{ color: isChanged ? undefined : themeObject.text }}
                  >
                    {field} {isChanged && "✱"}
                  </label>
                  
                  {inputType === "textarea" ? (
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
                  ) : inputType === "checkbox" ? (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name={field}
                        checked={formData[field] === "Yes"}
                        onChange={handleRefuseToSignChange}
                        className={`h-5 w-5 rounded ${isChanged ? "border-blue-500" : ""}`}
                      />
                      <span className="ml-2 text-sm" style={{ color: themeObject.text }}>
                        Check if user refuses to sign
                      </span>
                    </div>
                  ) : inputType === "file-placeholder" ? (
                    <div 
                      className={`w-full px-3 py-6 border-2 border-dashed rounded-md text-center ${
                        isChanged ? "border-blue-500" : ""
                      }`}
                      style={{
                        backgroundColor: themeObject.inputBackground,
                        color: themeObject.text === "#ffffff" ? "#9CA3AF" : "#6B7280",
                        borderColor: isChanged ? undefined : themeObject.border,
                      }}
                    >
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-1">{field === "Signature Column" ? "Signature Placeholder" : "Upload Placeholder"}</p>
                      <p className="mt-1 text-xs">
                        (In the real app, this would be an actual signature pad or file upload)
                      </p>
                    </div>
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
                changedFields.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isLoading ? "Saving..." : 
               changedFields.length === 0 ? "No Changes" : 
               "Mark as Deployed"}
            </button>
          </div>
        </form>
      </div>
    </div>
    );
}
