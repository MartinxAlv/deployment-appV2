"use client"; // Ensure this is a Client Component

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

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
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Top-Right Container (Only Logout Button - Theme Toggle is in ClientHeader.tsx) */}
      <div className="absolute top-4 right-4">
        {/* Logout Button (Red) */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 rounded-md font-medium transition"
          style={{
            backgroundColor: "#dc2626", // Red background
            color: "#ffffff", // White text
            border: "1px solid #b91c1c", // Darker red border
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">Welcome!, {session?.user?.email}</h1>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
