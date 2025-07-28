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
import {Download, Calendar, Sparkles} from 'lucide-react';
import {Summarizer} from './Summarizer';

export interface Resource {
  title: string;
  course: string;
  type: string;
  date: string;
  content: string;
}

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceCard({resource}: ResourceCardProps) {
  return (
    <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="leading-tight">{resource.title}</CardTitle>
            <CardDescription>{resource.course}</CardDescription>
          </div>
          <Badge variant="outline">{resource.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>Added on {new Date(resource.date).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Summarizer content={resource.content} />
      </CardFooter>
    </Card>
  );
}
