// src/components/dashboards/WeeklyFocus.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { Loader2, CheckCircle, Radio, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export default function WeeklyFocus() {
  const { currentWeek, nextWeek, loading, allWeeksCompleted } = useRoadmap();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Focus</CardTitle>
          <CardDescription>Your current and upcoming topics.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (allWeeksCompleted) {
     return (
        <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700 dark:text-green-300">Congratulations!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
                You have completed all the weeks in the roadmap.
            </AlertDescription>
        </Alert>
     )
  }

  if (!currentWeek) {
      return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Roadmap Not Started</AlertTitle>
            <AlertDescription>Your teacher has not marked any weeks as complete yet. Check back soon!</AlertDescription>
        </Alert>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            This Week's Focus
          </CardTitle>
          <CardDescription>Topics for: <Badge>{currentWeek.subjectTitle} - {currentWeek.weekTitle}</Badge></CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {currentWeek.topics.map(topic => (
              <li key={topic.id} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>{topic.title}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Next Week's Topics
          </CardTitle>
          {nextWeek ? (
            <CardDescription>A preview of: <Badge variant="secondary">{nextWeek.subjectTitle} - {nextWeek.weekTitle}</Badge></CardDescription>
          ) : (
            <CardDescription>You are on the final week!</CardDescription>
          )}
        </CardHeader>
        <CardContent>
           {nextWeek ? (
             <ul className="space-y-2 text-sm text-muted-foreground">
                {nextWeek.topics.map(topic => (
                <li key={topic.id} className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{topic.title}</span>
                </li>
                ))}
            </ul>
           ) : (
             <p className="text-sm text-center text-muted-foreground">No upcoming topics to display.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
