"use client";

import { signOut } from "next-auth/react";

export const LogoutButton: React.FC = () => {
  const handleLogout = async () => {
    await signOut();
    window.location.href = "/"; // Redirect to login page after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
};
