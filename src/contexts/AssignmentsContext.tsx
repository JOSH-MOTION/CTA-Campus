// src/contexts/AssignmentsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
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
  authorId: string;
  createdAt: Timestamp;
}

export type AssignmentData = Omit<Assignment, 'id' | 'createdAt'>;

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: AssignmentData) => Promise<void>;
  updateAssignment: (id: string, updates: Partial<AssignmentData>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  loading: boolean;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotificationForGen } = useNotifications();
  const { user, userData, role, loading: authLoading } = useAuth();

  useEffect(() => {
     if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
        setAssignments([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const assignmentsCol = collection(db, 'assignments');
    
    let q;
    if (role === 'teacher' || role === 'admin') {
      q = query(assignmentsCol, orderBy('createdAt', 'desc'));
    } else if (role === 'student' && userData?.gen) {
      q = query(
        assignmentsCol,
        where('targetGen', 'in', [userData.gen, 'All Students', 'Everyone']),
        orderBy('createdAt', 'desc')
      );
    } else if (role === 'student' && !userData?.gen) {
        // New student might not have a gen yet, prevent query from running
        setLoading(false);
        return;
    } else {
      q = query(
        assignmentsCol,
        where('targetGen', '==', 'Everyone'),
        orderBy('createdAt', 'desc')
      );
    }

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

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, role, userData, authLoading]);


  const addAssignment = useCallback(async (assignment: AssignmentData) => {
    if(!user) throw new Error("User not authenticated");
    
    const newAssignmentData = {
      ...assignment,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'assignments'), newAssignmentData);
    
    await addNotificationForGen(assignment.targetGen, {
      title: `New Assignment: ${assignment.title}`,
      description: `A new assignment has been posted.`,
      href: '/assignments',
    });
  }, [user, addNotificationForGen]);

  const updateAssignment = useCallback(async (id: string, updates: Partial<AssignmentData>) => {
    if (!user) throw new Error("User not authenticated");
    const assignmentDoc = doc(db, 'assignments', id);
    await updateDoc(assignmentDoc, updates);
  }, [user]);

  const deleteAssignment = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    const assignmentDoc = doc(db, 'assignments', id);
    await deleteDoc(assignmentDoc);
  }, [user]);

  return (
    <AssignmentsContext.Provider value={{assignments, addAssignment, updateAssignment, deleteAssignment, loading}}>
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
