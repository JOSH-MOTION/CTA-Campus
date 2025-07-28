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
  const {roadmapData, completedTopics, toggleTopicCompletion} = useRoadmap();
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
                  {topic.weeks.map((week, weekIndex) => (
                    <Card key={weekIndex}>
                      <CardHeader>
                        <CardTitle className="text-base">{week.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {week.topics.map(item => {
                            const isCompleted = completedTopics.has(item.id);
                            return (
                              <li key={item.id} className="flex items-start gap-3">
                                {isTeacher ? (
                                  <div className="flex items-center space-x-2 pt-1">
                                    <Checkbox
                                      id={item.id}
                                      checked={isCompleted}
                                      onCheckedChange={() => toggleTopicCompletion(item.id)}
                                    />
                                  </div>
                                ) : isCompleted ? (
                                  <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                                ) : (
                                  <Circle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />
                                )}
                                <Label
                                  htmlFor={isTeacher ? item.id : undefined}
                                  className={cn(
                                    'text-sm text-muted-foreground',
                                    isCompleted && 'line-through',
                                    isTeacher ? 'cursor-pointer' : ''
                                  )}
                                >
                                  {item.title}
                                </Label>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
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
