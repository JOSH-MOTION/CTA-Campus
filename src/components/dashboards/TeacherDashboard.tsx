// src/components/dashboards/TeacherDashboard.tsx
'use client';

import {useState, useEffect, useMemo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {Users, BookOpen, BarChart2, MessageSquare, Group, ArrowRight, Loader2, ListChecks, ExternalLink, Star, Award, Trophy} from 'lucide-react';
import type {User} from 'firebase/auth';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import { Submission, getAllSubmissions } from '@/services/submissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { GradeSubmissionDialog } from '../submissions/GradeSubmissionDialog';
import WeeklyFocus from './WeeklyFocus';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface TeacherDashboardProps {
  user: User | null;
}

const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export default function TeacherDashboard({user}: TeacherDashboardProps) {
  const {userData, fetchAllUsers} = useAuth();
  const { setTeacherViewingGen } = useRoadmap();
  const [selectedGen, setSelectedGen] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSubmissions = async () => {
    try {
        const subs = await getAllSubmissions();
        setSubmissions(subs);
    } catch (error) {
        console.error("Failed to refresh submissions:", error);
    }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [users, subs] = await Promise.all([
          fetchAllUsers(),
          getAllSubmissions()
        ]);
        setAllUsers(users);
        setSubmissions(subs);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fetchAllUsers]);

  const availableGens = useMemo(() => {
    const taughtGens = userData?.gensTaught?.split(',').map(g => g.trim()).filter(Boolean) || [];
    const studentGens = allUsers.filter(u => u.role === 'student' && u.gen).map(u => u.gen!);
    const allGens = [...new Set([...taughtGens, ...studentGens])];
    return allGens.sort();
  }, [userData?.gensTaught, allUsers]);

  useEffect(() => {
    if (availableGens.length > 0 && !selectedGen) {
      setSelectedGen(availableGens[0]);
    }
  }, [availableGens, selectedGen]);
  
  useEffect(() => {
    if (selectedGen) {
      setTeacherViewingGen(selectedGen);
    }
  }, [selectedGen, setTeacherViewingGen]);

  const { studentsInGen, avgPoints, topStudents, recentSubmissions } = useMemo(() => {
    if (!selectedGen || allUsers.length === 0) {
      return { studentsInGen: 0, avgPoints: 0, topStudents: [], recentSubmissions: [] };
    }

    const genStudents = allUsers.filter(u => u.role === 'student' && u.gen === selectedGen);
    const totalPoints = genStudents.reduce((acc, student) => acc + (student.totalPoints || 0), 0);
    const avgPoints = genStudents.length > 0 ? (totalPoints / genStudents.length).toFixed(1) : '0';
    
    const sortedStudents = [...genStudents].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    const topStudents = sortedStudents.slice(0, 3);
    
    const genStudentIds = new Set(genStudents.map(s => s.uid));
    const recentSubmissions = submissions
      .filter(s => genStudentIds.has(s.studentId) && !s.grade)
      .slice(0, 5);

    return { 
      studentsInGen: genStudents.length, 
      avgPoints: parseFloat(avgPoints), 
      topStudents,
      recentSubmissions,
    };
  }, [selectedGen, allUsers, submissions]);

  
  const handleOpenChat = () => {
    if (selectedGen) {
      router.push(`/chat?group=${selectedGen}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.displayName || 'Teacher'}!</h1>
          <p className="text-muted-foreground">Manage your classes and students.</p>
        </div>
        {availableGens.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Viewing:</p>
            <Select value={selectedGen} onValueChange={setSelectedGen}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a Generation" />
              </SelectTrigger>
              <SelectContent>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen}>
                    {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedGen ? (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Students in Gen" value={studentsInGen} icon={Users} description={`Total students in ${selectedGen}`} />
                <StatCard title="Pending Submissions" value={recentSubmissions.length} icon={BookOpen} description="Needs grading in this gen" />
                <StatCard title="Class Average" value={avgPoints} icon={BarChart2} description="Average points per student" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Ungraded Submissions</CardTitle>
                            <CardDescription>Latest work from {selectedGen} needing your attention.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Assignment</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {recentSubmissions.length > 0 ? recentSubmissions.map(sub => (
                                    <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.studentName}</TableCell>
                                    <TableCell>{sub.assignmentTitle}</TableCell>
                                    <TableCell>{formatDistanceToNow(sub.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        <GradeSubmissionDialog
                                            submission={sub}
                                            onGraded={refreshSubmissions}
                                        >
                                            <Button size="sm">Grade</Button>
                                        </GradeSubmissionDialog>
                                    </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No ungraded submissions for this generation.
                                        </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" asChild>
                                <Link href="/submissions">View All Submissions <ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2"><Trophy className="text-amber-500" /> Top Performers</CardTitle>
                           <CardDescription>Students with the highest points in {selectedGen}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {topStudents.length > 0 ? topStudents.map((student, index) => (
                                <div key={student.uid} className="flex items-center gap-4">
                                    <Badge variant="secondary" className="text-lg">{index + 1}</Badge>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={student.photoURL} alt={student.displayName} />
                                        <AvatarFallback>{student.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold">{student.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{student.totalPoints || 0} points</p>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No student data to display.</p>}
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/rankings">View Full Rankings<ArrowRight className="ml-2 h-4 w-4"/></Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <WeeklyFocus />

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                             <Button onClick={handleOpenChat} disabled={!selectedGen} className="w-full">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Open {selectedGen || '...'} Chat Hub
                            </Button>
                             <Button variant="secondary" className="w-full" asChild>
                                <Link href="/students">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage All Students
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
      ) : (
         <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Select a generation to view dashboard.</p>
        </div>
      )}
    </div>
  );
}
