// src/services/materials-tracking.ts (UPDATED)
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
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

export interface MaterialView {
  id: string;
  materialId: string;
  studentId: string;
  studentName: string;
  gen: string;
  viewedAt: Timestamp;
  duration: number; // in seconds
  completed: boolean;
}

export interface MaterialStatus {
  id: string;
  subject: string;
  week: string;
  gen: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  viewCount: number;
  lastViewedAt?: Timestamp;
}

export type NewMaterialData = Omit<Material, 'id' | 'createdAt'>;

/**
 * Get ordered list of all weeks from roadmap
 */
export const getAllWeeksInOrder = (roadmapData: any[]): Array<{ subject: string; week: string }> => {
  const weeks: Array<{ subject: string; week: string }> = [];
  
  roadmapData.forEach(subject => {
    subject.weeks.forEach((week: any) => {
      weeks.push({
        subject: subject.title,
        week: week.title,
      });
    });
  });

  return weeks;
};

/**
 * Determines which materials should be visible to a student based on roadmap completion
 * FIXED: Only shows materials up to the last completed week + the next incomplete week
 */
export const getUnlockedMaterials = (
  completedWeeks: Set<string>,
  roadmapData: any[],
  materials: Material[]
): Material[] => {
  if (completedWeeks.size === 0 && materials.length === 0) {
    return [];
  }

  // Get all weeks in order from the roadmap
  const allWeeksInOrder = getAllWeeksInOrder(roadmapData);

  const unlockedWeeks = new Set<string>();

  // Find the index of the last completed week
  let lastCompletedIndex = -1;
  allWeeksInOrder.forEach((week, index) => {
    const weekId = `${week.subject}-${week.week}`;
    if (completedWeeks.has(weekId)) {
      lastCompletedIndex = index;
    }
  });

  // Add all weeks up to and including the last completed week
  for (let i = 0; i <= lastCompletedIndex; i++) {
    const week = allWeeksInOrder[i];
    unlockedWeeks.add(`${week.subject}-${week.week}`);
  }

  // If there is a next week after the last completed one, unlock only that one
  if (lastCompletedIndex + 1 < allWeeksInOrder.length) {
    const nextWeek = allWeeksInOrder[lastCompletedIndex + 1];
    unlockedWeeks.add(`${nextWeek.subject}-${nextWeek.week}`);
  }

  // If no weeks are completed, unlock only the first week
  if (lastCompletedIndex === -1 && allWeeksInOrder.length > 0) {
    const firstWeek = allWeeksInOrder[0];
    unlockedWeeks.add(`${firstWeek.subject}-${firstWeek.week}`);
  }

  // Filter materials to only those in unlocked weeks
  return materials.filter(material => {
    const weekId = `${material.subject}-${material.week}`;
    return unlockedWeeks.has(weekId);
  });
};

/**
 * Track when a student views a material
 */
export const trackMaterialView = async (
  materialId: string,
  studentId: string,
  studentName: string,
  gen: string,
  duration: number = 0
) => {
  try {
    await addDoc(collection(db, 'material_views'), {
      materialId,
      studentId,
      studentName,
      gen,
      viewedAt: serverTimestamp(),
      duration,
      completed: false,
    });
  } catch (error) {
    console.error('Error tracking material view:', error);
    throw error;
  }
};

/**
 * Update material view completion
 */
export const updateMaterialViewCompletion = async (
  viewId: string,
  completed: boolean,
  duration: number
) => {
  try {
    const viewRef = doc(db, 'material_views', viewId);
    await updateDoc(viewRef, {
      completed,
      duration,
    });
  } catch (error) {
    console.error('Error updating material view:', error);
    throw error;
  }
};

/**
 * Get material statistics for a teacher
 */
export const getMaterialStatusForGen = async (
  gen: string,
  subject: string,
  week: string
): Promise<MaterialStatus | null> => {
  try {
    const viewsQuery = query(
      collection(db, 'material_views'),
      where('gen', '==', gen),
      where('materialId', '==', `${subject}-${week}`)
    );

    const snapshot = await getDocs(viewsQuery);
    const views = snapshot.docs.map(doc => doc.data());

    if (views.length === 0) {
      return null;
    }

    const latestView = views.reduce((latest, current) =>
      current.viewedAt > latest.viewedAt ? current : latest
    );

    return {
      id: `${subject}-${week}`,
      subject,
      week,
      gen,
      isUnlocked: true,
      isCurrent: false,
      viewCount: views.length,
      lastViewedAt: latestView.viewedAt,
    };
  } catch (error) {
    console.error('Error getting material status:', error);
    throw error;
  }
};

/**
 * Listen to material views for a specific generation in real-time
 */
export const onMaterialViewsForGen = (
  gen: string,
  callback: (views: MaterialView[]) => void
) => {
  try {
    const viewsQuery = query(
      collection(db, 'material_views'),
      where('gen', '==', gen)
    );

    const unsubscribe = onSnapshot(viewsQuery, (snapshot) => {
      const views: MaterialView[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as MaterialView));

      callback(views);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up material views listener:', error);
    return () => {};
  }
};

/**
 * Get current active material for a generation (the material students should see)
 */
export const getCurrentActiveMaterial = async (
  gen: string,
  completedWeeks: Set<string>
): Promise<{ subject: string; week: string } | null> => {
  try {
    // Get the latest view for this generation
    const viewsQuery = query(
      collection(db, 'material_views'),
      where('gen', '==', gen)
    );

    const snapshot = await getDocs(viewsQuery);
    if (snapshot.empty) {
      return null;
    }

    const views = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => b.viewedAt.toDate() - a.viewedAt.toDate());

    if (views.length > 0) {
      const latestMaterial = views[0];
      return {
        subject: latestMaterial.materialId.split('-')[0],
        week: latestMaterial.materialId.split('-')[1],
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current active material:', error);
    return null;
  }
};

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