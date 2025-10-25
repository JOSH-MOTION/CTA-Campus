// src/lib/performance.ts
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface WeekRecord {
  attendance: { completed: boolean; points: number };
  classExercise: { completed: boolean; points: number };
  assignment: { completed: boolean; points: number };
  project: { completed: boolean; points: number };
  hundredDays: { completed: boolean; points: number }; // NEW
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  gen: string;
  weeks: WeekRecord[];
  totalPoints: number;
}

/* ------------------------------------------------------------------
   CONFIG
   ------------------------------------------------------------------ */
// Extend to cover full curriculum span (incl. Node)
const TOTAL_WEEKS = 52;

function getWeekFromStart(date: Date, start: Date): number {
  const ms = date.getTime() - start.getTime();
  const week = Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(week, TOTAL_WEEKS));
}

export async function fetchAllPerformance(): Promise<StudentPerformance[]> {
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('role', '==', 'student'))
  );

  const students = usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      id: String(data.id || data.schoolId || doc.id),
      name: data.displayName || data.name || 'Unknown',
      gen: data.gen || 'Unknown',
      totalPoints: data.totalPoints || 0,
    };
  });

  if (students.length === 0) return [];

  // Attendance and Submissions: build per-student event lists first
  const attSnap = await getDocs(collection(db, 'attendance'));
  const attendanceEvents: Array<{ uid: string; date: Date }> = [];
  attSnap.forEach((doc) => {
    const d = doc.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    if (uid && ts?.toDate) attendanceEvents.push({ uid, date: ts.toDate() });
  });

  const subSnap = await getDocs(collection(db, 'submissions'));
  const submissionEvents: Array<{ uid: string; date: Date; cat: string }> = [];
  subSnap.forEach((doc) => {
    const d = doc.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    const cat: string | undefined = d.pointCategory;
    if (uid && ts?.toDate && cat) submissionEvents.push({ uid, date: ts.toDate(), cat });
  });

  // Build uid->gen map for students
  const uidToGen = new Map<string, string>();
  students.forEach((s) => {
    uidToGen.set(s.uid, s.gen);
  });

  // Derive a per-student and per-generation cohort start date from earliest activity
  const earliestByStudent = new Map<string, Date>();
  const earliestByGen = new Map<string, Date>();
  const updateEarliest = (uid: string, date: Date) => {
    const curr = earliestByStudent.get(uid);
    if (!curr || date < curr) earliestByStudent.set(uid, date);
    const gen = uidToGen.get(uid);
    if (gen) {
      const currGen = earliestByGen.get(gen);
      if (!currGen || date < currGen) earliestByGen.set(gen, date);
    }
  };
  attendanceEvents.forEach((e) => updateEarliest(e.uid, e.date));
  submissionEvents.forEach((e) => updateEarliest(e.uid, e.date));

  // Build week-indexed maps using per-student start
  const attMap = new Map<string, Set<number>>();
  attendanceEvents.forEach(({ uid, date }) => {
    const gen = uidToGen.get(uid);
    const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date; // prefer gen start
    const w = getWeekFromStart(date, start);
    if (!attMap.has(uid)) attMap.set(uid, new Set());
    attMap.get(uid)!.add(w);
  });

  const subMap = new Map<
    string,
    Map<number, { exercise: boolean; assignment: boolean; project: boolean; hundredDays: boolean }>
  >();
  submissionEvents.forEach(({ uid, date, cat }) => {
    const gen = uidToGen.get(uid);
    const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
    const w = getWeekFromStart(date, start);
    if (!subMap.has(uid)) subMap.set(uid, new Map());
    const weekMap = subMap.get(uid)!;
    if (!weekMap.has(w)) weekMap.set(w, { exercise: false, assignment: false, project: false, hundredDays: false });

    const entry = weekMap.get(w)!;
    if (cat.includes('Exercise')) entry.exercise = true;
    else if (cat.includes('Assignment')) entry.assignment = true;
    else if (cat.includes('Project')) entry.project = true;
    else if (cat.includes('100 Days of Code')) entry.hundredDays = true;
  });

  return students.map((s) => {
    const weeks: WeekRecord[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const w = i + 1;
      const att = attMap.get(s.uid)?.has(w) ?? false;
      const subs = subMap.get(s.uid)?.get(w) ?? { exercise: false, assignment: false, project: false, hundredDays: false };

      return {
        attendance: { completed: att, points: att ? 1 : 0 },
        classExercise: { completed: subs.exercise, points: subs.exercise ? 1 : 0 },
        assignment: { completed: subs.assignment, points: subs.assignment ? 1 : 0 },
        project: { completed: subs.project, points: subs.project ? 1 : 0 },
        hundredDays: { completed: subs.hundredDays, points: subs.hundredDays ? 0.5 : 0 }, // 0.5
      };
    });

    return {
      studentId: s.id,
      studentName: s.name,
      gen: s.gen,
      weeks,
      totalPoints: s.totalPoints,
    };
  });
}