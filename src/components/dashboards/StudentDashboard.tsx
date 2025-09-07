// src/components/dashboards/StudentDashboard.tsx
'use client'

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Video, Link as LinkIcon, Loader2, ArrowRight, CalendarDays, Clock, Computer, Building } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { User } from 'firebase/auth';
import PerformanceHub from '@/components/dashboards/PerformanceHub';
import WeeklyFocus from './WeeklyFocus';
import { useResources } from '@/contexts/ResourcesContext';
import type { Resource } from '@/contexts/ResourcesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const resourceIcons = {
  Article: FileText,
  Document: BookOpen,
  Video: Video,
  Link: LinkIcon,
};

interface StudentDashboardProps {
  user: User | null;
}

const ScheduleCard = () => {
    const { userData } = useAuth();
    if (!userData?.lessonDay) {
        return null;
    }
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>My Schedule</CardTitle>
                <CardDescription>Your weekly lesson details.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Day</p>
                        <p className="text-lg font-semibold">{userData.lessonDay}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Time</p>
                        <p className="text-lg font-semibold">{userData.lessonTime}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 col-span-2">
                    {userData.lessonType === 'online' ? <Computer className="h-6 w-6 text-muted-foreground" /> : <Building className="h-6 w-6 text-muted-foreground" />}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-lg font-semibold capitalize">{userData.lessonType}</p>
                    </div>
                </div>
            </CardContent>
             <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                    <Link href="/profile">
                        Change Schedule
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function StudentDashboard({user}: StudentDashboardProps) {
  const { resources, loading: resourcesLoading } = useResources();
  const { userData } = useAuth();

  const recentResources = useMemo(() => {
    return resources.slice(0, 3);
  }, [resources]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={userData?.photoURL || undefined} alt={user?.displayName || 'User'} />
            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || 'Student'}!</h1>
            <p className="text-muted-foreground">Here's your overview for today.</p>
        </div>
      </div>

      <WeeklyFocus />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <PerformanceHub />
        </div>
        <div className="space-y-6">
            <ScheduleCard />
            <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Recent Resources</CardTitle>
                <CardDescription>Quick access to recently added materials.</CardDescription>
            </CardHeader>
            <CardContent className="grid flex-1 gap-4">
                {resourcesLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                ) : recentResources.length > 0 ? (
                recentResources.map((resource: Resource) => {
                    const Icon = resourceIcons[resource.type] || BookOpen;
                    return (
                    <div key={resource.id} className="flex items-center gap-4">
                        <div className="rounded-lg bg-muted p-3">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-sm text-muted-foreground">
                            <Badge variant="secondary">{resource.type}</Badge>
                        </p>
                        </div>
                    </div>
                    );
                })
                ) : (
                <p className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                    No resources have been added yet.
                </p>
                )}
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                <Link href="/resources">
                    Go to Resource Center <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                </Button>
            </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
