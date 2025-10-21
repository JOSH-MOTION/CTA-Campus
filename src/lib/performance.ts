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
const TOTAL_WEEKS = 30;
const PROGRAM_START = new Date('2024-09-01'); // CHANGE TO YOUR COHORT

function getWeek(date: Date): number {
  const ms = date.getTime() - PROGRAM_START.getTime();
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

  // Attendance
  const attSnap = await getDocs(collection(db, 'attendance'));
  const attMap = new Map<string, Set<number>>();
  attSnap.forEach((doc) => {
    const d = doc.data() as any;
    const uid = d.studentId;
    const ts = d.submittedAt;
    if (uid && ts?.toDate) {
      const w = getWeek(ts.toDate());
      if (!attMap.has(uid)) attMap.set(uid, new Set());
      attMap.get(uid)!.add(w);
    }
  });

  // Submissions
  const subSnap = await getDocs(collection(db, 'submissions'));
  const subMap = new Map<
    string,
    Map<number, { exercise: boolean; assignment: boolean; project: boolean; hundredDays: boolean }>
  >();

  subSnap.forEach((doc) => {
    const d = doc.data() as any;
    const uid = d.studentId;
    const ts = d.submittedAt;
    const cat = d.pointCategory;

    if (!uid || !ts?.toDate || !cat) return;

    const w = getWeek(ts.toDate());
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