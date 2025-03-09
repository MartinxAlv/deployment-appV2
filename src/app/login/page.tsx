// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggleSwitch } from "@/components/ThemeToggleSwitch"; // Ensure this exists in your components

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { themeObject } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      alert(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Theme Toggle in the Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggleSwitch />
      </div>

      <div
        className="p-10 shadow-lg rounded-lg w-full max-w-md border transition-all duration-300"
        style={{
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border,
        }}
      >
        <h2 className="text-2xl font-extrabold text-center mb-6">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block font-medium mb-1" style={{ color: themeObject.text }}>
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring focus:ring-blue-500 transition"
              required
              style={{
                backgroundColor: themeObject.inputBackground,
                color: themeObject.text,
                borderColor: themeObject.border,
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block font-medium mb-1" style={{ color: themeObject.text }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-md focus:ring focus:ring-blue-500 transition"
              required
              style={{
                backgroundColor: themeObject.inputBackground,
                color: themeObject.text,
                borderColor: themeObject.border,
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md font-medium transition"
            style={{
              backgroundColor: loading ? themeObject.buttonDisabled : themeObject.button,
              color: themeObject.buttonText,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
