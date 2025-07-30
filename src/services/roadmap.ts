// src/services/roadmap.ts
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    getDoc
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  
  export interface WeekCompletionStatusMap {
    [weekId: string]: { [gen: string]: boolean };
  }
  
  /**
   * Sets up a real-time listener for the roadmap completion status.
   * @param callback - The function to call with the roadmap status map.
   * @returns An unsubscribe function to stop the listener.
   */
  export const onRoadmapStatus = (callback: (status: WeekCompletionStatusMap) => void) => {
    const roadmapStatusCol = collection(db, 'roadmap_status');
    
    const unsubscribe = onSnapshot(roadmapStatusCol, (snapshot) => {
      const status: WeekCompletionStatusMap = {};
      snapshot.docs.forEach(doc => {
        status[doc.id] = doc.data();
      });
      callback(status);
    }, (error) => {
      console.error("Error listening to roadmap status:", error);
    });
  
    return unsubscribe;
  };
  
  /**
   * Sets the completion status for a specific week and generation.
   * @param weekId - The ID of the week to update.
   * @param gen - The generation to update the status for.
   * @param completed - The new completion status (true or false).
   */
  export const setWeekCompletion = async (weekId: string, gen: string, completed: boolean) => {
    try {
      const weekDocRef = doc(db, 'roadmap_status', weekId);
      
      // We use dot notation to update a specific field within the map.
      // This avoids overwriting the entire document.
      await updateDoc(weekDocRef, {
        [gen]: completed
      }).catch(async (error) => {
        // If the document or field doesn't exist, updateDoc fails.
        // We can fallback to set with merge to create it if needed.
        if (error.code === 'not-found') {
            await setDoc(weekDocRef, { [gen]: completed }, { merge: true });
        } else {
            throw error;
        }
      });
    } catch (error) {
      console.error('Error setting week completion:', error);
      throw error;
    }
  };
