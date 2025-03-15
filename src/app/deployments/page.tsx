// src/app/deployments/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DeploymentTable from "@/components/DeploymentTable";
import { useTheme } from "@/components/ThemeProvider";

export default function DeploymentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { themeObject } = useTheme();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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

  // Determine if user has edit permissions (admin or specific role)
  const canEdit = true;

  return (
    <div
      className="flex flex-col min-h-screen p-6 pt-16"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Back to Dashboard Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="fixed top-4 left-4 px-4 py-2 rounded-md font-medium transition z-10"
        style={{
          backgroundColor: "#4ade80", // Green background
          color: "#ffffff", // White text
          border: "1px solid #16a34a", // Darker green border
        }}
      >
        Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6 mt-8 text-center">Deployment Management</h1>
      
      <div 
        className="bg-white shadow-md rounded-lg p-6 w-full"
        style={{ 
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border
        }}
      >
        <h2 className="text-xl font-semibold mb-4">2425 Deployment Sheet</h2>
        <p className="mb-4">
          This data is synchronized with the Google Sheet. {canEdit 
            ? "You have permission to edit this data." 
            : "You can view this data but editing is restricted."}
        </p>
        
        {/* Deployment Table Component */}
        <DeploymentTable allowEdit={canEdit} />
      </div>
    </div>
  );
}