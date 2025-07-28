// src/app/(app)/announcements/page.tsx
'use client';

import {Button} from '@/components/ui/button';
import {PlusCircle, Rss} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {useAnnouncements} from '@/contexts/AnnouncementsContext';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {CreateAnnouncementDialog} from '@/components/announcements/CreateAnnouncementDialog';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';

export default function AnnouncementsPage() {
  const {role} = useAuth();
  const {announcements} = useAnnouncements();
  const isTeacher = role === 'teacher';

  const sortedAnnouncements = [...announcements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">The latest school-wide news and updates.</p>
        </div>
        {isTeacher && (
          <CreateAnnouncementDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </CreateAnnouncementDialog>
        )}
      </div>

      {sortedAnnouncements.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedAnnouncements.map(announcement => (
            <Card key={announcement.id}>
              <CardHeader>
                <CardTitle>{announcement.title}</CardTitle>
                <CardDescription>{announcement.content}</CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{announcement.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>
                  {announcement.author} on {new Date(announcement.date).toLocaleDateString()}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <Rss className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No announcements yet</h2>
          <p className="mt-1 text-muted-foreground">
            {isTeacher ? 'Create the first announcement to get started.' : 'Check back later for updates.'}
          </p>
        </div>
      )}
    </div>
  );
}
