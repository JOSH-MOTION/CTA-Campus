// src/app/(app)/grading/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, CheckCircle, Code, Edit, Film, GitBranch, Handshake, Presentation, Projector, Star } from 'lucide-react';

const gradingData = [
    { 
        title: "Class Attendance", 
        points: "50", 
        description: "1 point per weekly class attendance",
        icon: CheckCircle,
    },
    { 
        title: "Class Assignments", 
        points: "50", 
        description: "1 point per assignment",
        icon: Edit,
    },
    { 
        title: "Class Exercises", 
        points: "50", 
        description: "1 point per exercise",
        icon: Edit,
    },
    { 
        title: "Weekly Projects", 
        points: "50", 
        description: "1 point per project completion",
        icon: Projector
    },
    { 
        title: "Monthly Personal Projects", 
        points: "10", 
        description: "1 point per project",
        icon: Projector
    },
    { 
        title: "Soft Skills & Product Training", 
        points: "6", 
        description: "1 point per attendance",
        icon: Handshake
    },
    { 
        title: "Mini Demo Days", 
        points: "5", 
        description: "5 points per demo",
        icon: Presentation
    },
    { 
        title: "100 Days of Code", 
        points: "50", 
        description: "0.5 points per day",
        icon: Code
    },
    { 
        title: "Code Review", 
        points: "5", 
        description: "1 point per contribution",
        icon: GitBranch
    },
    { 
        title: "Final Project Completion", 
        points: "10", 
        description: "Awarded upon completion",
        icon: Award
    },
];

export default function GradingPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Grading & Points System</h1>
        <p className="text-muted-foreground">
          Understanding how your efforts are translated into points.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Total Points Summary</CardTitle>
            <CardDescription>A complete breakdown of all available points for Year 1.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gradingData.map((item, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                       <div className="rounded-full bg-primary/10 p-3">
                         <item.icon className="h-6 w-6 text-primary" />
                       </div>
                       <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                       </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                        <p className="text-5xl font-bold text-primary">{item.points}</p>
                        <p className="text-muted-foreground mt-4 ml-1">points</p>
                    </CardContent>
                </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
