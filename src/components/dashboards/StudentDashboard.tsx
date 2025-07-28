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

const upcomingClasses = [
  {time: '09:00 AM', course: 'CS101: Intro to Computer Science', room: 'Hall A', type: 'Lecture'},
  {time: '11:00 AM', course: 'MA203: Linear Algebra', room: 'Room 301', type: 'Class'},
  {time: '02:00 PM', course: 'PHY201: Classical Mechanics', room: 'Lab B', type: 'Lab'},
];

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

      <PerformanceHub />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Here are your upcoming classes for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingClasses.map(item => (
                  <TableRow key={item.course}>
                    <TableCell className="font-medium">{item.time}</TableCell>
                    <TableCell>{item.course}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.room}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/timetable">
                View Full Timetable <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

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
