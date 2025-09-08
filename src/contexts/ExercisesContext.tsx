// src/contexts/ExercisesContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  targetGen: string; // e.g., "Gen 30", "All Students", "Everyone"
  authorId: string;
  createdAt: Timestamp;
}

export type ExerciseData = Omit<Exercise, 'id' | 'createdAt'>;

interface ExercisesContextType {
  exercises: Exercise[];
  addExercise: (exercise: ExerciseData) => Promise<void>;
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

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
        setExercises([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const exercisesCol = collection(db, 'exercises');
    
    let q;
    if (role === 'teacher' || role === 'admin') {
      q = query(exercisesCol, orderBy('createdAt', 'desc'));
    } else if (role === 'student' && userData?.gen) {
      q = query(
        exercisesCol,
        where('targetGen', 'in', [userData.gen, 'All Students', 'Everyone']),
        orderBy('createdAt', 'desc')
      );
    } else if (role === 'student' && !userData?.gen) {
        // New student might not have a gen yet, prevent query from running
        setLoading(false);
        return;
    } else {
       q = query(
        exercisesCol,
        where('targetGen', '==', 'Everyone'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedExercises = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Exercise;
        });
        setExercises(fetchedExercises);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching exercises:", error);
        setLoading(false);
    });

    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [user, role, userData, authLoading]);

  const addExercise = useCallback(async (exercise: ExerciseData) => {
    if(!user) throw new Error("User not authenticated");
    
    const newExerciseData = {
      ...exercise,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'exercises'), newExerciseData);
    
    await addNotificationForGen(exercise.targetGen, {
      title: `New Exercise: ${exercise.title}`,
      description: `A new exercise has been posted.`,
      href: '/exercises',
    });
  }, [user, addNotificationForGen]);

  const updateExercise = useCallback(async (id: string, updates: Partial<ExerciseData>) => {
    if (!user) throw new Error("User not authenticated");
    const exerciseDoc = doc(db, 'exercises', id);
    const { id: exerciseId, ...updateData } = updates as Exercise;
    await updateDoc(exerciseDoc, updateData);
  }, [user]);

  const deleteExercise = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    const exerciseDoc = doc(db, 'exercises', id);
    await deleteDoc(exerciseDoc);
  }, [user]);

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
