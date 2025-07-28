// src/components/students/StudentCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, CalendarPlus, MoreHorizontal, GraduationCap, Info } from 'lucide-react';
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

export function StudentCard({ student }: StudentCardProps) {
  const router = useRouter();

  const handleSendMessage = () => {
    router.push(`/chat?dm=${student.uid}`);
  };

  const handleBookSession = () => {
    // This could be enhanced to pre-fill the staff member if the current user is a teacher
    router.push('/book-session');
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
      <CardFooter className="grid grid-cols-2 gap-2">
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
          <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>{student.displayName}'s Details</DialogTitle>
              <DialogDescription>
                Viewing performance and personal information for {student.displayName}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-4">
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-center">
                                <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                                <AvatarImage src={student.photoURL} alt={student.displayName} />
                                <AvatarFallback className="text-4xl">
                                    {student.displayName ? student.displayName.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                                </Avatar>
                            </div>
                            <Separator/>
                            <InfoItem icon={GraduationCap} label="Generation" value={student.gen} />
                            <InfoItem icon={Mail} label="Email" value={student.email} />
                            <InfoItem icon={Info} label="School ID" value={student.schoolId} />
                            <InfoItem icon={Info} label="Lesson Day" value={student.lessonDay} />
                            <InfoItem icon={Info} label="Lesson Type" value={student.lessonType} />
                            {student.bio && (
                                <>
                                 <Separator />
                                <div className="space-y-1 pt-2">
                                    <p className="text-sm text-muted-foreground">Bio</p>
                                    <p className="font-medium italic text-sm">"{student.bio}"</p>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <PerformanceHub studentId={student.uid} />
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
