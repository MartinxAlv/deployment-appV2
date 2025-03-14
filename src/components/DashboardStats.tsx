// src/components/DashboardStats.tsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from "@/components/ThemeProvider";

// Define types for deployment data
interface DeploymentData {
  id?: string;
  "Deployment ID"?: string;
  Status?: string;
  "Assigned To"?: string;
  Department?: string;
  Division?: string;
  "Department - Division"?: string;
  Location?: string;
  "Deployment Type"?: string;
  "New Device Type"?: string;
  "New Model"?: string;
  Priority?: string;
  "Deployment Date"?: string;
  dateObj?: Date | null;
  [key: string]: string | number | Date | null | undefined;
}

// Define chart data types
interface ChartDataItem {
  name: string;
  value: number;
}

// Define types for statistics
interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  statusData: ChartDataItem[];
  departmentData: ChartDataItem[];
  deviceTypeData: ChartDataItem[];
  priorityData: ChartDataItem[];
  recentDeployments: DeploymentData[];
  upcomingDeployments: DeploymentData[];
}

// Define color types
interface ChartColors {
  status: Record<string, string>;
  priority: Record<string, string>;
  department: string[];
  deviceType: string[];
}

const DashboardStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart colors for different themes
  const chartColors: ChartColors = {
    status: {
      Completed: isDark ? '#10B981' : '#34D399',
      Deployed: isDark ? '#10B981' : '#34D399', // Same color as Completed
      'In Progress': isDark ? '#3B82F6' : '#60A5FA',
      'Ready to Deploy': isDark ? '#3B82F6' : '#60A5FA', // Same color as In Progress
      Pending: isDark ? '#F59E0B' : '#FBBF24',
      Cancelled: isDark ? '#EF4444' : '#F87171',
      'On Hold': isDark ? '#6B7280' : '#9CA3AF',
    },
    priority: {
      High: isDark ? '#EF4444' : '#F87171',
      Medium: isDark ? '#F59E0B' : '#FBBF24',
      Low: isDark ? '#10B981' : '#34D399',
    },
    department: [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', 
      '#6366F1', '#14B8A6', '#A855F7', '#EAB308', '#F43F5E'
    ],
    deviceType: [
      '#2563EB', '#059669', '#7C3AED', '#D97706', '#DB2777',
      '#4F46E5', '#0D9488', '#9333EA', '#CA8A04', '#E11D48'
    ]
  };

  // Statistics state
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    statusData: [],
    departmentData: [],
    deviceTypeData: [],
    priorityData: [],
    recentDeployments: [],
    upcomingDeployments: []
  });

  // Fetch deployment data
  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/deployments');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to fetch deployments`);
        }
        
        const data = await response.json();
        // Don't set deployments state, just process it directly
        processDeploymentData(data);
      } catch (err) {
        console.error("Error fetching deployments:", err);
        setError(err instanceof Error ? err.message : "Failed to load deployment data");
      } finally {
        setLoading(false);
      }
    };
    

    fetchDeployments();
  }, []);

  // Process deployment data into stats
  const processDeploymentData = (data: DeploymentData[]) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("No deployment data to process");
      return;
    }

    try {
      // Basic counts
const total = data.length;
// Count both "Completed" and "Deployed" statuses as completed
const completed = data.filter(d => d.Status === 'Completed' || d.Status === 'Deployed').length;
// Count both "In Progress" and "Ready to Deploy" statuses as in progress
const inProgress = data.filter(d => d.Status === 'In Progress' || d.Status === 'Ready to Deploy').length;
const pending = data.filter(d => d.Status === 'Pending').length;

      // Status distribution
      const statusCounts: Record<string, number> = {};
data.forEach(d => {
  if (d.Status) {
    // Use original status name for counting to preserve all categories
    statusCounts[d.Status] = (statusCounts[d.Status] || 0) + 1;
  }
});
      // Create status data for charts
      const statusData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
      }));

      // Department distribution - MODIFIED to use "Department - Division" field
      const deptCounts: Record<string, number> = {};
      data.forEach(d => {
        // Try to get the department-division value first, then fall back to department if not available
        const departmentValue = d["Department - Division"] || d.Department || "Unknown";
        if (departmentValue) {
          deptCounts[departmentValue] = (deptCounts[departmentValue] || 0) + 1;
        }
      });
      
      const departmentData = Object.keys(deptCounts)
        .map(dept => ({ name: dept, value: deptCounts[dept] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7); // Top 7 departments

      // Device type distribution
      const deviceCounts: Record<string, number> = {};
      data.forEach(d => {
        const deviceType = d['New Device Type'] || d['Deployment Type'] || 'Unknown';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });
      const deviceTypeData = Object.keys(deviceCounts)
        .map(type => ({ name: type, value: deviceCounts[type] }))
        .filter(item => item.name !== 'Unknown' || item.value > 0);

      // Priority distribution
      const priorityCounts: Record<string, number> = {};
      data.forEach(d => {
        if (d.Priority) {
          priorityCounts[d.Priority] = (priorityCounts[d.Priority] || 0) + 1;
        }
      });
      const priorityData = Object.keys(priorityCounts)
        .map(priority => ({ name: priority, value: priorityCounts[priority] }));

      // Recent and upcoming deployments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Process dates safely
      const processedData = data.map(d => {
        let dateObj = null;
        try {
          if (d['Deployment Date']) {
            dateObj = new Date(d['Deployment Date']);
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
              dateObj = null;
            }
          }
        } catch (_) {  // <-- This is the fix
          console.warn("Invalid date format:", d['Deployment Date']);
        }
        return { ...d, dateObj };
      });
      
      // Get recent deployments (with valid dates)
      const recentDeployments = processedData
        .filter(d => d.dateObj && d.dateObj <= today)
        .sort((a, b) => (b.dateObj as Date).getTime() - (a.dateObj as Date).getTime())
        .slice(0, 5);
        
      // Get upcoming deployments (with valid dates)
      const upcomingDeployments = processedData
        .filter(d => d.dateObj && d.dateObj > today)
        .sort((a, b) => (a.dateObj as Date).getTime() - (b.dateObj as Date).getTime())
        .slice(0, 5);

      // Update state with processed data
      setStats({
        total,
        completed,
        inProgress,
        pending,
        statusData,
        departmentData,
        deviceTypeData,
        priorityData,
        recentDeployments,
        upcomingDeployments
      });
      
    } catch (err) {
      console.error("Error processing deployment data:", err);
      setError("Error processing deployment data");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
        <p className="text-sm mt-2">Please try refreshing the page or contact support if the problem persists.</p>
      </div>
    );
  }

  // Calculate completion rate
  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deployments */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Deployments</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.total}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
        
        {/* Completed */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-500">{stats.completed}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        
        {/* In Progress */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>In Progress</p>
              <p className="text-2xl font-bold mt-1 text-blue-500">{stats.inProgress}</p>
            </div>
            <div className="text-2xl">🔄</div>
          </div>
        </div>
        
        {/* Completion Rate */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Completion Rate</p>
              <p className={`text-2xl font-bold mt-1 ${
                completionRate > 75 ? 'text-green-500' : 
                completionRate > 50 ? 'text-yellow-500' : 
                'text-red-500'
              }`}>{completionRate}%</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Deployment Status</h3>
          
          {stats.statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartColors.status[entry.name] || chartColors.department[index % chartColors.department.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} deployments`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No status data available</p>
            </div>
          )}
        </div>

        {/* Department Distribution - UPDATED TITLE TO REFLECT THE NEW SOURCE */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Deployments by Department - Division</h3>
          
          {stats.departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.departmentData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  tick={{
                    fill: isDark ? '#D1D5DB' : '#374151',
                    fontSize: 12
                  }}
                />
                <Tooltip formatter={(value) => [`${value} deployments`, 'Count']} />
                <Legend />
                <Bar dataKey="value" name="Deployments" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No department data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Type Distribution */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Device Types</h3>
          
          {stats.deviceTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.deviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.deviceTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartColors.deviceType[index % chartColors.deviceType.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} deployments`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No device type data available</p>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Priority Distribution</h3>
          
          {stats.priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.priorityData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartColors.priority[entry.name] || chartColors.department[index % chartColors.department.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} deployments`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No priority data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Deployment Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Recent Deployments</h3>
          
          {stats.recentDeployments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDeployments.map((deployment) => {
                // Generate a unique key
                const deploymentKey = deployment.id || deployment["Deployment ID"] || Math.random().toString();
                
                // Format the date
                let formattedDate = 'N/A';
                try {
                  if (deployment.dateObj) {
                    formattedDate = deployment.dateObj.toLocaleDateString();
                  } else if (deployment["Deployment Date"]) {
                    formattedDate = new Date(deployment["Deployment Date"]).toLocaleDateString();
                  }
                } catch (error) {
                  console.error("Error processing deployment data:", error);
                  // Use error variable to avoid lint warning
                  setError(error instanceof Error ? error.message : "Processing error");
                }
                
                // Get status color
                const statusColorClass = (() => {
                  switch(deployment.Status) {
                    case 'Completed': return isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800';
                    case 'In Progress': return isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800';
                    case 'Pending': return isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-800';
                    case 'Cancelled': return isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800';
                    case 'On Hold': return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800';
                    default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800';
                  }
                })();
                
                return (
                  <div 
                    key={deploymentKey}
                    className={`p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}
                  >
                    <div>
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {deployment["New Device Type"] || deployment["Deployment Type"] || "Device"} - {deployment["Assigned To"] || "Unassigned"}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deployment.Location || "No location"} · {formattedDate}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColorClass}`}>
                      {deployment.Status || "No status"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-center">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No recent deployments</p>
            </div>
          )}
        </div>

        {/* Upcoming Deployments */}
        <div className={`p-4 rounded-lg shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white border'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Upcoming Deployments</h3>
          
          {stats.upcomingDeployments.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingDeployments.map((deployment) => {
                // Generate a unique key
                const deploymentKey = deployment.id || deployment["Deployment ID"] || Math.random().toString();
                
                // Format the date
                let formattedDate = 'N/A';
                try {
                  if (deployment.dateObj) {
                    formattedDate = deployment.dateObj.toLocaleDateString();
                  } else if (deployment["Deployment Date"]) {
                    formattedDate = new Date(deployment["Deployment Date"]).toLocaleDateString();
                  }
                } catch (error) {
                  console.warn("Date formatting error");
                }
                
                // Get status color
                const statusColorClass = (() => {
                  switch(deployment.Status) {
                    case 'Completed': return isDark ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800';
                    case 'In Progress': return isDark ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800';
                    case 'Pending': return isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-800';
                    case 'Cancelled': return isDark ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800';
                    case 'On Hold': return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800';
                    default: return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800';
                  }
                })();
                
                return (
                  <div 
                    key={deploymentKey}
                    className={`p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}
                  >
                    <div>
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {deployment["New Device Type"] || deployment["Deployment Type"] || "Device"} - {deployment["Assigned To"] || "Unassigned"}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {deployment.Location || "No location"} · {formattedDate}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColorClass}`}>
                      {deployment.Status || "No status"}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-center">
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No upcoming deployments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;