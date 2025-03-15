// src/app/admin/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import AddUserForm from "./components/AddUserForm";
import EditUserForm from "./components/EditUserForm";
import AdminPasswordReset from "@/components/AdminPasswordReset";
import UserHistoryView from "./components/UserHistoryView";
import { User } from "../types/users";
import { useTheme } from "@/components/ThemeProvider";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const { themeObject, theme } = useTheme();

  // Use useCallback to define fetchUserRole
  const fetchUserRole = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/getUsers`);
      const text = await response.text();
      console.log("API Raw Response:", text);
      const users = JSON.parse(text);
      
      if (!Array.isArray(users)) {
        console.error("Invalid API response (not an array):", users);
        return;
      }
      
      const currentUser = users.find((user: User) => user.email === session?.user?.email);
      if (!currentUser || currentUser.role !== "admin") {
        console.warn("Unauthorized access attempt:", currentUser);
        router.push("/dashboard");
      }
      
      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [router, session?.user?.email]);

  // ✅ Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) return;
    fetchUserRole();
  }, [status, session, fetchUserRole]);

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const closeEditForm = () => {
    setEditingUser(null);
  };

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
  };

  const closePasswordReset = () => {
    setResetPasswordUser(null);
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div 
      className={`admin-panel p-6 ${theme === 'dark' ? 'dark' : ''}`}
      style={{ 
        backgroundColor: themeObject.background, 
        color: themeObject.text 
      }}
    >
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: themeObject.border }}>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'users' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'history' 
              ? 'border-b-2 border-blue-500 text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Version History
        </button>
      </div>
      
      {activeTab === 'users' && (
        <>
          {/* Action Bar - Contains the Add User button */}
          <div 
            className="p-4 rounded-md mb-4 flex justify-between items-center"
            style={{ 
              backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
              color: themeObject.text
            }}
          >
            <p className="text-gray-700" style={{ color: themeObject.text }}>Manage system users</p>
            <button
              onClick={toggleAddForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center"
            >
              <span className="mr-1">+</span>
              {showAddForm ? "Hide Form" : "Add User"}
            </button>
          </div>
          
          {/* Add User Form - Shown/hidden based on state */}
          {showAddForm && <AddUserForm />}
          
          {/* Edit User Modal */}
          {editingUser && <EditUserForm user={editingUser} onClose={closeEditForm} />}
          
          {/* Password Reset Modal */}
          {resetPasswordUser && <AdminPasswordReset user={resetPasswordUser} onClose={closePasswordReset} />}
          
          {/* User Table */}
          <table 
            className="w-full mt-4 border-collapse" 
            style={{ 
              borderColor: themeObject.border 
            }}
          >
            <thead>
              <tr style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6' }}>
                <th className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>Email</th>
                <th className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>Name</th>
                <th className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>Role</th>
                <th className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>{user.email}</td>
                  <td className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>{user.name}</td>
                  <td className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>{user.role}</td>
                  <td className="px-4 py-2" style={{ borderColor: themeObject.border, color: themeObject.text }}>
                    <div className="flex space-x-2">
                      <EditButton user={user} onEdit={handleEdit} />
                      <ResetPasswordButton user={user} onResetPassword={handleResetPassword} />
                      <DeleteUserButton userId={user.user_id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      
      {activeTab === 'history' && <UserHistoryView />}
    </div>
  );
}

// Edit Button Component
function EditButton({ user, onEdit }: { user: User; onEdit: (user: User) => void }) {
  return (
    <button
      onClick={() => onEdit(user)}
      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
    >
      Edit
    </button>
  );
}

// Reset Password Button Component
function ResetPasswordButton({ user, onResetPassword }: { user: User; onResetPassword: (user: User) => void }) {
  return (
    <button
      onClick={() => onResetPassword(user)}
      className="bg-amber-500 text-white px-3 py-1 rounded-md hover:bg-amber-600 transition"
    >
      Reset Password
    </button>
  );
}

// Delete User Button (with API)
function DeleteUserButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      setIsLoading(true);
      console.log("Sending delete request for userId:", userId);
      const response = await fetch("/api/admin/deleteUsers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      // Consider the operation successful even with a partial deletion
      if (result.success || response.ok) {
        console.log("User deleted with result:", result);
        alert("User deleted successfully!");
        window.location.reload();
        return;
      }
      
      // Only show error for complete failures
      console.error("Error deleting user:", result.error || "Unknown error");
      alert("Error deleting user: " + (result.error || "Unknown error"));
      
    } catch (error) {
      console.error("Delete request failed:", error);
      alert("Server error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
      disabled={isLoading}
    >
      {isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}