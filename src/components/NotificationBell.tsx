// src/components/NotificationBell.tsx
'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/contexts/NotificationsContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PopoverClose } from '@radix-ui/react-popover';
import { useEffect, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase-messaging';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const hasUnread = unreadCount > 0;
  const previousUnreadCount = useRef(unreadCount);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load your beautiful Mixkit sound
  useEffect(() => {
    audioRef.current = new Audio('/mixkit-software-interface-start-2574.wav');
    audioRef.current.volume = 0.9;
  }, []);

  const playSound = () => {
    audioRef.current && (audioRef.current.currentTime = 0);
    audioRef.current?.play().catch(() => {});
  };

  // Request permission once (only asks the first time)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // In-app sound when tab is active
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current !== 0) {
      playSound();
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Foreground push messages (when app is open) — still play your sound
 // Inside NotificationBell.tsx
useEffect(() => {
  onForegroundMessage(() => {
    playSound();
    // You can also trigger a refetch of notifications here if you want
  });
}, []); // ← no cleanup needed anymore

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUnread) markAllAsRead();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span
              onClick={handleBadgeClick}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white cursor-pointer hover:bg-red-600 transition-colors"
              title="Click to mark all as read"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <PopoverClose asChild key={notif.id}>
                  <Link
                    href={notif.href}
                    className="border-b p-4 hover:bg-muted/50 block transition-colors"
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.read && (
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm leading-tight">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">{notif.description}</p>
                        <p className="text-xs text-muted-foreground/80">
                          {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </PopoverClose>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">No new notifications</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}