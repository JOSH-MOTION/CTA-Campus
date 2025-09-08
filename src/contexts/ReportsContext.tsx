// src/contexts/ReportsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Report {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorPhotoURL?: string;
  progress: string;
  challenges: string;
  nextWeekPlan: string;
  createdAt: Timestamp;
}

export type ReportData = Omit<Report, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorRole' | 'authorPhotoURL'>;

interface ReportsContextType {
  reports: Report[];
  addReport: (report: ReportData) => Promise<void>;
  loading: boolean;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userData, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (!user || role === 'student') {
        setLoading(false);
        setReports([]);
        return;
    }

    setLoading(true);
    const reportsCol = collection(db, 'reports');
    const q = query(reportsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedReports = querySnapshot.docs.map(doc => {
        return {
          id: doc.id,
          ...doc.data(),
        } as Report;
      });
      setReports(fetchedReports);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, userData, authLoading]);

  const addReport = useCallback(async (reportData: ReportData) => {
    if (!user || !userData) throw new Error("User not authenticated");
    if (role === 'student') throw new Error("Students cannot submit reports.");

    const newReportData = {
      ...reportData,
      authorId: user.uid,
      authorName: userData.displayName,
      authorRole: userData.role,
      authorPhotoURL: userData.photoURL || '',
      createdAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, 'reports'), newReportData);
  }, [user, userData, role]);

  return (
    <ReportsContext.Provider value={{reports, addReport, loading}}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = (): ReportsContextType => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};
