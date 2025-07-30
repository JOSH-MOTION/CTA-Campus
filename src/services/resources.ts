// src/services/resources.ts
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
  } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ResourceData } from '@/contexts/ResourcesContext';

export const addResource = async (data: ResourceData) => {
    const newResource = {
      ...data,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'resources'), newResource);
};

export const updateResource = async (id: string, updates: Partial<ResourceData>) => {
    const resourceDoc = doc(db, 'resources', id);
    await updateDoc(resourceDoc, updates);
};

export const deleteResource = async (id: string) => {
    const resourceDoc = doc(db, 'resources', id);
    await deleteDoc(resourceDoc);
};
