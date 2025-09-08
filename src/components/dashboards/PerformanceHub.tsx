// src/components/dashboards/PerformanceHub.tsx
'use client';

import {useState, useMemo, useEffect} from 'react';
import { Award, CheckCircle, Edit, Projector, Handshake, Presentation, Code, GitBranch, Loader2, TrendingUp } from 'lucide-react';
import { onSnapshot, collection, doc, Unsubscribe } from 'firebase/firestore';

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

const initialGradingData = [
    { 
        title: "Class Attendance", 
        icon: CheckCircle, 
        current: 0, 
        total: 50, 
        description: "1 point per weekly class attendance"
    },
    { 
        title: "Class Assignments", 
        icon: Edit, 
        current: 0, 
        total: 50, 
        description: "1 point per assignment"
    },
    { 
        title: "Class Exercises", 
        icon: Edit, 
        current: 0, 
        total: 50, 
        description: "1 point per exercise"
    },
    { 
        title: "Weekly Projects", 
        icon: Projector, 
        current: 0, 
        total: 50, 
        description: "1 point per project completion"
    },
    { 
        title: "Monthly Personal Projects", 
        icon: Projector, 
        current: 0, 
        total: 10, 
        description: "1 point per project"
    },
    { 
        title: "Soft Skills & Product Training", 
        icon: Handshake, 
        current: 0, 
        total: 6, 
        description: "1 point per attendance"
    },
    { 
        title: "Mini Demo Days", 
        icon: Presentation, 
        current: 0, 
        total: 5, 
        description: "5 points per demo"
    },
    { 
        title: "100 Days of Code", 
        icon: Code, 
        current: 0, 
        total: 50, 
        description: "0.5 points per day"
    },
    { 
        title: "Code Review", 
        icon: GitBranch, 
        current: 0, 
        total: 5, 
        description: "1 point per contribution"
    },
    { 
        title: "Final Project Completion", 
        icon: Award, 
        current: 0, 
        total: 10, 
        description: "Awarded upon completion"
    },
];


export default function PerformanceHub({ studentId }: { studentId?: string }) {
  const { user } = useAuth();
  const [gradingData, setGradingData] = useState(initialGradingData.map(item => ({...item, current: 0})));
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const targetUserId = studentId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    let userUnsubscribe: Unsubscribe | null = null;
    let pointsUnsubscribe: Unsubscribe | null = null;

    const userDocRef = doc(db, 'users', targetUserId);
    userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        const userData = docSnap.data() as UserData;
        setTotalPoints(userData?.totalPoints || 0);
    }, (error) => {
        console.error("Error fetching user total points:", error);
    });

    const pointsCol = collection(db, 'users', targetUserId, 'points');
    pointsUnsubscribe = onSnapshot(pointsCol, (querySnapshot) => {
      const userPointsByCategory: { [key: string]: number } = {};
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const reason = data.reason;
        if (reason) {
          userPointsByCategory[reason] = (userPointsByCategory[reason] || 0) + data.points;
        }
      });
      
      const updatedGradingData = initialGradingData.map(item => ({
        ...item,
        current: userPointsByCategory[item.title] || 0,
      }));

      setGradingData(updatedGradingData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching points breakdown:", error);
      setLoading(false);
    });

    return () => {
        if (userUnsubscribe) {
            userUnsubscribe();
        }
        if (pointsUnsubscribe) {
            pointsUnsubscribe();
        }
    };
  }, [targetUserId]);

  const overallProgress = useMemo(() => {
    const totalPossible = gradingData.reduce((acc, item) => acc + item.total, 0);
    return {
      current: totalPoints,
      total: totalPossible,
      percentage: totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0,
    };
  }, [gradingData, totalPoints]);

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Performance Hub</CardTitle>
                  <CardDescription>Your academic points breakdown and progress.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <CardTitle>Performance Hub</CardTitle>
        </div>
        <CardDescription>Your academic points breakdown and progress.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <Award className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                You have earned {overallProgress.current.toFixed(1)} out of {overallProgress.total} possible points.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress.percentage} />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradingData.map(item => (
                <Card key={item.title} className="bg-muted/30">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                            <item.icon className="h-6 w-6 text-muted-foreground" />
                             <CardTitle className="text-base">{item.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{item.current.toFixed(1)} / {item.total} pts</span>
                        </div>
                        <Progress value={(item.current / item.total) * 100} />
                    </CardContent>
                </Card>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
