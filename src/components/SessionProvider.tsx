// src/components/SessionProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Force session refresh on window focus for better persistence
      refetchInterval={0} 
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}