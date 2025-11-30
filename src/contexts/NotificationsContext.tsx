// src/contexts/NotificationsContext.tsx (MIGRATED TO MONGODB)
'use client';

import { createContext, useContext, useState, ReactNode, FC, useCallback, useEffect } from 'react';
import { useAuth, UserData } from './AuthContext';

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  href: string;
  userId: string;
}

export type NewNotificationData = Omit<Notification, 'id' | 'date' | 'read' | 'userId'>;

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotificationForUser: (userId: string, notification: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => Promise<void>;
  addNotificationForGen: (targetGen: string, notification: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>, authorId?: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, allUsers, loading: authLoading } = useAuth();

  // Fetch notifications from MongoDB API
  const fetchNotifications = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${user.uid}`);
      const result = await response.json();

      if (result.success) {
        const fetchedNotifications = result.notifications.map((n: any) => ({
          ...n,
          id: n._id,
          date: new Date(n.date).toISOString(),
        }));
        setNotifications(fetchedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addNotificationForUser = useCallback(async (
    userId: string, 
    notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>
  ) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notificationData,
          userId,
          read: false,
          date: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create notification');
      }

      // Refresh if it's for current user
      if (userId === user?.uid) {
        await fetchNotifications();
      }
    } catch (error: any) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }, [user, fetchNotifications]);

  const addNotificationForGen = useCallback(async (
    targetGen: string, 
    notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>, 
    authorId?: string
  ) => {
    try {
      // Filter users based on target gen
      const usersToNotify = allUsers.filter(u => {
        if (u.uid === authorId) return false;
        if (targetGen === 'Everyone') return true;
        if (targetGen === 'All Students' && u.role === 'student') return true;
        if (targetGen === 'All Staff' && (u.role === 'teacher' || u.role === 'admin')) return true;
        if (u.role === 'student' && u.gen === targetGen) return true;
        return false;
      });

      // Create notifications in batch
      const promises = usersToNotify.map(userData =>
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...notificationData,
            userId: userData.uid,
            read: false,
            date: new Date().toISOString(),
          }),
        })
      );

      await Promise.all(promises);

      // Refresh if current user is in the target group
      if (usersToNotify.some(u => u.uid === user?.uid)) {
        await fetchNotifications();
      }
    } catch (error: any) {
      console.error('Error adding notifications for gen:', error);
      throw error;
    }
  }, [allUsers, user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }

      await fetchNotifications();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark all as read');
      }

      await fetchNotifications();
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotificationForUser, 
      addNotificationForGen, 
      markAsRead, 
      markAllAsRead,
      loading 
    }}>
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