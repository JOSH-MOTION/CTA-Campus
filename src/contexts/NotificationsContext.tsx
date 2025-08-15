// src/contexts/NotificationsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useCallback, useEffect} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth, UserData } from './AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  href: string;
  userId: string;
}

export type NewNotificationData = Omit<Notification, 'id' | 'date' | 'read'>;

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotificationForUser: (userId: string, notification: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => Promise<void>;
  addNotificationForGen: (targetGen: string, notification: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, fetchAllUsers } = useAuth();

  useEffect(() => {
    if (!user) {
        setNotifications([]);
        return;
    }

    const notificationsCol = collection(db, 'notifications');
    const q = query(
        notificationsCol, 
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date?.toDate().toISOString() || new Date().toISOString(),
            } as Notification;
        });
        setNotifications(fetchedNotifications);
    });

    return () => unsubscribe();
  }, [user]);
  
  const addNotificationForUser = useCallback(async (userId: string, notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => {
      const newNotification = {
          ...notificationData,
          userId,
          read: false,
          date: serverTimestamp(),
      };
      await addDoc(collection(db, 'notifications'), newNotification);
  }, []);

  const addNotificationForGen = useCallback(async (targetGen: string, notificationData: Omit<Notification, 'id' | 'date' | 'read' | 'userId'>) => {
    const users = await fetchAllUsers();
    const batch = writeBatch(db);

    const targetUsers = users.filter(u => {
        if (targetGen === 'Everyone') return true;
        if (targetGen === 'All Staff' && (u.role === 'teacher' || u.role === 'admin')) return true;
        if (targetGen === 'All Students' && u.role === 'student') return true;
        if (u.gen === targetGen) return true;
        return false;
    });

    targetUsers.forEach(targetUser => {
        const newNotification = {
            ...notificationData,
            userId: targetUser.uid,
            read: false,
            date: serverTimestamp(),
        };
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();

  }, [fetchAllUsers]);

  const markAsRead = useCallback(async (notificationId: string) => {
      const notifDoc = doc(db, 'notifications', notificationId);
      await updateDoc(notifDoc, { read: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notif => {
        const notifDoc = doc(db, 'notifications', notif.id);
        batch.update(notifDoc, { read: true });
    });
    await batch.commit();
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{notifications, unreadCount, addNotificationForUser, addNotificationForGen, markAsRead, markAllAsRead}}>
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
