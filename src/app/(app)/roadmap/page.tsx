'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CheckCircle, Circle} from 'lucide-react';
import {useRoadmap} from '@/contexts/RoadmapContext';
import {useAuth} from '@/contexts/AuthContext';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {cn} from '@/lib/utils';

export default function RoadmapPage() {
  const {roadmapData, completedWeeks, toggleWeekCompletion} = useRoadmap();
  const {role} = useAuth();
  const isTeacher = role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Academic Roadmap</h1>
        <p className="text-muted-foreground">The full curriculum from start to finish.</p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {roadmapData.map((topic, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="rounded-lg border bg-card px-4 shadow-sm"
          >
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-4">
                <span>{topic.title}</span>
                <span className="text-sm font-normal text-muted-foreground">({topic.duration})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {topic.weeks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {topic.weeks.map(week => {
                    const weekId = `${topic.title}-${week.title}`;
                    const isCompleted = completedWeeks.has(weekId);
                    return (
                      <Card key={weekId}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{week.title}</CardTitle>
                            {isTeacher ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={weekId}
                                  checked={isCompleted}
                                  onCheckedChange={() => toggleWeekCompletion(weekId)}
                                />
                                <Label htmlFor={weekId} className="text-sm font-normal">
                                  Mark as done
                                </Label>
                              </div>
                            ) : isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : null}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {week.topics.map(item => {
                              return (
                                <li key={item.id} className="flex items-start gap-3">
                                  {isCompleted ? (
                                    <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                  ) : (
                                    <Circle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                                  )}
                                  <span
                                    className={cn(
                                      'text-sm text-muted-foreground',
                                      isCompleted && 'line-through'
                                    )}
                                  >
                                    {item.title}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  Details for the final project will be provided later in the course.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
