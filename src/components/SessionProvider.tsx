// src/components/SessionProvider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      // Improve session management
      refetchInterval={5 * 60} // Refresh session every 5 minutes 
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}