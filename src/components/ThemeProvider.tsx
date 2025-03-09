// components/ThemeProvider.tsx
"use client";

import React, { createContext, useContext, useState } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";

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
  theme: "light",
  toggleTheme: () => {},
  themeObject: lightTheme, 
});

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    console.log("Toggling theme"); // Debug log
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const themeObject = theme === "light" ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeObject }}>
      <StyledThemeProvider theme={themeObject}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
