// src/components/teachers/TeacherCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Info, Github, Linkedin } from 'lucide-react';
import { UserData } from '@/contexts/AuthContext';
import { Badge } from '../ui/badge';

interface TeacherCardProps {
  teacher: UserData;
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const router = useRouter();

  const handleSendMessage = () => {
    router.push(`/chat?dm=${teacher.uid}`);
  };

  return (
    <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader className="items-center text-center">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          <AvatarImage src={teacher.photoURL} alt={teacher.displayName} data-ai-hint="teacher portrait" />
          <AvatarFallback>{teacher.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="pt-4">
          <CardTitle>{teacher.displayName}</CardTitle>
          <CardDescription>Teacher</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0" />
          <a href={`mailto:${teacher.email}`} className="truncate hover:underline">
            {teacher.email}
          </a>
        </div>
        {teacher.gensTaught && (
            <div className="flex items-start gap-3">
                <p className="text-sm font-medium text-muted-foreground pt-2">Teaches:</p>
                <div className="flex flex-wrap gap-1">
                {teacher.gensTaught.split(',').map(gen => (
                    <Badge key={gen} variant="secondary">{gen.trim()}</Badge>
                ))}
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="grid grid-cols-1 gap-2">
        <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleSendMessage}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
            </Button>
            <Button asChild>
                 <a href={`mailto:${teacher.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                </a>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
