"use client";
import { useState, useEffect } from 'react';
import { useTheme } from "@/components/ThemeProvider";

interface UserHistoryRecord {
  id: string;
  action_type: 'create' | 'update' | 'delete' | 'restore';
  performed_by: string;
  performed_by_email: string;
  target_user_id: string;
  target_user_email: string;
  previous_data: any;
  new_data: any;
  timestamp: string;
}

export default function UserHistoryView() {
  const [history, setHistory] = useState<UserHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoreInProgress, setRestoreInProgress] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { themeObject, theme } = useTheme();
  
  const pageSize = 10;

  // Fetch history data
  useEffect(() => {
    fetchHistory();
  }, [filter, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      let url = `/api/admin/userHistory?limit=${pageSize}&offset=${page * pageSize}`;
      
      if (filter !== 'all') {
        url += `&action_type=${filter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      if (page === 0) {
        setHistory(data);
      } else {
        setHistory(prev => [...prev, ...data]);
      }
      
      // Check if we have more data to load
      setHasMore(data.length === pageSize);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching history");
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setPage(0); // Reset to first page when changing filter
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const restoreUser = async (historyId: string) => {
    if (!confirm("Are you sure you want to restore this user?")) {
      return;
    }
    
    setRestoreInProgress(historyId);
    
    try {
      const response = await fetch("/api/admin/userHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ historyId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const result = await response.json();
      
      // Success! Refresh the history data
      alert("User restored successfully! They will need to reset their password.");
      fetchHistory();
      window.location.reload(); // Reload the page to show the restored user in the user list
      
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore user");
      console.error("Error restoring user:", err);
    } finally {
      setRestoreInProgress(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'restore':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div
      className="mt-6 p-4 border rounded-md"
      style={{
        backgroundColor: themeObject.cardBackground,
        color: themeObject.text,
        borderColor: themeObject.border
      }}
    >
      <h2 className="text-xl font-bold mb-4">User Action History</h2>
      
      {/* Filter control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: themeObject.text }}>
          Filter by action:
        </label>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="w-full md:w-auto px-3 py-2 border rounded-md"
          style={{
            backgroundColor: themeObject.inputBackground,
            color: themeObject.text,
            borderColor: themeObject.border,
          }}
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="restore">Restore</option>
        </select>
      </div>
      
      {/* Error message */}
      {error && (
        <div
          className="p-4 rounded-md mb-4"
          style={{
            backgroundColor: theme === 'dark' ? '#3b1818' : '#fee2e2',
            color: theme === 'dark' ? '#f87171' : '#991b1b',
          }}
        >
          {error}
        </div>
      )}
      
      {/* History list */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}>
              <th className="px-4 py-2 text-left" style={{ color: themeObject.text, borderColor: themeObject.border }}>Action</th>
              <th className="px-4 py-2 text-left" style={{ color: themeObject.text, borderColor: themeObject.border }}>User</th>
              <th className="px-4 py-2 text-left" style={{ color: themeObject.text, borderColor: themeObject.border }}>Performed By</th>
              <th className="px-4 py-2 text-left" style={{ color: themeObject.text, borderColor: themeObject.border }}>Timestamp</th>
              <th className="px-4 py-2 text-center" style={{ color: themeObject.text, borderColor: themeObject.border }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center" style={{ color: themeObject.text }}>
                  No history records found.
                </td>
              </tr>
            ) : (
              history.map((record) => (
                <tr 
                  key={record.id} 
                  className={theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(record.action_type)}`}>
                      {record.action_type.charAt(0).toUpperCase() + record.action_type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: themeObject.text }}>
                    {record.target_user_email}
                    {record.action_type === 'delete' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Role: {record.previous_data?.role || 'N/A'}, 
                        Name: {record.previous_data?.name || 'N/A'}
                      </div>
                    )}
                    {record.action_type === 'create' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Role: {record.new_data?.role || 'N/A'}, 
                        Name: {record.new_data?.name || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ color: themeObject.text }}>
                    {record.performed_by_email}
                  </td>
                  <td className="px-4 py-3" style={{ color: themeObject.text }}>
                    {formatDate(record.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.action_type === 'delete' && (
                      <button
                        onClick={() => restoreUser(record.id)}
                        disabled={restoreInProgress === record.id}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition ${
                          restoreInProgress === record.id 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {restoreInProgress === record.id ? (
                          <span>Restoring...</span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Restore
                          </>
                        )}
                      </button>
                    )}
                    {record.action_type !== 'delete' && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Load more button */}
      {!loading && hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}