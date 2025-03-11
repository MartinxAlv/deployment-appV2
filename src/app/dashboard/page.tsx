"use client"; // Ensure this is a Client Component

import { useSession } from "next-auth/react";
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
      {/* 🔹 Main Content */}
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">Welcome!, {session?.user?.email}</h1>
        <p>Status: {status}</p>
      </div>
    </div>
  );
}
