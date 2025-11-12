// src/app/roadmap/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Loader2, Info, MapPin } from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AvatarBoy, AvatarGirl, Pin } from '@/components/roadmap/avatars';

export default function RoadmapPage() {
  const { roadmapData, completedWeeks, completionMap, toggleWeekCompletion, loading, setTeacherViewingGen, currentWeek } = useRoadmap();
  const { role, userData, allUsers } = useAuth();
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const manageableGens = useMemo(() => {
    if (!isTeacherOrAdmin) return [];
    if (role === 'admin') {
      const gens = new Set<string>();
      allUsers.forEach((u) => u.role === 'student' && u.gen && gens.add(u.gen));
      return Array.from(gens).sort();
    }
    return userData?.gensTaught?.split(',').map((g) => g.trim()).filter(Boolean) ?? [];
  }, [userData, isTeacherOrAdmin, role, allUsers]);

  const [selectedGen, setSelectedGen] = useState(manageableGens[0] ?? '');

  useEffect(() => {
    if (isTeacherOrAdmin && manageableGens.length && !selectedGen) setSelectedGen(manageableGens[0]);
  }, [isTeacherOrAdmin, manageableGens, selectedGen]);

  useEffect(() => {
    if (isTeacherOrAdmin && selectedGen) setTeacherViewingGen(selectedGen);
  }, [isTeacherOrAdmin, selectedGen, setTeacherViewingGen]);

  const activeWeekId = currentWeek ? `${currentWeek.subjectTitle}-${currentWeek.weekTitle}` : null;
  const weekRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (activeWeekId && weekRefs.current[activeWeekId]) {
      weekRefs.current[activeWeekId]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeWeekId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center space-y-4 mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Learning Roadmap
          </h1>
          <p className="text-muted-foreground text-lg">Your journey through knowledge</p>

          {isTeacherOrAdmin && manageableGens.length > 0 && (
            <div className="flex justify-center items-center gap-3 mt-6 bg-card/60 backdrop-blur-sm rounded-full px-6 py-3 inline-flex border">
              <Label htmlFor="gen" className="font-medium">Viewing Generation:</Label>
              <Select value={selectedGen} onValueChange={setSelectedGen}>
                <SelectTrigger id="gen" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {manageableGens.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {/* Zigzag Road */}
        <div className="relative">
          {roadmapData.map((subject, sIdx) => {
            const isLeft = sIdx % 2 === 0;
            const isActiveSubject = currentWeek?.subjectTitle === subject.title;
            const totalWeeks = subject.weeks.length;
            const completedCount = subject.weeks.filter(week => {
              const weekId = `${subject.title}-${week.title}`;
              return isTeacherOrAdmin 
                ? completionMap[weekId]?.[selectedGen] ?? false 
                : completedWeeks.has(weekId);
            }).length;
            const progress = totalWeeks > 0 ? (completedCount / totalWeeks) * 100 : 0;

            return (
              <div
                key={sIdx}
                className={clsx(
                  'relative mb-24 transition-all duration-700 animate-slide-in',
                  isLeft ? 'ml-0 mr-auto' : 'ml-auto mr-0',
                  'max-w-2xl'
                )}
                style={{ animationDelay: `${sIdx * 150}ms` }}
              >
                {/* Road Connector Line */}
                {sIdx > 0 && (
                  <div className={clsx(
                    'absolute -top-20 w-1 h-20 bg-gradient-to-b from-border to-muted-foreground/50',
                    isLeft ? 'right-1/2 mr-4' : 'left-1/2 ml-4'
                  )} />
                )}

                {/* Milestone Marker */}
                <div className={clsx(
                  'flex items-center gap-4 mb-6',
                  isLeft ? 'flex-row' : 'flex-row-reverse'
                )}>
                  <div className="relative">
                    <div className={clsx(
                      'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500',
                      isActiveSubject 
                        ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/50 scale-110' 
                        : 'bg-gradient-to-br from-muted-foreground/70 to-muted-foreground shadow-md'
                    )}>
                      <MapPin className="w-8 h-8 text-primary-foreground" />
                    </div>
                    {isActiveSubject && (
                      <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping opacity-75" />
                    )}
                  </div>
                  
                  <div className={clsx('flex-1', isLeft ? 'text-left' : 'text-right')}>
                    <h2 className="text-2xl font-bold">{subject.title}</h2>
                    <p className="text-muted-foreground text-sm">{subject.duration}</p>
                    {totalWeeks > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className={clsx(
                          'flex-1 h-2 bg-muted rounded-full overflow-hidden',
                          isLeft ? 'mr-2' : 'ml-2 order-first'
                        )}>
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {completedCount}/{totalWeeks}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Card */}
                <div className={clsx(
                  'bg-card rounded-2xl shadow-xl border overflow-hidden transition-all duration-500 hover:shadow-2xl',
                  isActiveSubject && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}>
                  <Accordion type="single" collapsible defaultValue={isActiveSubject ? `subject-${sIdx}` : undefined}>
                    <AccordionItem value={`subject-${sIdx}`} className="border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold">
                            View {subject.weeks.length ? 'Weeks' : 'Details'}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-6">
                        {subject.weeks.length ? (
                          <div className="grid gap-4 md:grid-cols-2 mt-4">
                            {subject.weeks.map((week, wIdx) => {
                              const weekId = `${subject.title}-${week.title}`;
                              const ref = (el: HTMLDivElement | null) => (weekRefs.current[weekId] = el);
                              const isCompletedStudent = completedWeeks.has(weekId);
                              const isCompletedTeacher = isTeacherOrAdmin ? completionMap[weekId]?.[selectedGen] ?? false : false;
                              const isCompleted = isTeacherOrAdmin ? isCompletedTeacher : isCompletedStudent;
                              const isCurrent = weekId === activeWeekId;

                              return (
                                <div
                                  key={weekId}
                                  ref={ref}
                                  className={clsx(
                                    'relative p-4 rounded-xl border-2 transition-all duration-300 animate-fade-in',
                                    isCurrent
                                      ? 'border-primary bg-primary/10 shadow-md scale-105'
                                      : isCompleted
                                      ? 'border-green-500/50 bg-green-500/10'
                                      : 'border-border bg-muted/30 hover:border-muted-foreground/30'
                                  )}
                                  style={{ animationDelay: `${wIdx * 50}ms` }}
                                >
                                  {/* Week Header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">{week.title}</h4>

                                    {isTeacherOrAdmin ? (
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`${weekId}-${selectedGen}`}
                                          checked={isCompleted}
                                          onCheckedChange={() => toggleWeekCompletion(weekId, selectedGen, isCompleted)}
                                          disabled={!selectedGen}
                                        />
                                        <Label htmlFor={`${weekId}-${selectedGen}`} className="text-sm">
                                          Done
                                        </Label>
                                      </div>
                                    ) : isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : null}
                                  </div>

                                  {/* Topics List */}
                                  <ul className="space-y-2">
                                    {week.topics.map((t) => (
                                      <li key={t.id} className="flex items-start gap-2 text-sm">
                                        {isCompleted ? (
                                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                        ) : (
                                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        )}
                                        <span
                                          className={clsx(
                                            'text-foreground',
                                            isCompleted && 'line-through text-muted-foreground'
                                          )}
                                        >
                                          {t.title}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>

                                  {/* Current Week Indicator */}
                                  {isCurrent && (
                                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                      Current
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8 italic">
                            Final project details coming soon
                          </p>
                        )}

                        {/* Info Items */}
                        {subject.infoItems?.map((info, i) => (
                          <div
                            key={i}
                            className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30"
                          >
                            <h4 className="font-semibold flex items-center gap-2 mb-2">
                              <Info className="h-5 w-5" />
                              {info.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slide-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}