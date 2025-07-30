// src/contexts/ResourcesContext.tsx
'use client';

import {createContext, useContext, useState, ReactNode, FC, useEffect, useCallback} from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string; // The full text content for the summarizer
  url?: string; // Optional link to the resource
  type: 'Article' | 'Video' | 'Link' | 'Document';
  authorId: string;
  createdAt: Timestamp;
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
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const resourcesCol = collection(db, 'resources');
    const q = query(resourcesCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedResources = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
            } as Resource;
        });
        setResources(fetchedResources);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching resources:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addResource = useCallback(async (resource: ResourceData) => {
    if(!user) throw new Error("User not authenticated");
    
    const newResourceData = {
      ...resource,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'resources'), newResourceData);
  }, [user]);

  const updateResource = useCallback(async (id: string, updates: Partial<ResourceData>) => {
    if (!user) throw new Error("User not authenticated");
    const resourceDoc = doc(db, 'resources', id);
    await updateDoc(resourceDoc, updates);
  }, [user]);

  const deleteResource = useCallback(async (id: string) => {
    if (!user) throw new Error("User not authenticated");
    const resourceDoc = doc(db, 'resources', id);
    await deleteDoc(resourceDoc);
  }, [user]);

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
