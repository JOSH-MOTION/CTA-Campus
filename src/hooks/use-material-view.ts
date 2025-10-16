// src/hooks/use-material-view.ts
import { useEffect, useRef, useCallback } from 'react';
import { trackMaterialView, updateMaterialViewCompletion } from '@/services/materials-tracking';

interface UseMaterialViewProps {
  materialId: string;
  subject: string;
  week: string;
  studentId: string;
  studentName: string;
  gen: string;
  onViewComplete?: () => void;
}

/**
 * Hook to track material views with automatic duration tracking
 */
export const useMaterialView = ({
  materialId,
  subject,
  week,
  studentId,
  studentName,
  gen,
  onViewComplete,
}: UseMaterialViewProps) => {
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isTrackingRef = useRef<boolean>(false);

  // Start tracking when component mounts
  useEffect(() => {
    const trackView = async () => {
      try {
        if (isTrackingRef.current) return;
        
        isTrackingRef.current = true;
        const combinedMaterialId = `${subject}-${week}`;
        
        // Track the initial view
        await trackMaterialView(
          combinedMaterialId,
          studentId,
          studentName,
          gen,
          0
        );

        startTimeRef.current = Date.now();
        console.log(`Started tracking material view: ${combinedMaterialId}`);
      } catch (error) {
        console.error('Error tracking material view:', error);
      }
    };

    trackView();

    // Cleanup on unmount
    return () => {
      if (isTrackingRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        console.log(`Material view duration: ${duration} seconds`);
        isTrackingRef.current = false;
      }
    };
  }, [materialId, subject, week, studentId, studentName, gen]);

  // Mark material as completed
  const markAsCompleted = useCallback(async () => {
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Update the view with completion status
      if (viewIdRef.current) {
        await updateMaterialViewCompletion(viewIdRef.current, true, duration);
      }

      if (onViewComplete) {
        onViewComplete();
      }

      console.log(`Material completed after ${duration} seconds`);
    } catch (error) {
      console.error('Error marking material as completed:', error);
    }
  }, [onViewComplete]);

  const getDuration = useCallback(() => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  }, []);

  return {
    markAsCompleted,
    getDuration,
    isTracking: isTrackingRef.current,
  };
};