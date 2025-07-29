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
import { ScrollArea } from './ui/scroll-area';
import { PopoverClose } from '@radix-ui/react-popover';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
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
               <CheckCheck className="mr-2 h-4 w-4"/> Mark all as read
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
                        className="border-b p-4 hover:bg-muted/50 block"
                        onClick={() => { if (!notif.read) markAsRead(notif.id) }}
                        >
                        <div className="flex items-start gap-3">
                            {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
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
                <div className="p-4 text-center text-sm text-muted-foreground">
                    You have no new notifications.
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
