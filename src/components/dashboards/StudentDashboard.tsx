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
import { FileText, BookOpen, Video, Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { User } from 'firebase/auth';
import PerformanceHub from '@/components/dashboards/PerformanceHub';
import WeeklyFocus from './WeeklyFocus';
import { useResources } from '@/contexts/ResourcesContext';
import type { Resource } from '@/contexts/ResourcesContext';

const resourceIcons = {
  Article: FileText,
  Document: BookOpen,
  Video: Video,
  Link: LinkIcon,
};

interface StudentDashboardProps {
  user: User | null;
}

export default function StudentDashboard({user}: StudentDashboardProps) {
  const { resources, loading: resourcesLoading } = useResources();

  const recentResources = useMemo(() => {
    return resources.slice(0, 3);
  }, [resources]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName || 'Student'}!</h1>
        <p className="text-muted-foreground">Here's your overview for today.</p>
      </div>

      <WeeklyFocus />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <PerformanceHub />
        </div>
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
  );
}
