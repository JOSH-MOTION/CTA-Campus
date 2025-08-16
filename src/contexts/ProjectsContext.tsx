// src/contexts/ProjectsContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Project {
  id: string;
  title: string;
  description: string;
  targetGen: string; // e.g., "Gen 30", "All Students", "Everyone"
  authorId: string;
  createdAt: Timestamp;
}

export type ProjectData = Omit<Project, 'id' | 'createdAt'>;

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: ProjectData) => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  loading: boolean;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: FC<{children: ReactNode}> = ({children}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotificationForGen } = useNotifications();
  const { user, userData, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
        setProjects([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const projectsCol = collection(db, 'projects');
    
    let q;
    if (role === 'teacher' || role === 'admin') {
      q = query(projectsCol, orderBy('createdAt', 'desc'));
    } else if (role === 'student' && userData?.gen) {
      q = query(
        projectsCol,
        where('targetGen', 'in', [userData.gen, 'All Students', 'Everyone']),
        orderBy('createdAt', 'desc')
      );
    } else if (role === 'student' && !userData?.gen) {
        // New student might not have a gen yet, prevent query from running
        setLoading(false);
        return;
    } else {
      q = query(
        projectsCol,
        where('targetGen', '==', 'Everyone'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedProjects = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Project;
        });
        setProjects(fetchedProjects);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching projects:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role, userData, authLoading]);

  const addProject = useCallback(async (project: ProjectData) => {
    if(!user) throw new Error("User not authenticated");
    
    const newProjectData = {
      ...project,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'projects'), newProjectData);
    
    await addNotificationForGen(project.targetGen, {
      title: `New Project: ${project.title}`,
      description: `A new project has been posted.`,
      href: '/projects',
    });
  }, [user, addNotificationForGen]);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectData>) => {
    if (!user) throw new Error("User not authenticated");
    const projectDoc = doc(db, 'projects', id);
    const { id: projectId, ...updateData } = updates as Project;
    await updateDoc(projectDoc, updateData);
  }, [user]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    const projectDoc = doc(db, 'projects', id);
    await deleteDoc(projectDoc);
  }, [user]);

  return (
    <ProjectsContext.Provider value={{projects, addProject, updateProject, deleteProject, loading}}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};
