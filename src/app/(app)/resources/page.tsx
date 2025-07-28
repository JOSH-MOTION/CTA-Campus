import {ResourceCard} from '@/components/resources/ResourceCard';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Upload} from 'lucide-react';

const resources = [
  {
    title: 'CS101 Syllabus',
    course: 'Intro to Computer Science',
    type: 'PDF',
    date: '2023-09-01',
    content: `This syllabus outlines the course structure for Introduction to Computer Science (CS101). Topics include fundamental programming concepts, algorithms, data structures, and software development principles. The course requires completion of weekly programming assignments and two major exams.`,
  },
  {
    title: 'MA203 Lecture Notes - Week 1',
    course: 'Linear Algebra',
    type: 'Document',
    date: '2023-09-04',
    content: `This document contains lecture notes for the first week of Linear Algebra (MA203). It covers vectors, vector operations, dot products, and the geometric interpretation of these concepts in 2D and 3D space. Key theorems and proofs are included.`,
  },
  {
    title: 'PHY201 Lab Manual',
    course: 'Classical Mechanics',
    type: 'PDF',
    date: '2023-09-02',
    content: `The lab manual for Classical Mechanics (PHY201) provides instructions for all experiments to be conducted during the semester. It includes sections on safety procedures, data analysis techniques, and report formatting guidelines. Students must read the relevant sections before each lab session.`,
  },
  {
    title: 'Reading: The Structure of Scientific Revolutions',
    course: 'History of Science',
    type: 'Reading',
    date: '2023-09-05',
    content: `This reading is an excerpt from Thomas Kuhn's influential book, "The Structure of Scientific Revolutions." It introduces the concept of paradigm shifts and discusses how scientific knowledge progresses through periods of normal science punctuated by revolutionary changes. The text is dense and requires careful reading.`,
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Resource Center</h1>
          <p className="text-muted-foreground">Find and share course materials.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </div>

      <div className="relative">
        <Input placeholder="Search for resources..." className="w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map(resource => (
          <ResourceCard key={resource.title} resource={resource} />
        ))}
      </div>
    </div>
  );
}
