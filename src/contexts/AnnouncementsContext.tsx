// src/contexts/AnnouncementsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC} from 'react';

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
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'date'>) => void;
}

const initialAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to the New Semester!',
    content:
      'We are excited to welcome all new and returning students to the start of a new academic year. Please be sure to check the updated timetable.',
    author: 'Admin',
    date: '2023-09-01T10:00:00Z',
    targetGen: 'All',
  },
  {
    id: '2',
    title: 'Library Extended Hours',
    content: 'The university library will have extended hours during the exam period, from 8 AM to 2 AM daily.',
    author: 'Library Services',
    date: '2023-11-20T14:30:00Z',
    targetGen: 'All',
  },
];

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'date'>) => {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: (announcements.length + 1).toString(),
      date: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  return (
    <AnnouncementsContext.Provider value={{announcements, addAnnouncement}}>
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
