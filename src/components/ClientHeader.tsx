// src/components/ClientHeader.tsx
"use client";

import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { useSession } from "next-auth/react";

const ClientHeader: React.FC = () => {
  const { status } = useSession();

  // Only show elements when user is authenticated and on specific pages
  const isAuthenticated = status === "authenticated";

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      {/* 
        We're removing these buttons from the header on the dashboard
        since they're redundant with buttons already on the dashboard page
      */}

      {/* Theme Toggle Button - Always visible */}
      <ThemeToggleSwitch />

      {/* Logout Button - Only visible when authenticated */}
      {isAuthenticated && <LogoutButton />}
    </div>
  );
};

export default ClientHeader;