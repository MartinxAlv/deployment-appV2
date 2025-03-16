// src/app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DashboardStats from "@/components/DashboardStats"; 
import RefreshTimestamp from "@/components/RefreshTimestamp";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { themeObject } = useTheme();

  // Redirect to Login if unauthenticated
  useEffect(() => {
    // Only redirect if we're sure the user is unauthenticated
    if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to login");
      // Add a small delay to ensure proper session state
      setTimeout(() => {
        router.replace("/login");
      }, 100);
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // Additional check to ensure we have a valid session
  if (!session?.user) {
    console.log("No valid session found, redirecting to login");
    router.replace("/login");
    return null;
  }

  return (
    <div
      className="px-4 md:px-8"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col mb-6">
          <h2 className="text-2xl font-bold">Welcome, {session?.user?.name || session?.user?.email}</h2>
          <p className="mt-1 text-gray-500" style={{ color: themeObject.text === '#ffffff' ? '#9CA3AF' : '#6B7280' }}>
            Here&apos;s an overview of deployment activities
          </p>
        </div>
        
        {/* Dashboard Statistics */}
        <div className="mt-6">
          <DashboardStats />
        </div>
        
        {/* Refresh Timestamp Message */}
        <RefreshTimestamp />
      </div>
    </div>
  );
}