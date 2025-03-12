"use client";
import { useState, useEffect } from 'react';
import { useTheme } from "@/components/ThemeProvider";
import { User } from "@/app/types/users";

interface EditUserFormProps {
  user: User;
  onClose: () => void;
}

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState(user.role || 'technician');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { themeObject, theme } = useTheme();

  // Reset form when user prop changes
  useEffect(() => {
    setEmail(user.email);
    setName(user.name || '');
    setRole(user.role || 'technician');
  }, [user]);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create the request data object
      const userData = {
        userId: user.user_id,
        email,
        name,
        role
      };

      console.log("Updating user with data:", userData);

      const response = await fetch('/api/admin/updateUser', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      console.log("User updated successfully:", result);
      
      alert('User updated successfully');
      onClose(); // Close the modal
      window.location.reload(); // Refresh the page to show updated data
    } catch (err) {
      console.error('Error updating user:', err);
      if (err instanceof Error) {
        setError(err.message || 'An error occurred');
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role change explicitly
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    console.log("Role changed to:", selectedRole);
    setRole(selectedRole as 'admin' | 'technician');
  };

  const formBgColor = theme === 'dark' ? themeObject.cardBackground : 'white';
  const inputBgColor = theme === 'dark' ? themeObject.inputBackground : 'white';
  const borderColor = themeObject.border;
  const textColor = themeObject.text;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div 
        className="rounded-lg shadow-lg p-6 w-full max-w-md"
        style={{
          backgroundColor: formBgColor,
          color: textColor,
          borderColor: borderColor
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit User</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            style={{ color: textColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded border border-red-400">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                backgroundColor: inputBgColor,
                color: textColor,
                borderColor: borderColor
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Full name"
              style={{ 
                backgroundColor: inputBgColor,
                color: textColor,
                borderColor: borderColor
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Role:</label>
            <select
              value={role}
              onChange={handleRoleChange}
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                backgroundColor: inputBgColor,
                color: textColor,
                borderColor: borderColor
              }}
            >
              <option value="technician">Technician</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
              style={{
                backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                color: textColor,
                borderColor: borderColor
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
            >
              {isLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}