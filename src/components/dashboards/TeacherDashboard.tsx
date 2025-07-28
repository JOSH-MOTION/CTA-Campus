// src/components/dashboards/TeacherDashboard.tsx
'use client';

import {useState, useEffect, useMemo} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Users, BookOpen, BarChart2, MessageSquare, Group} from 'lucide-react';
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

interface TeacherDashboardProps {
  user: User | null;
}

export default function TeacherDashboard({user}: TeacherDashboardProps) {
  const {userData, fetchAllUsers} = useAuth();
  const [selectedGen, setSelectedGen] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const users = await fetchAllUsers();
      setAllUsers(users);
      setLoading(false);
    }
    loadUsers();
  }, [fetchAllUsers]);

  const availableGens = useMemo(() => {
    const taughtGens = userData?.gensTaught?.split(',').map(g => g.trim()).filter(Boolean) || [];
    const studentGens = allUsers.filter(u => u.role === 'student' && u.gen).map(u => u.gen!);
    const allGens = [...new Set([...taughtGens, ...studentGens])];
    return allGens.sort();
  }, [userData?.gensTaught, allUsers]);

  const studentsInSelectedGen = useMemo(() => {
    if (!selectedGen) return [];
    return allUsers.filter(u => u.role === 'student' && u.gen === selectedGen);
  }, [allUsers, selectedGen]);

  useEffect(() => {
    if (availableGens.length > 0 && !selectedGen) {
      setSelectedGen(availableGens[0]);
    }
  }, [availableGens, selectedGen]);

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

      <Card>
        <CardHeader>
          <CardTitle>{selectedGen ? `${selectedGen} Overview` : 'Dashboard'}</CardTitle>
          <CardDescription>
            {selectedGen ? `Key metrics for ${selectedGen}.` : 'Select a generation to view details.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedGen ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students in Gen</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : studentsInSelectedGen.length}</div>
                  <p className="text-xs text-muted-foreground">Total students enrolled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-xs text-muted-foreground">(Data not yet available)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">(Data not yet available)</p>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center justify-center bg-secondary/50">
                <CardHeader className="items-center pb-2">
                  <CardTitle className="text-base font-medium">Group Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <Group className="h-8 w-8 text-muted-foreground mb-2" />
                  <Button onClick={handleOpenChat}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open {selectedGen} Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">{loading ? 'Loading...' : 'No student generations found.'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>New assignments waiting for your review across all generations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>A list of recent submissions would go here. (Data not yet available)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
