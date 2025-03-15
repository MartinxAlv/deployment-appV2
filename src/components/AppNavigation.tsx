// src/components/AppNavigation.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggleSwitch } from "./ThemeToggleSwitch";
import { LogoutButton } from "./LogoutButton";
import { useTheme } from "./ThemeProvider";

interface NavItem {
  name: string;
  path: string;
  gradient: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export default function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  
  // Don't render navigation on login page
  if (pathname === "/login" || status === "unauthenticated") {
    return null;
  }
  
  // Define navigation items with their unique gradients and icons
  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      gradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )
    },
    {
      name: "Deployments",
      path: "/deployments",
      gradient: "bg-gradient-to-r from-purple-500 to-pink-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: "Technician",
      path: "/technician-deployments",
      gradient: "bg-gradient-to-r from-green-500 to-blue-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: "Ready to Deploy",
      path: "/ready-to-deploy",
      gradient: "bg-gradient-to-r from-blue-500 to-green-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      name: "Admin",
      path: "/admin",
      gradient: "bg-gradient-to-r from-red-500 to-yellow-500",
      adminOnly: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      )
    }
  ];
  
  // Get the current page's gradient
  const getCurrentPageGradient = () => {
    const currentItem = navigationItems.find(item => pathname === item.path);
    return currentItem?.gradient || "bg-gradient-to-r from-gray-700 to-gray-900";
  };
  
  // Get the current page's icon
  const getCurrentPageIcon = () => {
    const currentItem = navigationItems.find(item => pathname === item.path);
    return currentItem?.icon || null;
  };
  
  // Filter out admin-only items if user is not admin
  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || session?.user?.role === "admin"
  );
  
  return (
    <>
      {/* Top navigation bar with current page's gradient */}
      <div className={`fixed top-0 left-0 right-0 ${getCurrentPageGradient()} text-white py-3 px-4 z-10`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-2">
              {getCurrentPageIcon()}
            </span>
            <h1 className="text-xl font-bold">
              {navigationItems.find(item => pathname === item.path)?.name || "Deployment App"}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggleSwitch />
            <LogoutButton />
          </div>
        </div>
      </div>
      
      {/* Bottom navigation menu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <div className="flex justify-around">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path;
            const activeGradientClass = isActive ? item.gradient : '';
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center py-2 px-3 rounded-t-lg transition-all duration-300 ${
                  isActive ? 
                    `${activeGradientClass} text-white -mt-2 mb-0.5 shadow-lg` : 
                    'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'
                }`}
              >
                {item.icon}
                <span className={`text-xs mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Add padding to the top to account for the fixed navigation */}
      <div className="pt-16 pb-16"></div>
    </>
  );
}