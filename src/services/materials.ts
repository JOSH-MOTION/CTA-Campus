// src/services/materials.ts
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc,
  } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Material {
    id: string;
    title: string;
    videoUrl?: string;
    slidesUrl?: string;
    subject: string;
    week: string;
    createdAt: Timestamp;
}

export type NewMaterialData = Omit<Material, 'id' | 'createdAt'>;

export const addMaterial = async (data: NewMaterialData) => {
    const newMaterial = {
      ...data,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'materials'), newMaterial);
};

export const updateMaterial = async (id: string, updates: Partial<NewMaterialData>) => {
    const materialDoc = doc(db, 'materials', id);
    await updateDoc(materialDoc, updates);
};

export const deleteMaterial = async (id: string) => {
    const materialDoc = doc(db, 'materials', id);
    await deleteDoc(materialDoc);
};
