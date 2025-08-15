// src/app/(app)/students/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Award, Loader2, Search, Trophy } from 'lucide-react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface StudentDetail extends UserData {
  totalPoints: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function StudentsPage() {
  const { fetchAllStudents } = useAuth();
  const [studentDetails, setStudentDetails] = useState<StudentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const students = await fetchAllStudents();
        const details = students.map(student => ({
            ...student,
            totalPoints: student.totalPoints || 0
        }));
        setStudentDetails(details);
      } catch (error) {
        console.error("Failed to load rankings data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAllStudents]);

  const availableGens = useMemo(() => {
    const gens = new Set(studentDetails.map(student => student.gen).filter(Boolean));
    return ['all', ...Array.from(gens).sort()];
  }, [studentDetails]);

  const rankedStudents = useMemo(() => {
    const filtered = studentDetails.filter(student => {
      const matchesSearch = student.displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGen = selectedGen === 'all' || student.gen === selectedGen;
      return matchesSearch && matchesGen;
    });

    return filtered
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((student, index) => ({
            ...student,
            rank: index + 1,
        }));
  }, [studentDetails, searchTerm, selectedGen]);
  
  const chartData = useMemo(() => {
      return rankedStudents.map(student => ({
          name: student.displayName,
          value: student.totalPoints,
      }));
  }, [rankedStudents]);


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Student Rankings</h1>
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
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Bar chart showing all students based on total points. Filter by generation or search by name.</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ChartContainer config={{}} className="w-full h-[500px]">
                        <ResponsiveContainer width="99%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                    width={120}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Student
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {payload[0].payload.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Points
                                                            </span>
                                                            <span className="font-bold">
                                                                {payload[0].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" background={{ fill: 'hsl(var(--muted) / 0.5)' }} radius={4}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                        No students found for the current filter.
                    </div>
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}
