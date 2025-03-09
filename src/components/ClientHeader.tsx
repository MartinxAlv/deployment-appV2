// components/ClientHeader.tsx
"use client";

import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { usePathname } from "next/navigation";

export const ClientHeader: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      <ThemeToggleSwitch />
      {pathname === "/dashboard" && <LogoutButton />}
    </div>
  );
};
