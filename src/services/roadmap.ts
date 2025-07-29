// src/services/roadmap.ts
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  
  export interface WeekCompletionStatus {
    [weekId: string]: boolean;
  }
  
  /**
   * Sets up a real-time listener for the roadmap completion status.
   * @param callback - The function to call with the roadmap status.
   * @returns An unsubscribe function to stop the listener.
   */
  export const onRoadmapStatus = (callback: (status: WeekCompletionStatus) => void) => {
    const roadmapStatusCol = collection(db, 'roadmap_status');
    
    const unsubscribe = onSnapshot(roadmapStatusCol, (snapshot) => {
      const status: WeekCompletionStatus = {};
      snapshot.docs.forEach(doc => {
        status[doc.id] = doc.data().completed;
      });
      callback(status);
    }, (error) => {
      console.error("Error listening to roadmap status:", error);
    });
  
    return unsubscribe;
  };
  
  /**
   * Sets the completion status for a specific week.
   * @param weekId - The ID of the week to update.
   * @param completed - The new completion status (true or false).
   */
  export const setWeekCompletion = async (weekId: string, completed: boolean) => {
    try {
      const weekDocRef = doc(db, 'roadmap_status', weekId);
      await setDoc(weekDocRef, { completed });
    } catch (error) {
      console.error('Error setting week completion:', error);
      throw error;
    }
  };
  