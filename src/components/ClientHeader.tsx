// src/components/ClientHeader.tsx
"use client";

import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const ClientHeader: React.FC = () => {
  const { status } = useSession();
  const pathname = usePathname();

  // Only show elements when user is authenticated
  const isAuthenticated = status === "authenticated";
  
  // Check if we're on the technician deployments page
  // We use this to validate we're on the right page in development
  const isTechnicianPage = pathname === "/technician-deployments";
  
  // For debugging
  if (process.env.NODE_ENV === 'development' && isTechnicianPage) {
    console.log('Rendering ClientHeader on technician deployments page');
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 flex items-center space-x-4 z-20">
      {/* Always use z-20 to stay on top of the header */}
      {/* Placed in a fixed position rather than absolute for better positioning */}

      {/* Theme Toggle Button */}
      <ThemeToggleSwitch />

      {/* Logout Button */}
      <LogoutButton />
    </div>
  );
};

export default ClientHeader;