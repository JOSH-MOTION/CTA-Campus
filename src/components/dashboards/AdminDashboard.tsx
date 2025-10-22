"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Users,
  BarChart2,
  Megaphone,
  UserCheck,
  Building,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { useAuth, type UserData } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import WeeklyFocus from './WeeklyFocus';
import { useRoadmap } from '@/contexts/RoadmapContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

interface AdminDashboardProps {
  user: User | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { userData, role, fetchAllUsers, allUsers } = useAuth();
  const { setTeacherViewingGen, roadmapData } = useRoadmap();
  const { addNotificationForGen } = useNotifications();

  const [selectedGen, setSelectedGen] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Broadcast form state
  const [target, setTarget] = useState<string>('Everyone');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (allUsers.length === 0) {
          await fetchAllUsers();
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchAllUsers, allUsers.length]);

  const availableGens = useMemo(() => {
    const gens = allUsers
      .filter((u) => u.role === 'student' && u.gen)
      .map((u) => u.gen as string);
    return [...new Set(gens)].sort();
  }, [allUsers]);

  useEffect(() => {
    if (!selectedGen && availableGens.length > 0) {
      setSelectedGen(availableGens[0]);
    }
  }, [availableGens, selectedGen]);

  useEffect(() => {
    if (selectedGen) {
      setTeacherViewingGen(selectedGen);
    }
  }, [selectedGen, setTeacherViewingGen]);

  const stats = useMemo(() => {
    const totalUsers = allUsers.length;
    const students = allUsers.filter((u) => u.role === 'student');
    const teachers = allUsers.filter((u) => u.role === 'teacher');
    const admins = allUsers.filter((u) => u.role === 'admin');
    const gens = new Set(students.map((s) => s.gen).filter(Boolean));
    return {
      totalUsers,
      studentsCount: students.length,
      teachersCount: teachers.length,
      adminsCount: admins.length,
      gensCount: gens.size,
    };
  }, [allUsers]);

  const teachersForGen = useMemo(() => {
    if (!selectedGen) return [] as UserData[];
    return allUsers.filter(
      (u) => u.role === 'teacher' && typeof u.gensTaught === 'string' && u.gensTaught.includes(selectedGen)
    );
  }, [allUsers, selectedGen]);

  const topStudentsInGen = useMemo(() => {
    if (!selectedGen) return [] as UserData[];
    return allUsers
      .filter((u) => u.role === 'student' && u.gen === selectedGen)
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 3);
  }, [allUsers, selectedGen]);

  const sendBroadcast = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await addNotificationForGen(target, {
        title: title.trim(),
        description: message.trim(),
        href: '/announcements',
      }, user?.uid);
      setTitle('');
      setMessage('');
    } finally {
      setSending(false);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={userData?.photoURL || undefined} alt={user?.displayName || 'User'} />
            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.displayName || 'Admin'}!</h1>
            <p className="text-muted-foreground">Oversee cohorts, teachers, and student progress.</p>
          </div>
        </div>

        {availableGens.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Viewing:</p>
            <Select value={selectedGen} onValueChange={setSelectedGen}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a Generation" />
              </SelectTrigger>
              <SelectContent>
                {availableGens.map((gen) => (
                  <SelectItem key={gen} value={gen}>
                    {gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* High-level stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.studentsCount} students • {stats.teachersCount} teachers • {stats.adminsCount} admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Generations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gensCount}</div>
            <p className="text-xs text-muted-foreground">Across all cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachersCount}</div>
            <p className="text-xs text-muted-foreground">Assigned across cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average (sample)</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const studentsInGen = allUsers.filter((u) => u.role === 'student' && (!selectedGen || u.gen === selectedGen));
                const total = studentsInGen.reduce((acc, s) => acc + (s.totalPoints || 0), 0);
                return studentsInGen.length ? (total / studentsInGen.length).toFixed(1) : '0.0';
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Average points {selectedGen ? `in ${selectedGen}` : 'overall'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly focus and teacher progress for selected gen */}
      {selectedGen ? (
        <>
          <WeeklyFocus />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Teachers for {selectedGen}</CardTitle>
                <CardDescription>Assigned staff and cohort context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teachersForGen.length > 0 ? (
                  teachersForGen.map((t) => (
                    <div key={t.uid} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={t.photoURL} alt={t.displayName} />
                        <AvatarFallback>{t.displayName?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{t.displayName}</p>
                        <p className="text-sm text-muted-foreground">Teaches: {t.gensTaught}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No teachers assigned to {selectedGen}.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href="/directory">Go to Staff Directory <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Students in {selectedGen}</CardTitle>
                <CardDescription>Highest total points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topStudentsInGen.length > 0 ? (
                  topStudentsInGen.map((s) => (
                    <div key={s.uid} className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s.photoURL} alt={s.displayName} />
                        <AvatarFallback>{s.displayName?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{s.displayName}</p>
                        <p className="text-sm text-muted-foreground">{s.totalPoints || 0} pts</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No students with points yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">Select a generation to view dashboard.</p>
        </div>
      )}

      {/* Broadcast notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Broadcast a Notification</CardTitle>
          <CardDescription>Send to everyone, staff, students, or a specific cohort.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Everyone">Everyone</SelectItem>
                <SelectItem value="All Students">All Students</SelectItem>
                <SelectItem value="All Staff">All Staff</SelectItem>
                {availableGens.map((gen) => (
                  <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={sendBroadcast} disabled={sending || !title.trim() || !message.trim()} className="w-full md:w-auto">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
            {sending ? 'Sending...' : 'Send Notification'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
