// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggleSwitch } from "@/components/ThemeToggleSwitch";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const router = useRouter();
  const { themeObject } = useTheme();
  const { status } = useSession();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      console.log("User already authenticated, redirecting to dashboard");
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        console.error("Login error:", result.error);
        alert(result.error);
      } else if (result?.ok) {
        console.log("Login successful, redirecting to dashboard");
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotMessage(true);
  };

  // If checking auth status or already authenticated
  if (status === "loading" || status === "authenticated") {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: themeObject.background, color: themeObject.text }}
      >
        <p>{status === "authenticated" ? "Redirecting..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
      {/* Theme Toggle - Static on Login Page */}
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
        
        {/* Password Reset Message */}
        {showForgotMessage && (
          <div
            className="p-4 rounded-md mb-6"
            style={{
              backgroundColor: themeObject.background === '#000000' ? '#1e3a5f' : '#e0f2fe',
              color: themeObject.background === '#000000' ? '#93c5fd' : '#1e40af',
            }}
          >
            <h3 className="font-bold mb-2">Forgot Your Password?</h3>
            <p className="text-sm">
              Please contact an administrator to reset your password. They will help you regain access to your account.
            </p>
            <button
              className="text-sm underline mt-2"
              onClick={() => setShowForgotMessage(false)}
              style={{
                color: themeObject.background === '#000000' ? '#bfdbfe' : '#2563eb',
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        
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

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-500 hover:text-blue-700 text-sm transition"
            >
              Forgot your password?
            </button>
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