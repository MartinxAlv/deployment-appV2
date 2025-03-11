"use client";

import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const ClientHeader: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession(); // ✅ Hook moved inside component

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
      {/* 🔹 Show Admin Button only for Admins */}
      {session?.user?.role === "admin" && (
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

      {/* 🔹 Theme Toggle Button */}
      <ThemeToggleSwitch />

      {/* 🔹 Show Logout Button only on Dashboard */}
      {pathname === "/dashboard" && <LogoutButton />}
    </div>
  );
};

export default ClientHeader;
