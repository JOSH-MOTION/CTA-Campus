// src/contexts/ExercisesContext.tsx (MIGRATED TO MONGODB)
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  targetGen: string;
  authorId: string;
  subject?: string;
  week?: string;
  createdAt: string;
}

export type ExerciseData = Omit<Exercise, 'id' | 'createdAt'>;

interface ExercisesContextType {
  exercises: Exercise[];
  addExercise: (exercise: ExerciseData, onNotifying?: () => void) => Promise<void>;
  updateExercise: (id: string, updates: Partial<ExerciseData>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  loading: boolean;
}

const ExercisesContext = createContext<ExercisesContextType | undefined>(undefined);

export const ExercisesProvider: FC<{children: ReactNode}> = ({children}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotificationForGen } = useNotifications();
  const { user, userData, role, loading: authLoading } = useAuth();

  const fetchExercises = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setExercises([]);
      return;
    }

    setLoading(true);
    try {
      let url = '/api/exercises';
      if (role === 'student' && userData?.gen) {
        url += `?targetGen=${userData.gen}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const fetchedExercises = result.exercises.map((exercise: any) => ({
          ...exercise,
          id: exercise._id,
          createdAt: new Date(exercise.createdAt).toISOString(),
        }));
        setExercises(fetchedExercises);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, userData, authLoading]);

  useEffect(() => {
    fetchExercises();
    const interval = setInterval(fetchExercises, 30000);
    return () => clearInterval(interval);
  }, [fetchExercises]);

  const addExercise = useCallback(async (exercise: ExerciseData, onNotifying?: () => void) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exercise,
          createdAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      if (onNotifying) onNotifying();

      try {
        await addNotificationForGen(exercise.targetGen, {
          title: `New Exercise: ${exercise.title}`,
          description: exercise.description,
          href: '/exercises',
        }, user.uid);
      } catch (error) {
        console.error("Failed to send exercise notifications:", error);
      }

      await fetchExercises();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      throw error;
    }
  }, [user, addNotificationForGen, fetchExercises]);

  const updateExercise = useCallback(async (id: string, updates: Partial<ExerciseData>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      await fetchExercises();
    } catch (error: any) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }, [user, fetchExercises]);

  const deleteExercise = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      await fetchExercises();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }, [user, fetchExercises]);

  return (
    <ExercisesContext.Provider value={{exercises, addExercise, updateExercise, deleteExercise, loading}}>
      {children}
    </ExercisesContext.Provider>
  );
};

export const useExercises = (): ExercisesContextType => {
  const context = useContext(ExercisesContext);
  if (!context) {
    throw new Error('useExercises must be used within an ExercisesProvider');
  }
  return context;
};
