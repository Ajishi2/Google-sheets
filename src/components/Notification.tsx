import React, { useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'info';

type NotificationProps = {
  type: NotificationType;
  message: string;
  duration?: number;
  onClose: () => void;
};

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  // Define styles based on notification type
  const getStyles = (): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-md border ${getStyles()} z-50 flex items-center`}>
      <span className="flex-1">{message}</span>
      <button 
        onClick={onClose}
        className="ml-3 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>
    </div>
  );
};