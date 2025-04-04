// src/app/ready-to-deploy/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { DeploymentData } from "@/lib/googleSheetsService";
import DeploymentFilters from "@/components/technician/DeploymentFilters";
import ReadyToDeployTable from "@/components/ready-to-deploy/ReadyToDeployTable";
import ReadyToDeployEditModal from "@/components/ready-to-deploy/ReadyToDeployEditModal";
import LoadingState from "@/components/technician/LoadingState";
import ErrorState from "@/components/technician/ErrorState";
import EmptyState from "@/components/technician/EmptyState";

export default function ReadyToDeployPage() {
  // State for deployment edit modal
  const [editingDeployment, setEditingDeployment] = useState<DeploymentData | null>(null);
  const { status } = useSession();
  const router = useRouter();
  const { themeObject } = useTheme();
  const [deployments, setDeployments] = useState<DeploymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch all deployments
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/deployments");
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter data to only include "Ready to Deploy" status
        const readyToDeployData = data.filter(
          (deployment: DeploymentData) => deployment.Status === "Ready to Deploy"
        );
        
        setDeployments(readyToDeployData);
        
        // Extract unique technicians from the data
        const techList = extractTechnicians(readyToDeployData);
        setTechnicians(techList);
        
        // If there's only one technician, select it automatically
        if (techList.length === 1) {
          setSelectedTechnician(techList[0]);
        }
        
        setError(null);
      } catch (err) {
        setError("Failed to load Ready to Deploy data");
        console.error("Error fetching deployments:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDeployments();
    }
  }, [status]);

  // Extract unique technicians from deployment data
  const extractTechnicians = (data: DeploymentData[]): string[] => {
    const techSet = new Set<string>();
    
    data.forEach(deployment => {
      // Try Technician field first, then fall back to Assigned To
      const tech = deployment.Technician || deployment["Assigned To"];
      if (tech && tech.trim() !== "") {
        techSet.add(tech);
      }
    });
    
    return Array.from(techSet).sort();
  };
  
  // Handle edit deployment
  const handleEditDeployment = (deployment: DeploymentData) => {
    setEditingDeployment(deployment);
  };
  
  // Close edit modal
  const closeEditModal = () => {
    setEditingDeployment(null);
  };

  // Save edited deployment
  const handleSaveDeployment = async (deploymentToSave: DeploymentData, changedFields: string[]) => {
    try {
      setIsRefreshing(true);
      
      console.log("Saving deployment data:", deploymentToSave);
      console.log("Changed fields:", changedFields);
      
      const response = await fetch("/api/deployments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        // Send both the deployment data and the list of changed fields
        body: JSON.stringify({
          deploymentData: deploymentToSave,
          changedFields: changedFields
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      // Reset editing state
      setEditingDeployment(null);
      setError(null);
      
      // Refresh data to ensure we have the latest changes
      await refreshData();
    } catch (err) {
      setError("Failed to save changes: " + (err instanceof Error ? err.message : String(err)));
      console.error("Error updating deployment:", err);
      throw err; // Re-throw to be caught by the modal
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh the deployments data
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/deployments");
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter to Ready to Deploy status
      const readyToDeployData = data.filter(
        (deployment: DeploymentData) => deployment.Status === "Ready to Deploy"
      );
      
      setDeployments(readyToDeployData);
      
      // Update the technicians list in case it changed
      const techList = extractTechnicians(readyToDeployData);
      setTechnicians(techList);
      
      setError(null);
    } catch (err) {
      setError("Failed to refresh deployment data");
      console.error("Error refreshing deployments:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter deployments by technician and search query
  const filteredDeployments = useMemo(() => {
    // First filter by technician
    let result = selectedTechnician
      ? deployments.filter(
          d => (d.Technician === selectedTechnician) || (d["Assigned To"] === selectedTechnician)
        )
      : [];
    
    // Then apply search filter if needed
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => {
        // Search through all string fields
        return Object.entries(d).some(([, value]) => {
          return typeof value === 'string' && value.toLowerCase().includes(query);
        });
      });
    }
    
    return result;
  }, [deployments, selectedTechnician, searchQuery]);

  // Check if user is loading
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is not authenticated
  if (status === "unauthenticated") {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div
      className="flex flex-col px-4 py-4"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Page actions */}
      <div className="flex justify-end mb-4">
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition flex items-center"
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
      </div>
      
      {/* Filters Section */}
      <DeploymentFilters
        technicians={technicians}
        selectedTechnician={selectedTechnician}
        onTechnicianChange={setSelectedTechnician}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        themeObject={themeObject}
      />
      
      {/* Loading State */}
      {loading && <LoadingState />}
      
      {/* Error State */}
      {error && <ErrorState error={error} />}
      
      {/* No Technician Selected Message */}
      {!loading && !error && !selectedTechnician && (
        <EmptyState 
          message="Please select a technician to view their Ready to Deploy items"
          themeObject={themeObject}
        />
      )}
      
      {/* No Deployments Message */}
      {!loading && !error && selectedTechnician && filteredDeployments.length === 0 && (
        <EmptyState 
          message={`No Ready to Deploy items found for ${selectedTechnician}`}
          subMessage={searchQuery ? "Try modifying your search query" : undefined}
          themeObject={themeObject}
        />
      )}
      
      {/* Deployments List with Edit Functionality */}
      {!loading && !error && selectedTechnician && filteredDeployments.length > 0 && (
        <ReadyToDeployTable
          deployments={filteredDeployments}
          selectedTechnician={selectedTechnician}
          onEditDeployment={handleEditDeployment}
          themeObject={themeObject}
        />
      )}

      {/* Edit Deployment Modal */}
      {editingDeployment && (
        <ReadyToDeployEditModal 
          deployment={editingDeployment}
          onClose={closeEditModal}
          onSave={handleSaveDeployment}
        />
      )}
    </div>
  );
}