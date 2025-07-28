// src/components/dashboards/PerformanceHub.tsx
'use client';

import {useState, useMemo} from 'react';
import {BarChart, PieChart, TrendingUp, Award} from 'lucide-react';
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

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {cn} from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const gradingData = [
  {title: 'Class Attendance', current: 35, total: 50, description: '1 point per attendance'},
  {title: 'Class Assignments', current: 40, total: 50, description: '1 point per assignment'},
  {title: 'Class Exercises', current: 25, total: 50, description: '1 point per exercise'},
  {title: 'Weekly Projects', current: 38, total: 50, description: '1 point per project'},
  {title: 'Monthly Projects', current: 7, total: 10, description: '1 point per project'},
  {title: 'Soft Skills Training', current: 4, total: 6, description: '1 point per attendance'},
  {title: 'Mini Demo Days', current: 5, total: 5, description: '5 points per demo'},
  {title: '100 Days of Code', current: 25, total: 50, description: '0.5 points per day'},
  {title: 'Code Review', current: 3, total: 5, description: '1 point per contribution'},
  {title: 'Final Project', current: 0, total: 10, description: 'Awarded upon completion'},
];

const chartData = gradingData.map(item => ({
  name: item.title,
  value: item.current,
}));

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#a4de6c',
  '#d0ed57',
  '#ffc658',
];

const chartConfig = {
  value: {
    label: 'Points',
  },
  ...gradingData.reduce((acc, item) => {
    acc[item.title] = {
      label: item.title,
      color: COLORS[gradingData.indexOf(item) % COLORS.length],
    };
    return acc;
  }, {} as any),
};

export default function PerformanceHub() {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  
  const overallProgress = useMemo(() => {
    const totalCurrent = gradingData.reduce((acc, item) => acc + item.current, 0);
    const totalPossible = gradingData.reduce((acc, item) => acc + item.total, 0);
    return {
      current: totalCurrent,
      total: totalPossible,
      percentage: totalPossible > 0 ? (totalCurrent / totalPossible) * 100 : 0,
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <CardTitle>Performance Hub</CardTitle>
          </div>
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
                You have earned {overallProgress.current} out of {overallProgress.total} possible points.
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
                    {item.current} / {item.total} pts
                    </span>
                </div>
                <Progress value={(item.current / item.total) * 100} />
                </div>
            ))}
            </div>
            <div className="min-h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
                {chartType === 'bar' ? (
                <RechartsBarChart
                    data={chartData}
                    layout="vertical"
                    margin={{left: 10, right: 10}}
                >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs"
                    width={110}
                    />
                    <XAxis dataKey="value" type="number" hide />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={5}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Bar>
                </RechartsBarChart>
                ) : (
                <RechartsPieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                </RechartsPieChart>
                )}
            </ChartContainer>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
