
// src/contexts/ProjectsContext.tsx (MIGRATED TO MONGODB)
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';

export interface Project {
  id: string;
  title: string;
  description: string;
  targetGen: string;
  authorId: string;
  createdAt: string;
}

export type ProjectData = Omit<Project, 'id' | 'createdAt'>;

interface ProjectsContextType {
  projects: Project[];
  addProject: (project: ProjectData, onNotifying?: () => void) => Promise<void>;
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

  const fetchProjects = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      setProjects([]);
      return;
    }

    setLoading(true);
    try {
      let url = '/api/projects';
      if (role === 'student' && userData?.gen) {
        url += `?targetGen=${userData.gen}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const fetchedProjects = result.projects.map((project: any) => ({
          ...project,
          id: project._id,
          createdAt: new Date(project.createdAt).toISOString(),
        }));
        setProjects(fetchedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, role, userData, authLoading]);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  const addProject = useCallback(async (project: ProjectData, onNotifying?: () => void) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...project,
          createdAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      if (onNotifying) onNotifying();

      try {
        await addNotificationForGen(project.targetGen, {
          title: `New Project: ${project.title}`,
          description: project.description,
          href: '/projects',
        }, user.uid);
      } catch (error) {
        console.error("Failed to send project notifications:", error);
      }

      await fetchProjects();
    } catch (error: any) {
      console.error('Error adding project:', error);
      throw error;
    }
  }, [user, addNotificationForGen, fetchProjects]);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectData>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      await fetchProjects();
    } catch (error: any) {
      console.error('Error updating project:', error);
      throw error;
    }
  }, [user, fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      await fetchProjects();
    } catch (error: any) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [user, fetchProjects]);

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