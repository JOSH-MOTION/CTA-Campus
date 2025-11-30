// src/contexts/ResourcesContext.tsx (MIGRATED TO MONGODB)
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { useAuth } from './AuthContext';

export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  url?: string;
  type: 'Article' | 'Video' | 'Link' | 'Document';
  authorId: string;
  createdAt: string;
}

export type ResourceData = Omit<Resource, 'id' | 'createdAt'>;

interface ResourcesContextType {
  resources: Resource[];
  addResource: (resource: ResourceData) => Promise<void>;
  updateResource: (id: string, updates: Partial<ResourceData>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  loading: boolean;
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(undefined);

export const ResourcesProvider: FC<{children: ReactNode}> = ({children}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  // Fetch resources from MongoDB API
  const fetchResources = useCallback(async () => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/resources');
      const result = await response.json();

      if (result.success) {
        const fetchedResources = result.resources.map((resource: any) => ({
          ...resource,
          id: resource._id,
          createdAt: new Date(resource.createdAt).toISOString(),
        }));
        setResources(fetchedResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  // Initial fetch + polling every 60 seconds (resources change less frequently)
  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 60000);
    return () => clearInterval(interval);
  }, [fetchResources]);

  const addResource = useCallback(async (resource: ResourceData) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resource,
          createdAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create resource');
      }

      await fetchResources();
    } catch (error: any) {
      console.error('Error adding resource:', error);
      throw error;
    }
  }, [user, fetchResources]);

  const updateResource = useCallback(async (id: string, updates: Partial<ResourceData>) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to update resource');
      }

      await fetchResources();
    } catch (error: any) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }, [user, fetchResources]);

  const deleteResource = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete resource');
      }

      await fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  }, [user, fetchResources]);

  return (
    <ResourcesContext.Provider value={{resources, addResource, updateResource, deleteResource, loading}}>
      {children}
    </ResourcesContext.Provider>
  );
};

export const useResources = (): ResourcesContextType => {
  const context = useContext(ResourcesContext);
  if (!context) {
    throw new Error('useResources must be used within a ResourcesProvider');
  }
  return context;
};