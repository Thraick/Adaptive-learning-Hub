
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface AlertProps {
  message: string;
  type: 'error' | 'success';
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
  const isError = type === 'error';

  return (
    <div
      className={`p-3 rounded-md flex items-center space-x-3 ${
        isError ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
      }`}
      role="alert"
    >
      {isError ? (
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default Alert;
