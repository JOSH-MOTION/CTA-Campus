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
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: () => void;
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
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
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
    const batch = writeBatch(db);
    const usersCollection = collection(db, 'users');
    
    let targetQuery;
    if (targetGen === 'Everyone') {
        targetQuery = query(usersCollection);
    } else if (targetGen === 'All Staff') {
        targetQuery = query(usersCollection, where('role', 'in', ['teacher', 'admin']));
    } else if (targetGen === 'All Students') {
        targetQuery = query(usersCollection, where('role', '==', 'student'));
    } else {
        targetQuery = query(usersCollection, where('gen', '==', targetGen));
    }

    const querySnapshot = await getDocs(targetQuery);

    querySnapshot.forEach(userDoc => {
        const newNotification = {
            ...notificationData,
            userId: userDoc.id,
            read: false,
            date: serverTimestamp(),
        };
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, newNotification);
    });

    await batch.commit();

  }, []);

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
