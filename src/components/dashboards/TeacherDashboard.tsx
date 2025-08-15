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
import {Users, BookOpen, BarChart2, MessageSquare, Group, ArrowRight, Loader2, ListChecks, ExternalLink} from 'lucide-react';
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

interface TeacherDashboardProps {
  user: User | null;
}

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

  const recentSubmissions = useMemo(() => {
    return submissions
      .filter(s => !s.grade)
      .slice(0, 5);
  }, [submissions]);

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
  
  const handleOpenChat = () => {
    if (selectedGen) {
      router.push(`/chat?group=${selectedGen}`);
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card>
            <CardHeader>
            <CardTitle>{selectedGen ? `${selectedGen} Overview` : 'Dashboard'}</CardTitle>
            <CardDescription>
                {selectedGen ? `Key metrics for ${selectedGen}.` : 'Select a generation to view details.'}
            </CardDescription>
            </CardHeader>
            <CardContent>
            {loading ? (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedGen ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Students in Gen</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{allUsers.filter(u => u.role === 'student' && u.gen === selectedGen).length}</div>
                    <p className="text-xs text-muted-foreground">Total students enrolled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{submissions.filter(s => !s.grade).length}</div>
                    <p className="text-xs text-muted-foreground">Across all gens</p>
                    </CardContent>
                </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                    <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">N/A</div>
                    <p className="text-xs text-muted-foreground">(Data not available)</p>
                    </CardContent>
                </Card>
                </div>
            ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'No student generations found.'}</p>
                </div>
            )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Ungraded Submissions</CardTitle>
              <CardDescription>A quick look at the latest work needing your attention.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                ) : recentSubmissions.length > 0 ? (
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
                      {recentSubmissions.map(sub => (
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
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No ungraded submissions.</p>
                )}
            </CardContent>
             <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/submissions">View All Submissions <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-6">
            <WeeklyFocus />
            <Card className="flex flex-col items-center justify-center bg-secondary/50">
                <CardHeader className="items-center pb-2">
                <CardTitle className="text-base font-medium">Group Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                <Group className="h-8 w-8 text-muted-foreground mb-2" />
                <Button onClick={handleOpenChat} disabled={!selectedGen}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open {selectedGen || '...'} Chat
                </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
