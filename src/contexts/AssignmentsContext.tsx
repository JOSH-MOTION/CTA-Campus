// src/contexts/AssignmentsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC} from 'react';
import { useNotifications } from './NotificationsContext';

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
}

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
}

const initialAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Final Year Project Proposal',
    description: 'Submit a 2-page proposal for your final year project. Include problem statement, objectives, and proposed methodology.',
    dueDates: [{ day: 'Friday', dateTime: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString() }],
    targetGen: 'All',
  },
  {
    id: '2',
    title: 'JavaScript Algorithm Challenge',
    description: 'Complete the five algorithm challenges on the provided platform. Submit the link to your profile.',
    dueDates: [{ day: 'Wednesday', dateTime: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString() }],
    targetGen: 'All',
  },
];

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const { addNotification } = useNotifications();

  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: (assignments.length + 1).toString(),
    };
    setAssignments(prev => [newAssignment, ...prev]);

     addNotification({
      title: `New Assignment: ${newAssignment.title}`,
      description: `A new assignment has been posted for ${newAssignment.targetGen}.`,
      href: '/assignments',
    });
  };

  return (
    <AssignmentsContext.Provider value={{assignments, addAssignment}}>
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
