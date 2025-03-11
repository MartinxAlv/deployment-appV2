// components/ThemeProvider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";

type ThemeType = "light" | "dark";

// Define your themes with more UI properties
const lightTheme = {
  background: "#ffffff",
  text: "#000000",
  cardBackground: "#f8fafc",
  inputBackground: "#ffffff",
  border: "#d1d5db",
  button: "#3b82f6",
  buttonDisabled: "#93c5fd",
  buttonText: "#ffffff",
};

const darkTheme = {
  background: "#121212",
  text: "#ffffff",
  cardBackground: "#1e293b",
  inputBackground: "#334155",
  border: "#64748b",
  button: "#3b82f6",
  buttonDisabled: "#1e40af",
  buttonText: "#ffffff",
};

// Create a context for the theme
const ThemeContext = createContext({
  theme: "light" as ThemeType,
  toggleTheme: () => {},
  themeObject: lightTheme, 
});

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with light but will be replaced by stored value
  const [theme, setTheme] = useState<ThemeType>("light");
  const [mounted, setMounted] = useState(false);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as ThemeType | null;
    if (storedTheme) {
      setTheme(storedTheme);
      // Apply data-theme attribute to document
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    console.log("Toggling theme from", theme); // Debug log
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Store in localStorage
    localStorage.setItem("theme", newTheme);
    
    // Apply data-theme attribute to document
    document.documentElement.setAttribute('data-theme', newTheme);
    
    console.log("Theme toggled to", newTheme); // Debug log
  };

  const themeObject = theme === "light" ? lightTheme : darkTheme;

  // Wait until mounted to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeObject }}>
      <StyledThemeProvider theme={themeObject}>
        <div className={theme === "dark" ? "dark" : ""}>{children}</div>
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};