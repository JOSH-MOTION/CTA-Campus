// src/app/(app)/assignments/page.tsx
'use client';

import {Button} from '@/components/ui/button';
import {PlusCircle, ListOrdered, ArrowRight} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import {useAssignments} from '@/contexts/AssignmentsContext';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {CreateAssignmentDialog} from '@/components/assignments/CreateAssignmentDialog';
import {Badge} from '@/components/ui/badge';
import {format} from 'date-fns';

export default function AssignmentsPage() {
  const {role} = useAuth();
  const {assignments} = useAssignments();
  const isTeacher = role === 'teacher';

  const sortedAssignments = [...assignments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            {isTeacher ? 'Create and manage assignments.' : 'View and submit your assignments.'}
          </p>
        </div>
        {isTeacher && (
          <CreateAssignmentDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </CreateAssignmentDialog>
        )}
      </div>

      {sortedAssignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedAssignments.map(assignment => (
            <Card key={assignment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>{assignment.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge variant="secondary">Due: {format(new Date(assignment.dueDate), 'PPP')}</Badge>
              </CardContent>
              <CardFooter>
                {isTeacher ? (
                  <Button variant="outline" className="w-full">
                    View Submissions
                  </Button>
                ) : (
                  <Button className="w-full">
                    Submit Work <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <ListOrdered className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No assignments yet</h2>
          <p className="mt-1 text-muted-foreground">
            {isTeacher ? 'Create the first assignment to get started.' : 'Check back later for assignments.'}
          p>
        </div>
      )}
    </div>
  );
}
