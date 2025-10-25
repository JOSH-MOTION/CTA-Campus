// src/lib/performance.ts
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
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
// NOTE: Total weeks will be derived from the provided roadmap ordering

function getWeekFromStart(date: Date, start: Date, totalWeeks: number): number {
  const millisecondsSinceStart = date.getTime() - start.getTime();
  const weekIndex = Math.floor(millisecondsSinceStart / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(weekIndex, totalWeeks));
}

/**
 * Build student performance aligned to a provided roadmap ordering.
 * weeksOrdered must be in the exact order you want columns rendered.
 */
export async function fetchAllPerformance(
  weeksOrdered: Array<{ subject: string; week: string }>
): Promise<StudentPerformance[]> {
  const TOTAL_WEEKS = weeksOrdered.length;

  const weekIndexByKey = new Map<string, number>();
  weeksOrdered.forEach((w, idx) => {
    weekIndexByKey.set(`${w.subject}-${w.week}`, idx + 1); // 1-based for convenience
  });
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
  const attendanceEvents: Array<{ uid: string; date: Date; weekIdx?: number }> = [];
  attSnap.forEach((snap) => {
    const d = snap.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    // Prefer classId mapping (e.g., "HTML-Week 1") to align strictly with roadmap
    const classId: string | undefined = d.classId;
    const mappedWeek = classId ? weekIndexByKey.get(classId) : undefined;
    if (uid && ts?.toDate) attendanceEvents.push({ uid, date: ts.toDate(), weekIdx: mappedWeek });
  });

  const subSnap = await getDocs(collection(db, 'submissions'));
  type SubEvent = { uid: string; date: Date; cat: string; assignmentId: string; title: string };
  const submissionEvents: SubEvent[] = [];
  const assignmentIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const projectIds = new Set<string>();

  subSnap.forEach((snap) => {
    const d = snap.data() as any;
    const uid = d.studentId as string | undefined;
    const ts: Timestamp | undefined = d.submittedAt;
    const cat: string | undefined = d.pointCategory;
    const assignmentId: string | undefined = d.assignmentId;
    const title: string | undefined = d.assignmentTitle;
    if (uid && ts?.toDate && cat && assignmentId) {
      submissionEvents.push({ uid, date: ts.toDate(), cat, assignmentId, title: title || '' });
      if (cat.includes('Assignment')) assignmentIds.add(assignmentId);
      else if (cat.includes('Exercise')) exerciseIds.add(assignmentId);
      else if (cat.includes('Project')) projectIds.add(assignmentId);
    }
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

  // Build week-indexed maps using roadmap alignment
  const attMap = new Map<string, Set<number>>();
  attendanceEvents.forEach(({ uid, date, weekIdx }) => {
    const gen = uidToGen.get(uid);
    // If we have precise mapping via classId, use it; otherwise fall back to cohort-relative week
    const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
    const w = weekIdx ?? getWeekFromStart(date, start, TOTAL_WEEKS);
    const bounded = Math.max(1, Math.min(w, TOTAL_WEEKS));
    if (!attMap.has(uid)) attMap.set(uid, new Set());
    attMap.get(uid)!.add(bounded);
  });

  // Preload metadata for mapping submissions to exact roadmap slots
  const idToSubjectWeek = new Map<string, { subject?: string; week?: string }>();

  const loadDocsByIds = async (colName: 'assignments' | 'exercises' | 'projects', ids: Set<string>) => {
    const loaders = Array.from(ids).map(async (id) => {
      try {
        const snap = await getDoc(doc(db, colName, id));
        const d: any = snap.data();
        if (d) idToSubjectWeek.set(`${colName}:${id}`, { subject: d.subject, week: d.week });
      } catch {
        // ignore
      }
    });
    await Promise.all(loaders);
  };

  await Promise.all([
    loadDocsByIds('assignments', assignmentIds),
    loadDocsByIds('exercises', exerciseIds),
    loadDocsByIds('projects', projectIds),
  ]);

  const subMap = new Map<
    string,
    Map<number, { exercise: boolean; assignment: boolean; project: boolean; hundredDays: boolean }>
  >();

  submissionEvents.forEach(({ uid, date, cat, assignmentId, title }) => {
    // Determine target week index
    let w: number | undefined;
    if (cat.includes('100 Days of Code')) {
      const gen = uidToGen.get(uid);
      const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
      w = getWeekFromStart(date, start, TOTAL_WEEKS);
    } else if (cat.includes('Assignment')) {
      const meta = idToSubjectWeek.get(`assignments:${assignmentId}`);
      if (meta?.subject && meta.week) w = weekIndexByKey.get(`${meta.subject}-${meta.week}`);
    } else if (cat.includes('Exercise')) {
      const meta = idToSubjectWeek.get(`exercises:${assignmentId}`);
      if (meta?.subject && meta.week) w = weekIndexByKey.get(`${meta.subject}-${meta.week}`);
    } else if (cat.includes('Project')) {
      const meta = idToSubjectWeek.get(`projects:${assignmentId}`);
      if (meta?.subject && meta.week) w = weekIndexByKey.get(`${meta.subject}-${meta.week}`);
    }

    // Fallback to cohort-relative week if we couldn't resolve subject/week
    if (!w) {
      const gen = uidToGen.get(uid);
      const start = (gen && earliestByGen.get(gen)) || earliestByStudent.get(uid) || date;
      w = getWeekFromStart(date, start, TOTAL_WEEKS);
    }

    const bounded = Math.max(1, Math.min(w!, TOTAL_WEEKS));

    if (!subMap.has(uid)) subMap.set(uid, new Map());
    const weekMap = subMap.get(uid)!;
    if (!weekMap.has(bounded))
      weekMap.set(bounded, { exercise: false, assignment: false, project: false, hundredDays: false });

    const entry = weekMap.get(bounded)!;
    if (cat.includes('Exercise')) entry.exercise = true;
    else if (cat.includes('Assignment')) entry.assignment = true;
    else if (cat.includes('Project')) entry.project = true;
    else if (cat.includes('100 Days of Code')) entry.hundredDays = true;
  });

  return students.map((s) => {
    const weeks: WeekRecord[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
      const w = i + 1;
      const att = attMap.get(s.uid)?.has(w) ?? false;
      const subs =
        subMap.get(s.uid)?.get(w) ?? {
          exercise: false,
          assignment: false,
          project: false,
          hundredDays: false,
        };

      return {
        attendance: { completed: att, points: att ? 1 : 0 },
        classExercise: { completed: subs.exercise, points: subs.exercise ? 1 : 0 },
        assignment: { completed: subs.assignment, points: subs.assignment ? 1 : 0 },
        project: { completed: subs.project, points: subs.project ? 1 : 0 },
        hundredDays: { completed: subs.hundredDays, points: subs.hundredDays ? 0.5 : 0 },
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