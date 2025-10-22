'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CheckCircle, Circle, Loader2} from 'lucide-react';
import {useRoadmap} from '@/contexts/RoadmapContext';
import {useAuth, UserData} from '@/contexts/AuthContext';
import {Checkbox} from '@/components/ui/checkbox';
import {Label} from '@/components/ui/label';
import {cn} from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function RoadmapPage() {
  const {roadmapData, completedWeeks, completionMap, toggleWeekCompletion, loading, setTeacherViewingGen} = useRoadmap();
  const {role, userData, allUsers} = useAuth();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';
  
  const manageableGens = useMemo(() => {
    if (!isTeacherOrAdmin) return [];
    
    // For admins, show all generations present in the user base.
    if (role === 'admin') {
      const allGens = new Set<string>();
      allUsers.forEach(u => {
        if(u.role === 'student' && u.gen) {
          allGens.add(u.gen);
        }
      });
      return Array.from(allGens).sort();
    }
    
    // For teachers, show only the generations they teach.
    return userData?.gensTaught?.split(',').map(g => g.trim()).filter(Boolean) || [];
  }, [userData, isTeacherOrAdmin, role, allUsers]);

  const [selectedGen, setSelectedGen] = useState(manageableGens[0] || '');
  
  useEffect(() => {
    if (isTeacherOrAdmin && manageableGens.length > 0 && !selectedGen) {
      setSelectedGen(manageableGens[0]);
    }
  }, [isTeacherOrAdmin, manageableGens, selectedGen]);

  // Keep context's teacher viewing gen in sync (helps other components relying on completedWeeks)
  useEffect(() => {
    if (isTeacherOrAdmin && selectedGen) {
      setTeacherViewingGen(selectedGen);
    }
  }, [isTeacherOrAdmin, selectedGen, setTeacherViewingGen]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Academic Roadmap</h1>
            <p className="text-muted-foreground">The full curriculum from start to finish.</p>
        </div>
        {isTeacherOrAdmin && manageableGens.length > 0 && (
            <div className="flex items-center gap-2">
                <Label htmlFor="gen-selector">Viewing progress for:</Label>
                <Select value={selectedGen} onValueChange={setSelectedGen}>
                    <SelectTrigger id="gen-selector" className="w-[180px]">
                        <SelectValue placeholder="Select Gen" />
                    </SelectTrigger>
                    <SelectContent>
                        {manageableGens.map(gen => (
                            <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-0">
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
                    const isCompletedForStudent = completedWeeks.has(weekId);
                    const isCompletedForTeacherView = isTeacherOrAdmin ? completionMap[weekId]?.[selectedGen] ?? false : false;
                    const isCompleted = isTeacherOrAdmin ? isCompletedForTeacherView : isCompletedForStudent;

                    return (
                      <Card key={weekId}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{week.title}</CardTitle>
                            {isTeacherOrAdmin ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${weekId}-${selectedGen}`}
                                  checked={isCompleted}
                                  onCheckedChange={() => toggleWeekCompletion(weekId, selectedGen, isCompleted)}
                                  disabled={!selectedGen}
                                />
                                <Label htmlFor={`${weekId}-${selectedGen}`} className="text-sm font-normal">
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
