// src/components/technician/StatusBadges.tsx
import React from 'react';

interface StatusBadgeProps {
  status?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">Unknown</span>;
  
  switch(status.toLowerCase()) {
    case 'completed':
      return <span className="px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">Completed</span>;
    case 'deployed':
      return <span className="px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">Deployed</span>;
    case 'in progress':
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800">In Progress</span>;
    case 'ready to deploy':
      return <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800">Ready to Deploy</span>;
    case 'pending':
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 text-yellow-800">Pending</span>;
    case 'cancelled':
      return <span className="px-2 py-1 rounded-full text-xs bg-red-200 text-red-800">Cancelled</span>;
    case 'on hold':
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">On Hold</span>;
    default:
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">{status}</span>;
  }
};

interface PriorityBadgeProps {
  priority?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  if (!priority) return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">-</span>;
  
  switch(priority.toLowerCase()) {
    case 'high':
      return <span className="px-2 py-1 rounded-full text-xs bg-red-200 text-red-800">High</span>;
    case 'medium':
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 text-yellow-800">Medium</span>;
    case 'low':
      return <span className="px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">Low</span>;
    default:
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">{priority}</span>;
  }
};