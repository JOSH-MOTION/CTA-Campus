
// src/contexts/AnnouncementsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  targetGen: string; // e.g., "Gen 30", "All Students", or "Everyone"
  imageUrl?: string;
}

export type AnnouncementData = Omit<Announcement, 'id' | 'date' | 'author' | 'authorId'>;

interface AnnouncementsContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<AnnouncementData>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  loading: boolean;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotificationForGen } = useNotifications();
  const { user, userData, role, loading: authLoading } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    // Wait for auth to finish loading and user to be determined
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (!user) {
        setLoading(false);
        setAnnouncements([]);
        return;
    }

    setLoading(true);
    const announcementsCol = collection(db, 'announcements');
    
    // Build a query based on the user's role and generation
    let q;
    if (role === 'teacher' || role === 'admin') {
        // Teachers and admins can see all announcements
        q = query(announcementsCol, orderBy('date', 'desc'));
    } else if (role === 'student' && userData?.gen) {
        // Students see announcements for their gen, 'All Students', or 'Everyone'
        q = query(
            announcementsCol, 
            where('targetGen', 'in', [userData.gen, 'All Students', 'Everyone']),
            orderBy('date', 'desc')
        );
    } else if (role === 'student' && !userData?.gen) {
      // New student might not have a gen yet, prevent query from running
      setLoading(false);
      return;
    } else {
        // Fallback for users without a specific role/gen, only see 'Everyone'
        q = query(
            announcementsCol, 
            where('targetGen', '==', 'Everyone'),
            orderBy('date', 'desc')
        );
    }


    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedAnnouncements = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateString: string;
        if (data.date && typeof data.date.toDate === 'function') {
            // It's a Firestore Timestamp
            dateString = data.date.toDate().toISOString();
        } else if (typeof data.date === 'string') {
            // It's already a string
            dateString = data.date;
        } else {
            // Fallback for any other case
            dateString = new Date().toISOString();
        }

        return {
          id: doc.id,
          ...data,
          date: dateString,
        } as Announcement;
      });
      setAnnouncements(fetchedAnnouncements);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching announcements:", error);
        setLoading(false);
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, role, userData, authLoading]);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'date'>) => {
    if (!user) throw new Error("User not authenticated");

    const newAnnouncementData = {
      ...announcement,
      date: serverTimestamp(),
    };
    
    await addDoc(collection(db, 'announcements'), newAnnouncementData);
    
    await addNotificationForGen(announcement.targetGen, {
      title: `New Announcement: ${announcement.title}`,
      description: `From ${announcement.author}`,
      href: '/announcements',
    });
  }, [user, addNotificationForGen]);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<AnnouncementData>) => {
    if (!user) throw new Error("User not authenticated");
    const announcementDoc = doc(db, 'announcements', id);
    await updateDoc(announcementDoc, updates);
  }, [user]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    const announcementDoc = doc(db, 'announcements', id);
    await deleteDoc(announcementDoc);
  }, [user]);

  return (
    <AnnouncementsContext.Provider value={{announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, loading}}>
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
