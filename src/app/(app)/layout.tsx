
// src/app/(app)/layout.tsx
'use client';

import {AIAssistant} from '@/components/AIAssistant';
import {SidebarNav} from '@/components/SidebarNav';
import {ThemeToggle} from '@/components/ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import type {ReactNode} from 'react';
import React, {memo} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {RoadmapProvider} from '@/contexts/RoadmapContext';
import {AnnouncementsProvider} from '@/contexts/AnnouncementsContext';
import {AssignmentsProvider} from '@/contexts/AssignmentsContext';
import {NotificationsProvider} from '@/contexts/NotificationsContext';
import {ExercisesProvider} from '@/contexts/ExercisesContext';
import {ProjectsProvider} from '@/contexts/ProjectsContext';
import {ResourcesProvider} from '@/contexts/ResourcesContext';
import { BookingsProvider } from '@/contexts/BookingsContext';
import {useRouter, usePathname} from 'next/navigation';
import {useEffect} from 'react';
import {auth} from '@/lib/firebase';
import {onAuthStateChanged} from 'firebase/auth';
import {adminNavItems, studentNavItems, teacherNavItems} from '@/components/SidebarNav';
import {Button} from '@/components/ui/button';
import {User} from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { School } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MemoizedProtectedLayout = memo(function ProtectedLayout({children}: {children: ReactNode}) {
  const {user, userData, role, loading} = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run the redirection logic once the initial loading is complete.
    if (loading) {
      return;
    }

    // If loading is finished and there's still no user, redirect to login.
    if (!user) {
      router.push('/login');
      return;
    }

    // If a user exists, check their role and path permissions.
    let allowedPaths: string[] = [];
    switch (role) {
      case 'student':
        allowedPaths = studentNavItems.map(item => item.href);
        break;
      case 'teacher':
        allowedPaths = teacherNavItems.map(item => item.href);
        break;
      case 'admin':
        allowedPaths = adminNavItems.map(item => item.href);
        break;
    }
    
    // Allow access to grading page for teachers only; attendance for teachers and admins
    if (role === 'teacher') {
        if (!allowedPaths.includes('/grading')) {
            allowedPaths.push('/grading');
        }
    }
    if (role === 'teacher' || role === 'admin')) {
        if (!allowedPaths.includes('/attendance')) {
            allowedPaths.push('/attendance');
        }
    }

    // Allow access to profile page for all roles
    if (!allowedPaths.includes('/profile')) {
      allowedPaths.push('/profile');
    }

    // Allow access to chat page for all roles
    if (!allowedPaths.includes('/chat')) {
      allowedPaths.push('/chat');
    }

    const isAllowed = allowedPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));

    if (!isAllowed) {
      // Redirect to the role's default dashboard page if current path is not allowed
      router.push('/'); 
    }
  }, [user, role, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <School className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  const isChatPage = pathname === '/chat';
  
  if(isChatPage) {
    return (
        <NotificationsProvider>
         {children}
        </NotificationsProvider>
    )
  }

  return (
    <NotificationsProvider>
      <BookingsProvider>
        <RoadmapProvider>
          <AnnouncementsProvider>
            <AssignmentsProvider>
              <ExercisesProvider>
                <ProjectsProvider>
                  <ResourcesProvider>
                  <SidebarProvider>
                    <Sidebar>
                      <SidebarContent className="p-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <School className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-semibold">Campus Compass</h1>
                          </div>
                        </div>
                        <SidebarNav />
                      </SidebarContent>
                    </Sidebar>
                    <SidebarInset className="flex flex-col">
                      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                        <SidebarTrigger className="md:hidden" />
                        <div className="ml-auto flex items-center gap-2">
                          <ThemeToggle />
                          <NotificationBell />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={userData?.photoURL || undefined} alt={user?.displayName || 'User'} />
                                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <DropdownMenuLabel>
                                  <p>{userData?.displayName}</p>
                                  <p className="text-xs text-muted-foreground font-normal">{userData?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href="/profile">Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => auth.signOut()}>
                                  Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </header>
                      <main className={cn('flex-1 flex flex-col', !isChatPage && 'p-4 sm:p-6 overflow-y-auto')}>
                        {children}
                      </main>
                      <AIAssistant />
                    </SidebarInset>
                  </SidebarProvider>
                </ResourcesProvider>
              </ProjectsProvider>
            </ExercisesProvider>
          </AssignmentsProvider>
        </AnnouncementsProvider>
      </RoadmapProvider>
      </BookingsProvider>
    </NotificationsProvider>
  );
});

export default function AppLayout({children}: {children: ReactNode}) {
  return <MemoizedProtectedLayout>{children}</MemoizedProtectedLayout>;
}
