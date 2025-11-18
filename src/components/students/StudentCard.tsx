// src/components/students/StudentCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Info, GraduationCap, FileText, ExternalLink, Loader2, AlertTriangle, Award, CalendarDays, Clock, Building, Computer } from 'lucide-react';
import { UserData } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import PerformanceHub from '../dashboards/PerformanceHub';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { onSubmissionsForStudent, Submission } from '@/services/submissions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { AwardPointsDialog } from './AwardPointsDialog';


interface StudentCardProps {
  student: UserData;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    value ? (
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-medium capitalize">{value}</p>
        </div>
      </div>
    ) : null
  );

const StudentSubmissions = ({ studentId }: { studentId: string }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const unsubscribe = onSubmissionsForStudent(studentId, (newSubmissions, err) => {
            if (err) {
                setError(err);
                setLoading(false);
                return;
            }
            setSubmissions(newSubmissions);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [studentId]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>A complete history of all work submitted by the student.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4"/>
                        <AlertTitle>Could Not Load Submissions</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Coursework</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length > 0 ? (
                                submissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">{submission.assignmentTitle}</TableCell>
                                        <TableCell><Badge variant="outline">{submission.pointCategory}</Badge></TableCell>
                                        <TableCell>{formatDistanceToNow(submission.submittedAt.toDate(), { addSuffix: true })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={submission.submissionLink} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No submissions yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

export function StudentCard({ student }: StudentCardProps) {
  const router = useRouter();

  const handleSendMessage = () => {
    router.push(`/chat?dm=${student.uid}`);
  };

  return (
    <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          <AvatarImage src={student.photoURL} alt={student.displayName} data-ai-hint="student portrait" />
          <AvatarFallback>{student.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="pt-4">
          <CardTitle>{student.displayName}</CardTitle>
          <CardDescription>{student.gen}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0" />
          <a href={`mailto:${student.email}`} className="truncate hover:underline">
            {student.email}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>{student.schoolId}</span>
        </div>
      </CardContent>
     <CardFooter className="grid grid-cols-1 gap-2">
  <div className="grid grid-cols-2 gap-2">
    <Button variant="outline" onClick={handleSendMessage}>
      <MessageSquare className="mr-2 h-4 w-4" />
      Message
    </Button>
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Info className="mr-2 h-4 w-4" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>{student.displayName}'s Details</DialogTitle>
          <DialogDescription>
            Viewing performance and personal information for {student.displayName}.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="overview" className="flex-grow flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
          <div className="flex-grow overflow-y-auto mt-4 pr-4">
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-6 flex-wrap">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                      <AvatarImage src={student.photoURL} alt={student.displayName} />
                      <AvatarFallback className="text-4xl">
                        {student.displayName ? student.displayName.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 flex-1">
                      <InfoItem icon={GraduationCap} label="Generation" value={student.gen} />
                      <InfoItem icon={Mail} label="Email" value={student.email} />
                      <InfoItem icon={Info} label="School ID" value={student.schoolId} />
                      <InfoItem icon={CalendarDays} label="Lesson Day" value={student.lessonDay} />
                      <InfoItem icon={Clock} label="Lesson Time" value={student.lessonTime} />
                      <InfoItem icon={student.lessonType === 'online' ? Computer : Building} label="Lesson Type" value={student.lessonType} />
                    </div>
                  </div>
                  {student.bio && (
                    <>
                      <Separator className="my-4"/>
                      <div className="space-y-1 pt-2">
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="font-medium italic text-sm">"{student.bio}"</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <PerformanceHub key={student.uid} studentId={student.uid} />
            </TabsContent>
            <TabsContent value="submissions">
              <StudentSubmissions studentId={student.uid} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  </div>
  
  <div className="grid grid-cols-2 gap-2">
    <AwardPointsDialog student={student}>
      <Button variant="secondary" className="w-full">
        <Award className="mr-2 h-4 w-4" />
        Award Points
      </Button>
    </AwardPointsDialog>
    
    <Button 
      variant="default" 
      className="w-full"
      onClick={() => window.location.href = `/reports/${student.uid}`}
    >
      <FileText className="mr-2 h-4 w-4" />
      View Report
    </Button>
  </div>
</CardFooter>
    </Card>
  );
}
