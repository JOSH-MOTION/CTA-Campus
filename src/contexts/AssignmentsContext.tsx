// src/contexts/AssignmentsContext.tsx (MIGRATED TO MONGODB)
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

export interface AssignmentDueDate {
  day: string;
  dateTime: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDates: AssignmentDueDate[];
  targetGen: string;
  authorId: string;
  subject?: string;
  week?: string;
  createdAt: string;
}

export type AssignmentData = Omit<Assignment, 'id' | 'createdAt'>;

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: AssignmentData, onNotifying?: () => void) => Promise<void>;
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

  // Fetch assignments from MongoDB API
  const fetchAssignments = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setAssignments([]);
      return;
    }

    setLoading(true);
    try {
      let url = '/api/assignments';
      
      // Filter by role
      if (role === 'student' && userData?.gen) {
        url += `?targetGen=${userData.gen}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const fetchedAssignments = result.assignments.map((assignment: any) => ({
          ...assignment,
          id: assignment._id,
          createdAt: new Date(assignment.createdAt).toISOString(),
          dueDates: assignment.dueDates.map((dd: any) => ({
            day: dd.day,
            dateTime: new Date(dd.dateTime).toISOString(),
          })),
        }));
        setAssignments(fetchedAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, userData, authLoading]);

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    fetchAssignments();
    const interval = setInterval(fetchAssignments, 30000);
    return () => clearInterval(interval);
  }, [fetchAssignments]);

  const addAssignment = useCallback(async (assignment: AssignmentData, onNotifying?: () => void) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignment,
          createdAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create assignment');
      }

      // Notify callback
      if (onNotifying) {
        onNotifying();
      }

      // Send notifications
      try {
        await addNotificationForGen(assignment.targetGen, {
          title: `New Assignment: ${assignment.title}`,
          description: assignment.description,
          href: '/assignments',
        }, user.uid);
      } catch (error) {
        console.error("Failed to send assignment notifications:", error);
      }

      // Refresh list
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error adding assignment:', error);
      throw error;
    }
  }, [user, addNotificationForGen, fetchAssignments]);

  const updateAssignment = useCallback(async (id: string, updates: Partial<AssignmentData>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update assignment');
      }

      await fetchAssignments();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }, [user, fetchAssignments]);

  const deleteAssignment = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete assignment');
      }

      await fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  }, [user, fetchAssignments]);

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