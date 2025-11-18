// src/app/(app)/reports/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search, Loader2, TrendingUp, TrendingDown, Users, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StudentReportSummary {
  studentId: string;
  studentName: string;
  gen: string;
  email: string;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  photoURL?: string;
}

export default function ReportsListPage() {
  const router = useRouter();
  const { fetchAllStudents, role } = useAuth();
  const [students, setStudents] = useState<StudentReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'percentage'>('name');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allStudents = await fetchAllStudents();
      const summaries: StudentReportSummary[] = allStudents.map(student => ({
        studentId: student.uid,
        studentName: student.displayName || 'Unknown',
        gen: student.gen || 'Unknown',
        email: student.email || '',
        totalPoints: student.totalPoints || 0,
        maxPoints: 291,
        percentage: Math.round(((student.totalPoints || 0) / 291) * 100),
        photoURL: student.photoURL,
      }));
      setStudents(summaries);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableGens = useMemo(() => {
    const gens = students
      .map(student => student.gen)
      .filter((gen): gen is string => Boolean(gen));
    const uniqueGens = Array.from(new Set(gens)).sort();
    return ['all', ...uniqueGens];
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = student.studentName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesGen = selectedGen === 'all' || student.gen === selectedGen;
      return matchesSearch && matchesGen;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'points':
          return b.totalPoints - a.totalPoints;
        case 'percentage':
          return b.percentage - a.percentage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [students, searchTerm, selectedGen, sortBy]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-700 border-green-200';
    if (percentage >= 75) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (percentage >= 40) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 90) return 'High';
    if (percentage >= 75) return 'Above Average';
    if (percentage >= 60) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Low';
  };

  const getPerformanceIcon = (percentage: number) => {
    return percentage >= 60 ? TrendingUp : TrendingDown;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Student Reports</h1>
        <p className="text-muted-foreground">
          View and manage comprehensive performance reports for all students.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Generation Filter */}
            <Select value={selectedGen} onValueChange={setSelectedGen}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Generation" />
              </SelectTrigger>
              <SelectContent>
                {availableGens.map(gen => (
                  <SelectItem key={gen} value={gen}>
                    {gen === 'all' ? 'All Generations' : gen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="points">Total Points</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              Showing {filteredAndSortedStudents.length} of {students.length} students
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Student Reports Grid */}
      {filteredAndSortedStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              No students found matching your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStudents.map((student) => {
            const PerformanceIcon = getPerformanceIcon(student.percentage);
            
            return (
              <Card
                key={student.studentId}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/reports/${student.studentId}`)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={student.photoURL} alt={student.studentName} />
                      <AvatarFallback className="text-lg">
                        {student.studentName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{student.studentName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline">{student.gen}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Badge */}
                  <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${getPerformanceColor(student.percentage)}`}>
                    <div className="flex items-center gap-2">
                      <PerformanceIcon className="h-5 w-5" />
                      <span className="font-semibold">{getPerformanceLabel(student.percentage)}</span>
                    </div>
                    <span className="text-2xl font-bold">{student.percentage}%</span>
                  </div>

                  {/* Points */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Points</span>
                      <span className="font-semibold">{student.totalPoints}/{student.maxPoints}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          student.percentage >= 75 ? 'bg-green-500' :
                          student.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(student.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Button className="w-full" variant="default">
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}