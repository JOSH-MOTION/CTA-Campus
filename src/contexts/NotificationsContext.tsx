// src/contexts/NotificationsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useCallback} from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  href: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({...n, read: true}))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{notifications, unreadCount, addNotification, markAllAsRead}}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
