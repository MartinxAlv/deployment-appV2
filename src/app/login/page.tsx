// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
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

  const handleForgotPassword = () => {
    setShowForgotMessage(true);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: themeObject.background, color: themeObject.text }}
    >
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