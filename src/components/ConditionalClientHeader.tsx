// src/components/ConditionalClientHeader.tsx
"use client";

import { usePathname } from "next/navigation";
import ClientHeader from "./ClientHeader";

export default function ConditionalClientHeader() {
  const pathname = usePathname();
  
  // Don't render the ClientHeader on the login page or technician deployments page
  if (pathname === "/login" || pathname === "/technician-deployments" || pathname === "/ready-to-deploy") {
    return null;
  }
  
  // Render the ClientHeader on all other pages
  return <ClientHeader />;
}