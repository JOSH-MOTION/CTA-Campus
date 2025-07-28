// src/app/(app)/materials/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Link as LinkIcon, Youtube, FileText, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';


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
  createdAt: Timestamp;
}

export default function MaterialsPage() {
  const { roadmapData } = useRoadmap();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        const materialsCollection = collection(db, 'materials');
        const q = query(materialsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedMaterials = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
        setMaterials(fetchedMaterials);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch materials from the database.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [toast]);

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

  const onSubmit = async (data: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      const newMaterialData = {
        ...data,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, 'materials'), newMaterialData);
      const newMaterial: Material = {
        id: docRef.id,
        ...newMaterialData,
      };
      setMaterials(prev => [newMaterial, ...prev]);
      toast({ title: 'Material Added!', description: 'The new resource is now available.' });
      form.reset();
    } catch (error) {
      console.error('Error adding material:', error);
       toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Failed to save the material. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Add Material</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Uploaded Materials</h2>
         {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No materials have been added yet.</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
