import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
    }
    setNotification({ message, type });
    timeoutIdRef.current = setTimeout(() => {
      setNotification(null);
      timeoutIdRef.current = null;
    }, 4000);
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
