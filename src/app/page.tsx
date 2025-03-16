// src/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If loading, do nothing yet
    if (status === "loading") return;
    
    // If authenticated, redirect to dashboard
    if (status === "authenticated") {
      console.log("User authenticated, redirecting to dashboard");
      router.replace("/dashboard");
    } 
    // If not authenticated, redirect to login
    else if (status === "unauthenticated") {
      console.log("User not authenticated, redirecting to login");
      router.replace("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // This will not be shown as the useEffect will redirect
  return null;
}