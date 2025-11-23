// src/hooks/useMarkNotificationsOnVisit.ts
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to automatically mark notifications as read when visiting a page
 * Matches notifications based on their href to the current route
 */
export function useMarkNotificationsOnVisit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notifications, markAsRead } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Build the full current URL path with query params
    const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    // Find all notifications that point to the current page
    const relevantNotifications = notifications.filter(notif => {
      if (notif.read) return false; // Skip already read notifications

      // Check if notification href matches current path
      // Handle both exact matches and base path matches
      const notifPath = notif.href;
      
      // Exact match
      if (notifPath === currentPath) return true;
      
      // Base path match (e.g., /chat matches /chat?dm=123)
      if (currentPath.startsWith(notifPath)) return true;
      
      // Query param match (e.g., notification href is /chat?dm=123 and we're on /chat?dm=123)
      if (notifPath.includes('?') && currentPath.includes('?')) {
        const notifBase = notifPath.split('?')[0];
        const currentBase = currentPath.split('?')[0];
        const notifParams = new URLSearchParams(notifPath.split('?')[1]);
        const currentParams = new URLSearchParams(currentPath.split('?')[1]);
        
        // Check if bases match and all notif params are in current params
        if (notifBase === currentBase) {
          let allMatch = true;
          notifParams.forEach((value, key) => {
            if (currentParams.get(key) !== value) {
              allMatch = false;
            }
          });
          if (allMatch) return true;
        }
      }
      
      return false;
    });

    // Mark all relevant notifications as read
    relevantNotifications.forEach(notif => {
      markAsRead(notif.id);
    });
    
    // Small delay to ensure the marking happens after navigation
  }, [pathname, searchParams, notifications, markAsRead, user]);
}

// Export a simpler version for components that just want to mark on mount
export function useMarkNotificationsForPath(path: string) {
  const { notifications, markAsRead } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const relevantNotifications = notifications.filter(notif => {
      return !notif.read && notif.href === path;
    });

    relevantNotifications.forEach(notif => {
      markAsRead(notif.id);
    });
  }, [path, notifications, markAsRead, user]);
}