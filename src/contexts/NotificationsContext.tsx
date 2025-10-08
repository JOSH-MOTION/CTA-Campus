'use client';

import { createContext, useContext, useState, ReactNode, FC, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth, UserData } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';

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
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, userData: authorData, allUsers } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined = undefined;

    if (user) {
      const notificationsCol = collection(db, 'notifications');
      const q = query(
        notificationsCol,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate().toISOString() || new Date().toISOString(),
          } as Notification;
        });
        setNotifications(fetchedNotifications);
      }, (error) => {
        console.error('Error fetching notifications:', {
          error: error.message,
          stack: error.stack,
        });
      });
    } else {
      setNotifications([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const addNotificationForUser = useCallback(async (userId: string, notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => {
    try {
      const newNotification = {
        ...notificationData,
        userId,
        read: false,
        date: serverTimestamp(),
      };
      await addDoc(collection(db, 'notifications'), newNotification);
    } catch (error: any) {
      console.error('Error adding notification for user:', {
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new Error('Failed to add notification.');
    }
  }, []);

  const addNotificationForGen = useCallback(async (targetGen: string, notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>, authorId?: string) => {
    try {
      const batch = writeBatch(db);
      const notificationsCol = collection(db, 'notifications');

      const usersToNotify = allUsers.filter(u => {
        if (u.uid === authorId) return false;
        if (targetGen === 'Everyone') return true;
        if (targetGen === 'All Students' && u.role === 'student') return true;
        if (targetGen === 'All Staff' && (u.role === 'teacher' || u.role === 'admin')) return true;
        if (u.role === 'student' && u.gen === targetGen) return true;
        return false;
      });

      for (const userData of usersToNotify) {
        const newNotification = {
          ...notificationData,
          userId: userData.uid,
          read: false,
          date: serverTimestamp(),
        };
        const notificationRef = doc(notificationsCol);
        batch.set(notificationRef, newNotification);
      }

      await batch.commit();
    } catch (error: any) {
      console.error('Error adding notifications for gen:', {
        error: error.message,
        targetGen,
        stack: error.stack,
      });
      throw new Error('Failed to add notifications for group.');
    }
  }, [allUsers]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notifDoc = doc(db, 'notifications', notificationId);
      await updateDoc(notifDoc, { read: true });
    } catch (error: any) {
      console.error('Error marking notification as read:', {
        error: error.message,
        notificationId,
        stack: error.stack,
      });
      throw new Error('Failed to mark notification as read.');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach(notif => {
        const notifDoc = doc(db, 'notifications', notif.id);
        batch.update(notifDoc, { read: true });
      });
      await batch.commit();
    } catch (error: any) {
      console.error('Error marking all notifications as read:', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error('Failed to mark all notifications as read.');
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotificationForUser, addNotificationForGen, markAsRead, markAllAsRead }}>
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