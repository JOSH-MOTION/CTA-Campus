// src/contexts/AnnouncementsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  targetGen: string; // e.g., "Gen 30" or "All"
}

interface AnnouncementsContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => Promise<void>;
  loading: boolean;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setLoading(false);
        setAnnouncements([]);
        return;
    };

    setLoading(true);
    const announcementsCol = collection(db, 'announcements');
    const q = query(announcementsCol, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAnnouncements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: (data.date as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as Announcement;
      });
      setAnnouncements(fetchedAnnouncements);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching announcements:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'date'>) => {
    if (!user) throw new Error("User not authenticated");

    const newAnnouncementData = {
      ...announcement,
      date: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'announcements'), newAnnouncementData);
    
    addNotification({
      title: `New Announcement: ${announcement.title}`,
      description: `Targeted to: ${announcement.targetGen}`,
      href: '/announcements',
    });
  }, [user, addNotification]);

  return (
    <AnnouncementsContext.Provider value={{announcements, addAnnouncement, loading}}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementsContextType => {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within a AnnouncementsProvider');
  }
  return context;
};
