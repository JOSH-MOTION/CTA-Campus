// src/components/resources/ResourceCard.tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Link, Calendar, BookOpen, ExternalLink} from 'lucide-react';
import {Summarizer} from './Summarizer';
import { type Resource } from '@/contexts/ResourcesContext';
import { useAuth } from '@/contexts/AuthContext';
import { ResourceActions } from './ResourceActions';

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({resource}: ResourceCardProps) {
  const { role } = useAuth();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  return (
    <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className='flex-1 pr-2'>
            <CardTitle className="leading-tight">{resource.title}</CardTitle>
            <CardDescription className="pt-1">{resource.description}</CardDescription>
          </div>
          {isTeacherOrAdmin && <ResourceActions resource={resource} />}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>Added on {new Date(resource.createdAt.toDate()).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>Type: <Badge variant="secondary">{resource.type}</Badge></span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {resource.url && (
            <Button variant="outline" className="w-full" asChild>
                <a href={resource.url} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Link
                </a>
            </Button>
        )}
        <Summarizer content={resource.content} />
      </CardFooter>
    </Card>
  );
}
