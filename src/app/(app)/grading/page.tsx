// src/app/(app)/grading/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, CheckCircle, Code, Edit, Film, GitBranch, Handshake, Presentation, Projector, Star, Calendar, Briefcase, Users } from 'lucide-react';

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
        title: "Mini Demo Days", 
        points: "5", 
        description: "1 points per demo",
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
    // Soft Skills Section
    { 
        title: "Career Modules", 
        points: "10", 
        description: "2 points per module (5 modules total)",
        icon: Handshake,
        category: "Soft Skills"
    },
    { 
        title: "Events & Workshops", 
        points: "12", 
        description: "12 events per year (tracking only)",
        icon: Calendar,
        category: "Soft Skills"
    },
    { 
        title: "Job Applications", 
        points: "24", 
        description: "24 applications per year (2 points each)",
        icon: Briefcase,
        category: "Soft Skills"
    },
    { 
        title: "One-on-One Sessions", 
        points: "24", 
        description: "24 sessions per year (2 points each)",
        icon: Users,
        category: "Soft Skills"
    },
];

// Calculate total points
const totalPoints = gradingData.reduce((sum, item) => sum + parseInt(item.points), 0);

export default function GradingPage() {
  const academicItems = gradingData.filter(item => !item.category);
  const softSkillsItems = gradingData.filter(item => item.category === "Soft Skills");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Grading & Points System</h1>
        <p className="text-muted-foreground">
          Understanding how your efforts are translated into points.
        </p>
      </div>

      {/* Total Points Summary */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Award className="h-8 w-8 text-primary" />
            Total Possible Points
          </CardTitle>
          <CardDescription className="text-lg">
            Complete breakdown of all available points for Year 1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-6xl font-bold text-primary mb-2">{totalPoints}</p>
            <p className="text-muted-foreground text-lg">Maximum Points Available</p>
            <div className="mt-4 grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground">Academic</p>
                <p className="text-2xl font-bold text-blue-600">280</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm text-muted-foreground">Soft Skills</p>
                <p className="text-2xl font-bold text-purple-600">70</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Academic Performance (280 points)</CardTitle>
            <CardDescription>Points earned through coursework, projects, and technical activities</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {academicItems.map((item, index) => (
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

      {/* Soft Skills & Career Development */}
      <Card>
        <CardHeader>
            <CardTitle className="text-xl">Soft Skills & Career Development (70 points )</CardTitle>
            <CardDescription>Career readiness through modules, events, applications, and mentorship</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {softSkillsItems.map((item, index) => (
                <Card key={index} className="flex flex-col">
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                       <div className="rounded-full bg-purple-100 p-3">
                         <item.icon className="h-6 w-6 text-purple-600" />
                       </div>
                       <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription className="text-xs">{item.description}</CardDescription>
                       </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                        {item.points === "0" ? (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-muted-foreground">Tracking</p>
                            <p className="text-xs text-muted-foreground">No points</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-5xl font-bold text-purple-600">{item.points}</p>
                            <p className="text-muted-foreground mt-4 ml-1">points</p>
                          </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-lg">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Total Available Points:</strong> 350 points (280 academic + 70 soft skills + 60 from product training)</p>
          <p>• <strong>Career Modules:</strong> Complete all 5 modules to earn the full 10 points (2 points each)</p>
          <p>• <strong>Events & Workshops:</strong> Attendance is tracked but does not award points</p>
          <p>• <strong>Job Applications:</strong> Apply to at least 2 positions per month (24 per year) - tracked but no points</p>
          <p>• <strong>One-on-One Sessions:</strong> Attend at least 2 sessions per month (24 per year) - tracked but no points</p>
          <p>• <strong>100 Days of Code:</strong> Each day completed awards 0.5 points (100 days = 50 points)</p>
        </CardContent>
      </Card>
    </div>
  );
}