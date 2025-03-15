// src/components/technician/StatusBadges.tsx
import React from 'react';

interface StatusBadgeProps {
  status?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (!status) return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">Unknown</span>;
  
  // Determine color based on status using the Excel sheet colors
  const getStatusStyles = (statusValue: string) => {
    const lowercaseStatus = statusValue.toLowerCase();
    
    switch(lowercaseStatus) {
      case 'received':
        return 'bg-white border border-gray-300 text-gray-800';
      case 'imaging':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'configuring':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'ready to deploy':
        return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'deployed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'canceled':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'unk':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'ordered':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      default:
        return 'bg-gray-200 text-gray-800 border border-gray-300';
    }
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
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