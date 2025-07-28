'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Link} from 'lucide-react';

export default function OneHundredDaysOfCodePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the submission,
    // e.g., save the link to a database with the selected date.
    console.log({date, link});
    alert(`Link submitted for ${date?.toLocaleDateString()}:\n${link}`);
    setLink('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">100 Days of Code</h1>
        <p className="text-muted-foreground">
          Select a day on the calendar and post the link to your daily progress.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Progress</CardTitle>
            <CardDescription>
              Keep your streak going! Paste the URL to your LinkedIn post.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="progress-link">Progress Link</Label>
                <div className="relative mt-1">
                  <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="progress-link"
                    type="url"
                    placeholder="https://www.linkedin.com/posts/..."
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={!link}>
                Post Link
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-3"
            classNames={{
                caption_label: 'text-lg font-medium',
                head_cell: 'w-12 font-medium text-muted-foreground',
                cell: 'h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-12 w-12 p-0 font-normal aria-selected:opacity-100',
                day_selected:
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
            }}
          />
        </Card>
      </div>
    </div>
  );
}