// src/components/ClientHeader.tsx
"use client";

import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const ClientHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Only show elements when user is authenticated and on specific pages
  const isAuthenticated = status === "authenticated";
  const isDashboard = pathname === "/dashboard";
  const isDeploymentsPage = pathname === "/deployments";
  // Removed the unused 'isLoginPage' variable that was causing the build error

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      {/* Admin Button - Only show on dashboard for admin users */}
      {isAuthenticated && isDashboard && session?.user?.role === "admin" && (
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#3b82f6", // Blue background
            color: "#ffffff", // White text
            border: "1px solid #2563eb", // Darker blue border
          }}
        >
          Admin Panel
        </button>
      )}
      
      {/* Deployments Button - Show for authenticated users except on deployments page */}
      {isAuthenticated && !isDeploymentsPage && (
        <button
          onClick={() => router.push("/deployments")}
          className="px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#10b981", // Green background
            color: "#ffffff", // White text
            border: "1px solid #059669", // Darker green border
          }}
        >
          Deployments
        </button>
      )}
      
      {/* Dashboard Button - Only show on pages other than dashboard */}
      {isAuthenticated && !isDashboard && !isDeploymentsPage && (
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#f59e0b", // Amber background
            color: "#ffffff", // White text
            border: "1px solid #d97706", // Darker amber border
          }}
        >
          Dashboard
        </button>
      )}

      {/* Theme Toggle Button - Always visible */}
      <ThemeToggleSwitch />

      {/* Logout Button - Only visible when authenticated */}
      {isAuthenticated && <LogoutButton />}
    </div>
  );
};

export default ClientHeader;