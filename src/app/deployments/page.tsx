// src/app/deployments/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DeploymentTable from "@/components/DeploymentTable";
import { useTheme } from "@/components/ThemeProvider";

export default function DeploymentsPage() {
  const { status } = useSession(); // Removed the unused 'data: session' part
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
      className="flex flex-col px-4 py-4"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      <h2 className="text-2xl font-bold mb-4">2425 Deployment Sheet</h2>
      <p className="mb-6">
        This data is synchronized with the Google Sheet. {canEdit 
          ? "You have permission to edit this data." 
          : "You can view this data but editing is restricted."}
      </p>
      
      {/* Deployment Table Component */}
      <div 
        className="bg-white shadow-md rounded-lg p-4 w-full"
        style={{ 
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border
        }}
      >
        <DeploymentTable allowEdit={canEdit} />
      </div>
    </div>
  );
}