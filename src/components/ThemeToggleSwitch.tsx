"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";

export const ThemeToggleSwitch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure the component only renders on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent rendering during SSR to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded-md font-medium transition"
      style={{
        backgroundColor: theme === "light" ? "#f3f4f6" : "#1f2937", // Light gray in light mode, dark gray in dark mode
        color: theme === "light" ? "#1f2937" : "#f3f4f6", // Dark text in light mode, light text in dark mode
        border: `1px solid ${theme === "light" ? "#d1d5db" : "#4b5563"}`, // Border adjustment
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
};
