// src/app/(app)/materials/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap, RoadmapSubject, Week, Topic } from '@/contexts/RoadmapContext';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Link as LinkIcon, Youtube, FileText } from 'lucide-react';

const materialSchema = z.object({
  title: z.string().min(3, 'Title is too short.'),
  url: z.string().url('Please enter a valid URL.'),
  type: z.enum(['video', 'slides']),
  subject: z.string().nonempty('Please select a subject.'),
  week: z.string().nonempty('Please select a week.'),
  topic: z.string().nonempty('Please select a topic.'),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface Material extends MaterialFormValues {
  id: string;
}

export default function MaterialsPage() {
  const { roadmapData } = useRoadmap();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      title: 'HTML Basics Explained',
      url: 'https://www.youtube.com/watch?v=example1',
      type: 'video',
      subject: 'HTML',
      week: 'Week 1',
      topic: 'Basic html structure',
    },
    {
      id: '2',
      title: 'CSS Box Model Slides',
      url: 'https://slides.example.com/css-box-model',
      type: 'slides',
      subject: 'CSS',
      week: 'Week 2',
      topic: 'Box model',
    },
  ]);

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });

  const selectedSubjectTitle = form.watch('subject');
  const selectedWeekTitle = form.watch('week');

  const availableWeeks = useMemo(() => {
    if (!selectedSubjectTitle) return [];
    const subject = roadmapData.find(s => s.title === selectedSubjectTitle);
    return subject ? subject.weeks : [];
  }, [selectedSubjectTitle, roadmapData]);

  const availableTopics = useMemo(() => {
    if (!selectedWeekTitle) return [];
    const week = availableWeeks.find(w => w.title === selectedWeekTitle);
    return week ? week.topics : [];
  }, [selectedWeekTitle, availableWeeks]);

  const onSubmit = (data: MaterialFormValues) => {
    const newMaterial: Material = {
      ...data,
      id: (materials.length + 1).toString(),
    };
    setMaterials(prev => [newMaterial, ...prev]);
    toast({ title: 'Material Added!', description: 'The new resource is now available.' });
    form.reset();
  };

  const getTopicById = (subjectTitle: string, weekTitle: string, topicId: string) => {
    const subject = roadmapData.find(s => s.title === subjectTitle);
    const week = subject?.weeks.find(w => w.title === weekTitle);
    const topic = week?.topics.find(t => t.id === topicId || t.title === topicId); // a bit of a hack to support old and new
    return topic?.title || 'Unknown Topic';
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Class Materials</h1>
        <p className="text-muted-foreground">Add and manage learning resources for each topic.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Material</CardTitle>
          <CardDescription>Link a video or slide deck to a specific topic in the roadmap.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Flexbox Explained" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roadmapData.map(s => <SelectItem key={s.title} value={s.title}>{s.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Week</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectTitle}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Week" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableWeeks.map(w => <SelectItem key={w.title} value={w.title}>{w.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedWeekTitle}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {availableTopics.map(t => <SelectItem key={t.id} value={t.title}>{t.title}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="slides">Slides</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Material</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
         <h2 className="text-2xl font-semibold tracking-tight">Uploaded Materials</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {materials.map(material => (
            <Card key={material.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    {material.type === 'video' ? <Youtube className="h-8 w-8 text-red-500" /> : <FileText className="h-8 w-8 text-blue-500" />}
                    <div className="flex-1 text-right">
                        <CardTitle>{material.title}</CardTitle>
                        <CardDescription>
                            {material.subject} - {getTopicById(material.subject, material.week, material.topic)}
                        </CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardFooter>
                 <Button variant="outline" className="w-full" asChild>
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        View Material
                    </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
