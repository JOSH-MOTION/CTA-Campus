// scripts/migrate-to-mongodb.js
/**
 * Migration script to sync existing Firestore data to MongoDB
 * Run: node scripts/migrate-to-mongodb.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const mongoose = require("mongoose");

// MongoDB URI
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://eskool:KrjXFOc1mIQuwDfK@cluster0.84rsoje.mongodb.net/campus-compass?retryWrites=true&w=majority";

// Load Firebase credentials
function getFirebaseCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
    return JSON.parse(
      Buffer.from(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
        "base64"
      ).toString("utf8")
    );
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  console.error("No Firebase credentials found.");
  process.exit(1);
}

// Initialize Firebase
if (getApps().length === 0) {
  initializeApp({
    credential: cert(getFirebaseCredentials()),
  });
}

const db = getFirestore();

// ========================
// Define Mongoose Schemas
// ========================

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  gen: String,
  schoolId: String,
  lessonDay: String,
  lessonType: String,
  lessonTime: String,
  bio: String,
  photoURL: String,
  totalPoints: { type: Number, default: 0 },
  fcmToken: String,
}, { timestamps: true });

const PointSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  points: { type: Number, required: true },
  reason: { type: String, required: true },
  assignmentTitle: String,
  activityId: { type: String, required: true },
  awardedBy: String,
  awardedAt: { type: Date, default: Date.now },
});

const SubmissionSchema = new mongoose.Schema({
  _id: String, // keep Firestore ID as string
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentGen: { type: String, required: true, index: true },
  assignmentId: { type: String, required: true, index: true },
  assignmentTitle: { type: String, required: true },
  submissionLink: String,
  submissionNotes: String,
  pointCategory: { type: String, required: true },
  grade: String,
  feedback: String,
  imageUrl: String,
  submittedAt: { type: Date, default: Date.now, index: true },
  gradedAt: Date,
  gradedBy: String,
});

const NotificationSchema = new mongoose.Schema({
  _id: String, // keep Firestore ID as string
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  href: { type: String, required: true },
  read: { type: Boolean, default: false },
  date: { type: Date, default: Date.now, index: true },
});

const AttendanceSchema = new mongoose.Schema({
  _id: String, // keep Firestore ID as string
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentGen: { type: String, required: true, index: true },
  classId: { type: String, required: true },
  className: { type: String, required: true },
  learned: { type: String, required: true },
  challenged: { type: String, required: true },
  questions: String,
  rating: { type: Number, required: true, min: 1, max: 10 },
  attendanceType: { type: String, enum: ['virtual', 'in-person'], required: true },
  understanding: { type: Number, required: true, min: 1, max: 10 },
  actionPlan: { type: String, required: true },
  preClassReview: { type: String, enum: ['yes', 'no'], required: true },
  submittedAt: { type: Date, default: Date.now, index: true },
});

// ========================
// Models
// ========================

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Point = mongoose.models.Point || mongoose.model('Point', PointSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

// ========================
// Migration Functions
// ========================

async function migrateUsers() {
  console.log('📦 Migrating users...');
  const usersSnapshot = await db.collection('users').get();
  let count = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    try {
      await User.findOneAndUpdate(
        { uid: doc.id },
        {
          $set: {
            uid: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
            role: data.role || 'student',
            gen: data.gen || '',
            schoolId: data.schoolId || '',
            lessonDay: data.lessonDay || '',
            lessonType: data.lessonType || '',
            lessonTime: data.lessonTime || '',
            bio: data.bio || '',
            photoURL: data.photoURL || '',
            totalPoints: data.totalPoints || 0,
            fcmToken: data.fcmToken || '',
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      count++;
      if (count % 10 === 0) console.log(`   ✓ Migrated ${count} users`);
    } catch (error) {
      console.error(`   ✗ Error migrating user ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} users total\n`);
}

async function migratePoints() {
  console.log('📦 Migrating points...');
  const usersSnapshot = await db.collection('users').get();
  let totalCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const pointsSnapshot = await db.collection('users').doc(userDoc.id).collection('points').get();

    for (const pointDoc of pointsSnapshot.docs) {
      const data = pointDoc.data();
      try {
        await Point.findOneAndUpdate(
          { userId: userDoc.id, activityId: data.activityId },
          {
            $set: {
              userId: userDoc.id,
              points: data.points || 0,
              reason: data.reason || '',
              assignmentTitle: data.assignmentTitle || '',
              activityId: data.activityId || '',
              awardedBy: data.awardedBy || '',
              awardedAt: data.awardedAt?.toDate ? data.awardedAt.toDate() : new Date(),
            },
          },
          { upsert: true }
        );
        totalCount++;
        if (totalCount % 50 === 0) console.log(`   ✓ Migrated ${totalCount} point records`);
      } catch (error) {
        console.error(`   ✗ Error migrating point ${pointDoc.id}:`, error.message);
      }
    }
  }

  console.log(`✅ Migrated ${totalCount} point records total\n`);
}

async function migrateSubmissions() {
  console.log('📦 Migrating submissions...');
  const submissionsSnapshot = await db.collection('submissions').get();
  let count = 0;

  for (const doc of submissionsSnapshot.docs) {
    const data = doc.data();
    try {
      await Submission.findOneAndUpdate(
        { _id: doc.id },
        {
          $set: {
            _id: doc.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            studentGen: data.studentGen || '',
            assignmentId: data.assignmentId || '',
            assignmentTitle: data.assignmentTitle || '',
            submissionLink: data.submissionLink || '',
            submissionNotes: data.submissionNotes || '',
            pointCategory: data.pointCategory || '',
            grade: data.grade || null,
            feedback: data.feedback || '',
            imageUrl: data.imageUrl || '',
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(),
            gradedAt: data.gradedAt?.toDate ? data.gradedAt.toDate() : null,
            gradedBy: data.gradedBy || null,
          },
        },
        { upsert: true }
      );
      count++;
      if (count % 50 === 0) console.log(`   ✓ Migrated ${count} submissions`);
    } catch (error) {
      console.error(`   ✗ Error migrating submission ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} submissions total\n`);
}

async function migrateNotifications() {
  console.log('📦 Migrating notifications...');
  const notificationsSnapshot = await db.collection('notifications').get();
  let count = 0;

  for (const doc of notificationsSnapshot.docs) {
    const data = doc.data();
    try {
      await Notification.findOneAndUpdate(
        { _id: doc.id },
        {
          $set: {
            _id: doc.id,
            userId: data.userId || '',
            title: data.title || '',
            description: data.description || '',
            href: data.href || '',
            read: data.read || false,
            date: data.date?.toDate ? data.date.toDate() : new Date(),
          },
        },
        { upsert: true }
      );
      count++;
      if (count % 100 === 0) console.log(`   ✓ Migrated ${count} notifications`);
    } catch (error) {
      console.error(`   ✗ Error migrating notification ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} notifications total\n`);
}

async function migrateAttendance() {
  console.log('📦 Migrating attendance records...');
  const attendanceSnapshot = await db.collection('attendance').get();
  let count = 0;

  for (const doc of attendanceSnapshot.docs) {
    const data = doc.data();
    try {
      await Attendance.findOneAndUpdate(
        { _id: doc.id },
        {
          $set: {
            _id: doc.id,
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            studentGen: data.studentGen || '',
            classId: data.classId || '',
            className: data.className || '',
            learned: data.learned || '',
            challenged: data.challenged || '',
            questions: data.questions || '',
            rating: data.rating || 5,
            attendanceType: data.attendanceType || 'in-person',
            understanding: data.understanding || 5,
            actionPlan: data.actionPlan || '',
            preClassReview: data.preClassReview || 'no',
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(),
          },
        },
        { upsert: true }
      );
      count++;
      if (count % 50 === 0) console.log(`   ✓ Migrated ${count} attendance records`);
    } catch (error) {
      console.error(`   ✗ Error migrating attendance ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} attendance records total\n`);
}

// ========================
// Run Migration
// ========================

async function main() {
  console.log('🚀 Starting migration to MongoDB...\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await migrateUsers();
    await migratePoints();
    await migrateSubmissions();
    await migrateNotifications();
    await migrateAttendance();

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
