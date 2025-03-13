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
      router.push("/dashboard");
    } 
    // If not authenticated, redirect to login
    else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // This will not be shown as the useEffect will redirect
  return null;
}