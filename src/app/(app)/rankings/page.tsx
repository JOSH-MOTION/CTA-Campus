// src/app/(app)/rankings/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Award, Loader2, Search, Trophy } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StudentRank extends UserData {
  rank: number;
  totalPoints: number;
  maxPoints: number;
  progress: number;
}

// Mock function to generate points for students
const generateMockPoints = (studentId: string) => {
    // Simple hash to get a consistent "random" number
    let hash = 0;
    for (let i = 0; i < studentId.length; i++) {
        const char = studentId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 200) + 50; // Points between 50 and 250
};

const MAX_POINTS = 286; // Sum of all points from grading data

export default function RankingsPage() {
  const { fetchAllUsers } = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      setAllUsers(users);
      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers]);

  const allStudents = useMemo(() => allUsers.filter(u => u.role === 'student'), [allUsers]);

  const availableGens = useMemo(() => {
    const gens = new Set(allStudents.map(student => student.gen).filter(Boolean));
    return ['all', ...Array.from(gens).sort()];
  }, [allStudents]);

  const rankedStudents = useMemo(() => {
    const filtered = allStudents.filter(student => {
      const matchesSearch = student.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGen = selectedGen === 'all' || student.gen === selectedGen;
      return matchesSearch && matchesGen;
    });

    const studentsWithPoints = filtered.map(student => {
        const totalPoints = generateMockPoints(student.uid);
        return {
            ...student,
            totalPoints,
            maxPoints: MAX_POINTS,
            progress: (totalPoints / MAX_POINTS) * 100
        }
    });

    return studentsWithPoints
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((student, index) => ({
            ...student,
            rank: index + 1,
        }));
  }, [allStudents, searchTerm, selectedGen]);
  
  const topThree = rankedStudents.slice(0, 3);
  const otherStudents = rankedStudents.slice(3);

  const getTrophyColor = (rank: number) => {
      if (rank === 1) return "text-yellow-500";
      if (rank === 2) return "text-gray-400";
      if (rank === 3) return "text-yellow-700";
      return "text-muted-foreground";
  }


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Class Rankings</h1>
        <p className="text-muted-foreground">Leaderboard of student performance based on total points.</p>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Filter by Gen:</p>
            <Select value={selectedGen} onValueChange={setSelectedGen}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select a Generation" />
              </SelectTrigger>
              <SelectContent>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen} className="capitalize">{gen}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
            {/* Top 3 */}
            <div className="grid gap-6 md:grid-cols-3">
                {topThree.map((student, index) => (
                    <Card key={student.uid} className={`border-2 ${index === 0 ? 'border-yellow-500' : index === 1 ? 'border-gray-400' : 'border-yellow-700'}`}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Trophy className={`h-8 w-8 ${getTrophyColor(student.rank)}`} />
                            <div>
                                <CardTitle className="text-lg">{student.displayName}</CardTitle>
                                <CardDescription>{student.gen}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-bold">{student.totalPoints}</p>
                            <p className="text-sm text-muted-foreground">Total Points</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Other students */}
            <Card>
                <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                    <CardDescription>Full list of student rankings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead className="hidden sm:table-cell">Generation</TableHead>
                                <TableHead className="w-[150px] hidden md:table-cell">Progress</TableHead>
                                <TableHead className="text-right">Total Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {otherStudents.map(student => (
                                <TableRow key={student.uid}>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-lg">{student.rank}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={student.photoURL} alt={student.displayName} />
                                                <AvatarFallback>{student.displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{student.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{student.gen}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Progress value={student.progress} className="h-2"/>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{student.totalPoints}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {rankedStudents.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No students found for the current filter.
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
      )}
    </div>
  );
}
