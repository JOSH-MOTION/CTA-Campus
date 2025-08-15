import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Badge} from '@/components/ui/badge';
import {FileText, BookOpen, ArrowRight, TrendingUp, CheckCircle, AlertCircle} from 'lucide-react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import type {User} from 'firebase/auth';
import {Progress} from '@/components/ui/progress';
import PerformanceHub from '@/components/dashboards/PerformanceHub';
import WeeklyFocus from './WeeklyFocus';

const recentResources = [
  {title: 'CS101 Syllabus', type: 'PDF', icon: FileText, course: 'Intro to CS'},
  {title: 'Chapter 3 Reading', type: 'Document', icon: BookOpen, course: 'Linear Algebra'},
  {title: 'Lab Safety Guidelines', type: 'PDF', icon: FileText, course: 'Classical Mechanics'},
];

interface StudentDashboardProps {
  user: User | null;
}

export default function StudentDashboard({user}: StudentDashboardProps) {
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
            {recentResources.map((resource, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <resource.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{resource.title}</p>
                  <p className="text-sm text-muted-foreground">{resource.course}</p>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/resources">
                Go to Resource Center
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
