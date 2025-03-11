"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AddUserForm from "./components/AddUserForm"; // Adjust path as needed

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // ✅ Redirect if not admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) return;
    fetchUserRole();
  }, [status, session]);

  async function fetchUserRole() {
    try {
      const response = await fetch(`/api/admin/getUsers`);
      const text = await response.text();
      console.log("API Raw Response:", text);
      const users = JSON.parse(text);
      if (!Array.isArray(users)) {
        console.error("Invalid API response (not an array):", users);
        return;
      }
      const currentUser = users.find((user: any) => user.email === session?.user?.email);
      if (!currentUser || currentUser.role !== "admin") {
        console.warn("Unauthorized access attempt:", currentUser);
        router.push("/dashboard");
      }
      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
  };

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      {/* Action Bar - Contains the Add User button */}
      <div className="bg-gray-100 p-4 rounded-md mb-4 flex justify-between items-center">
        <p className="text-gray-700">Manage system users</p>
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
      
      {/* User Table */}
      <table className="w-full mt-4 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2">Email</th>
            <th className="border border-gray-300 px-4 py-2">Role</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td className="border border-gray-300 px-4 py-2">{user.email}</td>
              <td className="border border-gray-300 px-4 py-2">{user.role}</td>
              <td className="border border-gray-300 px-4 py-2">
                <DeleteUserButton userId={user.user_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      if (!response.ok) {
        console.error("Error deleting user: " + result.error);
        alert("Error deleting user: " + result.error);
      } else {
        alert("User deleted successfully!");
        window.location.reload();
      }
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
      Delete
    </button>
  );
}