// src/services/materials-tracking.ts (SIMPLIFIED - ROADMAP-BASED)
// Note: This is simplified. Full implementation would need dedicated API routes
// for material views tracking. For now, we'll keep it lightweight.

export interface MaterialView {
  id: string;
  materialId: string;
  studentId: string;
  studentName: string;
  gen: string;
  viewedAt: string;
  duration: number;
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
  lastViewedAt?: string;
}

/**
 * Track when a student views a material
 * Note: This would ideally have its own API endpoint
 * For now, using a simple in-memory or localStorage approach
 */
export const trackMaterialView = async (
  materialId: string,
  studentId: string,
  studentName: string,
  gen: string,
  duration: number = 0
): Promise<void> => {
  try {
    // In a full implementation, this would call an API endpoint
    // For now, we can log it or store it locally
    console.log('Material view tracked:', {
      materialId,
      studentId,
      duration,
    });
    
    // TODO: Implement API endpoint for material views
    // await fetch('/api/materials/views', {
    //   method: 'POST',
    //   body: JSON.stringify({ materialId, studentId, studentName, gen, duration })
    // });
  } catch (error) {
    console.error('Error tracking material view:', error);
  }
};

/**
 * Update material view completion
 */
export const updateMaterialViewCompletion = async (
  viewId: string,
  completed: boolean,
  duration: number
): Promise<void> => {
  try {
    console.log('Material completion updated:', { viewId, completed, duration });
    // TODO: Implement API endpoint
  } catch (error) {
    console.error('Error updating material view:', error);
  }
};

/**
 * Get unlocked materials based on roadmap completion
 */
export const getUnlockedMaterials = (
  completedWeeks: Set<string>,
  roadmapData: any[],
  materials: Material[]
): Material[] => {
  if (completedWeeks.size === 0 && materials.length === 0) {
    return [];
  }

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
 * Sort materials according to roadmap order
 */
export const sortMaterialsByRoadmap = (
  materials: Material[],
  roadmapData: any[]
): Material[] => {
  const orderMap = createRoadmapOrderMap(roadmapData);
  
  return [...materials].sort((a, b) => {
    const keyA = `${a.subject}-${a.week}`;
    const keyB = `${b.subject}-${b.week}`;
    
    const orderA = orderMap.get(keyA) ?? 999999;
    const orderB = orderMap.get(keyB) ?? 999999;
    
    return orderA - orderB;
  });
};

/**
 * Create a map of subject-week to order index
 */
export const createRoadmapOrderMap = (roadmapData: any[]): Map<string, number> => {
  const orderMap = new Map<string, number>();
  let index = 0;
  
  roadmapData.forEach(subject => {
    subject.weeks.forEach((week: any) => {
      const key = `${subject.title}-${week.title}`;
      orderMap.set(key, index);
      index++;
    });
  });
  
  return orderMap;
};