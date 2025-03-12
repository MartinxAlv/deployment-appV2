// src/components/AdminPasswordReset.tsx
"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { User } from "@/app/types/users";

interface AdminPasswordResetProps {
  user: User;
  onClose: () => void;
}

export default function AdminPasswordReset({ user, onClose }: AdminPasswordResetProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { themeObject } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.user_id,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div
        className="rounded-lg shadow-lg p-6 w-full max-w-md"
        style={{
          backgroundColor: themeObject.cardBackground,
          color: themeObject.text,
          borderColor: themeObject.border,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reset Password for {user.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            style={{ color: themeObject.text }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="space-y-4">
            <div
              className="p-4 rounded-md mb-4"
              style={{
                backgroundColor: themeObject.cardBackground === "#1f3a24" ? "#1f3a24" : "#d1fae5",
                color: themeObject.text === "#4ade80" ? "#4ade80" : "#065f46",
              }}
            >
              <p>Password has been reset successfully!</p>
              <p className="text-sm mt-2">The user can now log in with the new password.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-md font-medium transition"
              style={{
                backgroundColor: themeObject.button,
                color: themeObject.buttonText,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="p-4 rounded-md mb-4"
                style={{
                  backgroundColor: themeObject.cardBackground === "#1f3a24" ? "#3b1818" : "#fee2e2",
                  color: themeObject.text === "#4ade80" ? "#f87171" : "#991b1b",
                }}
              >
                {error}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm" style={{ color: themeObject.text }}>
                Email: <span className="font-semibold">{user.email}</span>
              </p>
            </div>

            <div>
              <label className="block font-medium mb-1" style={{ color: themeObject.text }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: themeObject.inputBackground,
                  color: themeObject.text,
                  borderColor: themeObject.border,
                }}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1" style={{ color: themeObject.text }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: themeObject.inputBackground,
                  color: themeObject.text,
                  borderColor: themeObject.border,
                }}
                required
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md"
                style={{
                  backgroundColor: themeObject.background === "#000000" ? "#374151" : "#f3f4f6",
                  color: themeObject.text,
                  borderColor: themeObject.border,
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}