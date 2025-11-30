// src/contexts/AnnouncementsContext.tsx (MIGRATED TO MONGODB)
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  date: string;
  targetGen: string;
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

  // Fetch announcements from MongoDB API
  const fetchAnnouncements = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setAnnouncements([]);
      return;
    }

    setLoading(true);
    try {
      let url = '/api/announcements';
      
      // Filter by role
      if (role === 'student' && userData?.gen) {
        url += `?targetGen=${userData.gen}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const fetchedAnnouncements = result.announcements.map((ann: any) => ({
          ...ann,
          id: ann._id,
          date: new Date(ann.date).toISOString(),
        }));
        setAnnouncements(fetchedAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, userData, authLoading]);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 30000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  const addAnnouncement = useCallback(async (announcement: Omit<Announcement, 'id' | 'date'>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcement,
          date: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create announcement');
      }

      // Send notifications
      await addNotificationForGen(announcement.targetGen, {
        title: `New Announcement: ${announcement.title}`,
        description: `From ${announcement.author}`,
        href: '/announcements',
      });

      // Refresh list
      await fetchAnnouncements();
    } catch (error: any) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  }, [user, addNotificationForGen, fetchAnnouncements]);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<AnnouncementData>) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update announcement');
      }

      await fetchAnnouncements();
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }, [user, fetchAnnouncements]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete announcement');
      }

      await fetchAnnouncements();
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }, [user, fetchAnnouncements]);

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