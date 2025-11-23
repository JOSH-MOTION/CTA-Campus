// src/app/ClientLayout.tsx
'use client';

import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { requestNotificationPermission } from '@/lib/firebase-messaging';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading && user) {
      requestNotificationPermission(); // ← Auto-saves FCM token
    }
  }, [user, loading]);

  return <>{children}</>;
}