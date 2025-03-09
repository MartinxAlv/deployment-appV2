import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'], // ✅ Enables dark mode
  content: ["./src/**/*.{js,ts,jsx,tsx}"], // ✅ Ensures Tailwind scans the right files
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
