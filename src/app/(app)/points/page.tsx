// src/app/(app)/points/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { PointEntry, onPointsForStudent, deletePointEntry } from '@/services/points';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function PointsManagementPage() {
  const { fetchAllUsers } = useAuth();
  const [students, setStudents] = useState<UserData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [points, setPoints] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const { toast } = useToast();
  const [pointToDelete, setPointToDelete] = useState<PointEntry | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      const allUsers = await fetchAllUsers();
      const studentUsers = allUsers.filter(u => u.role === 'student');
      setStudents(studentUsers);
      setLoading(false);
    };
    loadStudents();
  }, [fetchAllUsers]);

  useEffect(() => {
    if (!selectedStudentId) {
      setPoints([]);
      return;
    }

    setLoadingPoints(true);
    const unsubscribe = onPointsForStudent(selectedStudentId, (newPoints) => {
      setPoints(newPoints);
      setLoadingPoints(false);
    });

    return () => unsubscribe();
  }, [selectedStudentId]);

  const selectedStudent = useMemo(() => students.find(s => s.uid === selectedStudentId), [students, selectedStudentId]);

  const handleDeletePoint = async () => {
    if (!pointToDelete || !selectedStudentId) return;

    try {
        await deletePointEntry(selectedStudentId, pointToDelete.id);
        toast({
            title: 'Point Entry Deleted',
            description: `The point entry has been removed successfully.`,
        });
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the point entry.',
        });
    } finally {
        setPointToDelete(null);
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Points Management</h1>
        <p className="text-muted-foreground">
          View and manage individual point entries for students.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Student Points Ledger</CardTitle>
              <CardDescription>
                Select a student to view their detailed point history.
              </CardDescription>
            </div>
            <div className="w-full md:w-80">
                <Select onValueChange={setSelectedStudentId} value={selectedStudentId} disabled={loading}>
                    <SelectTrigger>
                        <SelectValue placeholder={loading ? "Loading students..." : "Select a student"} />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(student => (
                            <SelectItem key={student.uid} value={student.uid}>
                                {student.displayName} ({student.gen})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedStudentId ? (
             <div className="flex h-96 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">Please select a student to view their points.</p>
             </div>
          ) : loadingPoints ? (
            <div className="flex h-96 flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Points</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Awarded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {points.length > 0 ? (
                  points.map(point => (
                    <TableRow key={point.id}>
                      <TableCell className="font-bold text-primary">{point.points}</TableCell>
                      <TableCell>{point.reason}</TableCell>
                      <TableCell>
                        {point.awardedAt ? formatDistanceToNow(point.awardedAt.toDate(), { addSuffix: true }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setPointToDelete(point)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      This student has not earned any points yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
     <AlertDialog open={!!pointToDelete} onOpenChange={(open) => !open && setPointToDelete(null)}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this point entry for{' '}
                <span className="font-semibold">{selectedStudent?.displayName}</span>.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePoint}>Delete Point</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
