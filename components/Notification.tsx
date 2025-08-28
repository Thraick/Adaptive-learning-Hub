import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const Notification: React.FC = () => {
  const { notification } = useNotification();

  if (!notification) {
    return null;
  }

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />,
    error: <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />,
    info: <Info className="h-6 w-6 text-blue-400 flex-shrink-0" />,
  };

  const colors = {
    success: 'bg-green-900/90 border-green-700',
    error: 'bg-red-900/90 border-red-700',
    info: 'bg-blue-900/90 border-blue-700',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 md:bottom-8 md:right-8 z-50 p-4 rounded-lg border text-white shadow-lg flex items-start space-x-3 max-w-sm animate-fade-in-up backdrop-blur-sm ${colors[notification.type]}`}
      role="alert"
    >
      {icons[notification.type]}
      <p className="text-sm">{notification.message}</p>
    </div>
  );
};

export default Notification;
