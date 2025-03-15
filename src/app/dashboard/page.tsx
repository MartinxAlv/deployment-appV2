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
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div
      className="min-h-screen py-8 px-4 md:px-8"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 mt-10">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {session?.user?.email}</h1>
            <p className="mt-1 text-gray-500" style={{ color: themeObject.text === '#ffffff' ? '#9CA3AF' : '#6B7280' }}>
              Here&apos;s an overview of deployment activities
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/deployments')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View All Deployments
            </button>
            
            <button
              onClick={() => router.push('/technician-deployments')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Technician View
            </button>
            <button
    onClick={() => router.push('/ready-to-deploy')}
    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
  >
    Ready to Deploy
  </button>
            {session?.user?.role === "admin" && (
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Admin Panel
              </button>
            )}
          </div>
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