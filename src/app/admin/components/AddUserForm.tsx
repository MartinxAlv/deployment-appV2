"use client";
import { useState } from 'react';
import { useTheme } from "@/components/ThemeProvider";

export default function AddUserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('technician');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { themeObject, theme } = useTheme();

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create the request data object
      const userData = {
        email,
        password,
        name,
        userRole: role // Ensure we're sending the selected role
      };

      console.log("Creating user with data:", userData);

      const response = await fetch('/api/admin/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      console.log("User created successfully:", result);
      
      // Success - reset form
      setEmail('');
      setPassword('');
      setName('');
      setRole('technician');
      alert(`User created successfully with role: ${result.role || role}`);
      window.location.reload(); // Reload to update the user list
    } catch (err) {
      console.error('Error creating user:', err);
      if (err instanceof Error) {
        setError(err.message || 'An error occurred');
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle role change explicitly
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value;
    console.log("Role changed to:", selectedRole);
    setRole(selectedRole);
  };

  const formBgColor = theme === 'dark' ? themeObject.cardBackground : 'white';
  const inputBgColor = theme === 'dark' ? themeObject.inputBackground : 'white';
  const borderColor = themeObject.border;
  const textColor = themeObject.text;

  return (
    <div 
      className="mt-4 mb-6 p-4 border rounded-md"
      style={{
        backgroundColor: formBgColor,
        color: textColor,
        borderColor: borderColor
      }}
    >
      <h2 className="text-xl font-bold mb-4">Add New User</h2>
      
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
          <label className="block text-sm font-medium mb-1" style={{ color: textColor }}>Password:</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md pr-10"
              style={{ 
                backgroundColor: inputBgColor,
                color: textColor,
                borderColor: borderColor
              }}
            />
            <button 
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 hover:text-gray-800"
              style={{ color: textColor }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
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
        
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          {isLoading ? 'Creating...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}