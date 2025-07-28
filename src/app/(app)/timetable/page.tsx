import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const timetableData = {
  Monday: [
    {time: '09:00 - 10:30', subject: 'CS101: Intro to CS', room: 'Hall A'},
    {time: '11:00 - 12:30', subject: 'MA203: Linear Algebra', room: 'Room 301'},
  ],
  Tuesday: [
    {time: '10:00 - 11:30', subject: 'ENG101: Composition', room: 'Room 204'},
    {time: '01:00 - 02:30', subject: 'PHY201: Classical Mechanics', room: 'Lab B'},
  ],
  Wednesday: [
    {time: '09:00 - 10:30', subject: 'CS101: Intro to CS', room: 'Hall A'},
    {time: '11:00 - 12:30', subject: 'MA203: Linear Algebra', room: 'Room 301'},
  ],
  Thursday: [
    {time: '10:00 - 11:30', subject: 'ENG101: Composition', room: 'Room 204'},
    {time: '01:00 - 02:30', subject: 'PHY201: Classical Mechanics', room: 'Lab B'},
  ],
  Friday: [
    {time: '09:00 - 10:30', subject: 'CS101: Intro to CS', room: 'Lab C (Tutorial)'},
    {time: '02:00 - 03:30', subject: 'HUM101: World History', room: 'Hall B'},
  ],
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground">Your class schedule for the week.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {days.map(day => (
          <Card key={day} className="flex flex-col">
            <CardHeader>
              <CardTitle>{day}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <Table>
                <TableBody>
                  {timetableData[day as keyof typeof timetableData].length > 0 ? (
                    timetableData[day as keyof typeof timetableData].map((session, index) => (
                      <TableRow key={index}>
                        <TableCell className="w-[120px] font-mono text-sm">{session.time}</TableCell>
                        <TableCell>{session.subject}</TableCell>
                        <TableCell className="hidden text-right sm:table-cell">{session.room}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No classes scheduled.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
