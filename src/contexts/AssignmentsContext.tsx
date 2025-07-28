// src/contexts/AssignmentsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC} from 'react';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  targetGen: string; // e.g., "Gen 30" or "All"
}

interface AssignmentsContextType {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'dueDate'> & {dueDate: Date}) => void;
}

const initialAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Final Year Project Proposal',
    description: 'Submit a 2-page proposal for your final year project. Include problem statement, objectives, and proposed methodology.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    targetGen: 'All',
  },
  {
    id: '2',
    title: 'JavaScript Algorithm Challenge',
    description: 'Complete the five algorithm challenges on the provided platform. Submit the link to your profile.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    targetGen: 'All',
  },
];

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);

  const addAssignment = (assignment: Omit<Assignment, 'id' | 'dueDate'> & {dueDate: Date}) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: (assignments.length + 1).toString(),
      dueDate: assignment.dueDate.toISOString(),
    };
    setAssignments(prev => [newAssignment, ...prev]);
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
