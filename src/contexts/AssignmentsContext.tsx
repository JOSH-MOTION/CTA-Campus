// src/contexts/AssignmentsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthContext';


export interface AssignmentDueDate {
  day: string; // e.g., "Monday"
  dateTime: string; // ISO string
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDates: AssignmentDueDate[];
  targetGen: string; // e.g., "Gen 30" or "All"
  createdAt: Timestamp;
}

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  loading: boolean;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setAssignments([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const assignmentsCol = collection(db, 'assignments');
    const q = query(assignmentsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedAssignments = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Assignment;
        });
        setAssignments(fetchedAssignments);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching assignments:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  const addAssignment = useCallback(async (assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    if(!user) throw new Error("User not authenticated");
    
    const newAssignmentData = {
      ...assignment,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'assignments'), newAssignmentData);
    
    addNotification({
      title: `New Assignment: ${assignment.title}`,
      description: `A new assignment has been posted for ${assignment.targetGen}.`,
      href: '/assignments',
    });
  }, [user, addNotification]);

  return (
    <AssignmentsContext.Provider value={{assignments, addAssignment, loading}}>
      {children}
    </AssignmentsContext.Provider>
  );
};

export const useAssignments = (): AssignmentsContextType => {
  const context = useContext(AssignmentsContext);
  if (!context) {
    throw new Error('useAssignments must be used within an AssignmentsProvider');
  }
  return context;
};
