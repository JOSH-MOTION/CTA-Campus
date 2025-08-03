// src/components/dashboards/PerformanceHub.tsx
'use client';

import {useState, useMemo, useEffect} from 'react';
import {BarChart, PieChart, TrendingUp, Award, Loader2} from 'lucide-react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {ChartContainer, ChartTooltipContent, type ChartConfig} from '@/components/ui/chart';
import { useAuth, UserData } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { getPointsForStudent } from '@/services/points';

const initialGradingData = [
  {title: 'Class Attendance', current: 0, total: 50, description: '1 point per attendance'},
  {title: 'Class Assignments', current: 0, total: 50, description: '1 point per assignment'},
  {title: 'Class Exercises', current: 0, total: 50, description: '1 point per exercise'},
  {title: 'Weekly Projects', current: 0, total: 50, description: '1 point per project'},
  {title: 'Monthly Personal Projects', current: 0, total: 10, description: '1 point per project'},
  {title: 'Soft Skills & Product Training', current: 0, total: 6, description: '1 point per attendance'},
  {title: 'Mini Demo Days', current: 0, total: 5, description: '5 points per demo'},
  {title: '100 Days of Code', current: 0, total: 50, description: '0.5 points per day'},
  {title: 'Code Review', current: 0, total: 5, description: '1 point per contribution'},
  {title: 'Final Project Completion', current: 0, total: 10, description: 'Awarded upon completion'},
];

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function PerformanceHub({ studentId }: { studentId?: string }) {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
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

    const userDocRef = doc(db, 'users', targetUserId);
    const userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
        const userData = docSnap.data() as UserData;
        setTotalPoints(userData?.totalPoints || 0);
    }, (error) => {
        console.error("Error fetching user total points:", error);
    });

    const pointsCol = collection(db, 'users', targetUserId, 'points');
    const pointsUnsubscribe = onSnapshot(pointsCol, (querySnapshot) => {
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
        userUnsubscribe();
        pointsUnsubscribe();
    };
  }, [targetUserId]);

  const chartData = useMemo(() => gradingData.map((item, index) => ({
    name: item.title,
    value: item.current,
    fill: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0), [gradingData]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    chartData.forEach(item => {
        config[item.name] = {
            label: item.name,
            color: item.fill,
        };
    });
    return config;
  }, [chartData]);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <CardTitle>Performance Hub</CardTitle>
          </div>
          {chartData.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
              >
                <BarChart className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={chartType === 'pie' ? 'default' : 'outline'}
                onClick={() => setChartType('pie')}
              >
                <PieChart className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>Your academic points breakdown and progress.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
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
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
            <div className="space-y-4">
            {gradingData.map(item => (
                <div key={item.title} className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">
                    {item.current.toFixed(1)} / {item.total} pts
                    </span>
                </div>
                <Progress value={(item.current / item.total) * 100} />
                </div>
            ))}
            </div>
            <div className="min-h-[300px] w-full h-full">
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="w-full h-[350px]">
                        {chartType === 'bar' ? (
                        <RechartsBarChart
                            data={chartData}
                            layout="vertical"
                            margin={{left: 0, right: 10, top: 10, bottom: 10}}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={5}
                                tick={{fontSize: 10, width: 100, whiteSpace: 'pre-wrap'}}
                                className="text-xs"
                                width={100}
                                stroke="hsl(var(--foreground))"
                            />
                            <XAxis dataKey="value" type="number" hide />
                            <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="value" radius={5}>
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                            </Bar>
                        </RechartsBarChart>
                        ) : (
                        <RechartsPieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {chartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                            ))}
                            </Pie>
                        </RechartsPieChart>
                        )}
                    </ChartContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p>No points recorded yet.</p>
                        <p className="text-xs">Complete an activity to see your progress.</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
