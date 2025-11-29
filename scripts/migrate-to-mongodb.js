// scripts/migrate-to-mongodb-complete.js
/**
 * COMPLETE Migration script to sync ALL Firestore data to MongoDB
 * Run: node scripts/migrate-to-mongodb-complete.js
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
// Define ALL Mongoose Schemas
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
  hasEditedLessonDetails: Boolean,
  bio: String,
  photoURL: String,
  totalPoints: { type: Number, default: 0 },
  availability: { type: Map, of: [{ startTime: String, endTime: String }] },
  availableDays: [String],
  gensTaught: String,
  timeSlots: [{ startTime: String, endTime: String }],
  linkedin: String,
  github: String,
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
  _id: String,
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
  graderName: String,
});

const NotificationSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  href: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  date: { type: Date, default: Date.now, index: true },
});

const AttendanceSchema = new mongoose.Schema({
  _id: String,
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentGen: { type: String, required: true, index: true },
  classId: { type: String, required: true, index: true },
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

const AnnouncementSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true, index: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: String, required: true, index: true },
  targetGen: { type: String, required: true, index: true },
  imageUrl: String,
  date: { type: Date, default: Date.now, index: true },
});

const AssignmentSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  dueDates: [{ day: String, dateTime: Date }],
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  subject: String,
  week: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

const ExerciseSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  subject: String,
  week: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

const ProjectSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  targetGen: { type: String, required: true, index: true },
  authorId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

const ResourceSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true, index: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  url: String,
  type: { type: String, enum: ['Article', 'Video', 'Link', 'Document'], required: true },
  authorId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

const MaterialSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true },
  videoUrl: String,
  slidesUrl: String,
  subject: { type: String, required: true, index: true },
  week: { type: String, required: true, index: true },
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

const BookingSchema = new mongoose.Schema({
  _id: String,
  studentId: { type: String, required: true, index: true },
  studentName: String,
  staffId: { type: String, required: true, index: true },
  staffName: String,
  dateTime: { type: Date, required: true, index: true },
  reason: { type: String, required: true },
  meetingType: { type: String, enum: ['online', 'in-person'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', index: true },
  meetingLink: String,
  responseNote: String,
  createdAt: { type: Date, default: Date.now },
  respondedAt: Date,
});

const ChatMessageSchema = new mongoose.Schema({
  _id: String,
  chatId: { type: String, required: true, index: true },
  text: { type: String, required: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  replyTo: {
    messageId: String,
    text: String,
    senderName: String,
  },
  isPinned: Boolean,
  edited: Boolean,
});

const FeeSchema = new mongoose.Schema({
  _id: String,
  studentId: { type: String, required: true, unique: true, index: true },
  studentName: { type: String, required: true },
  gen: { type: String, required: true, index: true },
  email: { type: String, required: true },
  totalFees: { type: Number, required: true },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  status: { type: String, enum: ['paid', 'partial', 'unpaid', 'overdue'], default: 'unpaid', index: true },
  feeStructure: {
    fullAmount: Number,
    currency: String,
    paymentPlan: { type: String, enum: ['full', 'installment'] },
    installments: {
      count: Number,
      amountPerInstallment: Number,
    },
  },
  scholarship: {
    hasScholarship: Boolean,
    type: { type: String, enum: ['full', 'partial'] },
    percentage: Number,
    description: String,
  },
  payments: [{
    id: String,
    amount: Number,
    date: Date,
    method: String,
    reference: String,
    notes: String,
    recordedBy: String,
    recordedByName: String,
  }],
  enrollmentDate: { type: Date, required: true },
  expectedCompletionDate: Date,
  lastPaymentDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ========================
// Models
// ========================

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Point = mongoose.models.Point || mongoose.model('Point', PointSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Resource = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
const Material = mongoose.models.Material || mongoose.model('Material', MaterialSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
const Fee = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);

// ========================
// Helper Functions
// ========================

function toDate(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
  return new Date(timestamp);
}

async function migrateCollection(collectionName, Model, transform = null) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      // Transform timestamps
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key].toDate === 'function') {
          data[key] = data[key].toDate();
        }
      });

      // Apply custom transformation if provided
      const transformedData = transform ? transform(data) : data;

      await Model.findOneAndUpdate(
        { _id: doc.id },
        { $set: { _id: doc.id, ...transformedData } },
        { upsert: true, new: true }
      );
      count++;
      if (count % 50 === 0) console.log(`   ✓ Migrated ${count} ${collectionName}`);
    } catch (error) {
      console.error(`   ✗ Error migrating ${collectionName} ${doc.id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${count} ${collectionName} total\n`);
  return count;
}

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
            hasEditedLessonDetails: data.hasEditedLessonDetails || false,
            bio: data.bio || '',
            photoURL: data.photoURL || '',
            totalPoints: data.totalPoints || 0,
            availability: data.availability || {},
            availableDays: data.availableDays || [],
            gensTaught: data.gensTaught || '',
            timeSlots: data.timeSlots || [],
            linkedin: data.linkedin || '',
            github: data.github || '',
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
              awardedAt: toDate(data.awardedAt) || new Date(),
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

async function migrateChats() {
  console.log('📦 Migrating chat messages...');
  const chatsSnapshot = await db.collection('chats').get();
  let totalCount = 0;

  for (const chatDoc of chatsSnapshot.docs) {
    const messagesSnapshot = await db.collection('chats').doc(chatDoc.id).collection('messages').get();

    for (const msgDoc of messagesSnapshot.docs) {
      const data = msgDoc.data();
      try {
        await ChatMessage.findOneAndUpdate(
          { _id: msgDoc.id },
          {
            $set: {
              _id: msgDoc.id,
              chatId: chatDoc.id,
              text: data.text || '',
              senderId: data.senderId || '',
              senderName: data.senderName || '',
              timestamp: toDate(data.timestamp) || new Date(),
              replyTo: data.replyTo || null,
              isPinned: data.isPinned || false,
              edited: data.edited || false,
            },
          },
          { upsert: true }
        );
        totalCount++;
        if (totalCount % 100 === 0) console.log(`   ✓ Migrated ${totalCount} chat messages`);
      } catch (error) {
        console.error(`   ✗ Error migrating message ${msgDoc.id}:`, error.message);
      }
    }
  }

  console.log(`✅ Migrated ${totalCount} chat messages total\n`);
}

// ========================
// Soft Skills Collections
// ========================

async function migrateSoftSkills() {
  console.log('📦 Migrating Soft Skills data...');
  
  const collections = [
    'soft_skills_modules',
    'soft_skills_events', 
    'soft_skills_attendance',
    'soft_skills_jobs',
    'soft_skills_applications',
    'soft_skills_sessions'
  ];

  let totalCount = 0;

  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      console.log(`   Migrating ${collectionName}: ${snapshot.size} documents`);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Transform timestamps
        Object.keys(data).forEach(key => {
          if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate();
          }
        });

        // Store in a generic soft_skills collection with type
        const type = collectionName.replace('soft_skills_', '');
        await mongoose.connection.collection('soft_skills').findOneAndUpdate(
          { _id: doc.id },
          { $set: { _id: doc.id, type, ...data } },
          { upsert: true }
        );
        
        totalCount++;
      }
    } catch (error) {
      console.error(`   ✗ Error migrating ${collectionName}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${totalCount} soft skills records total\n`);
}

// ========================
// Run Migration
// ========================

async function main() {
  console.log('🚀 Starting COMPLETE migration to MongoDB...\n');

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Core collections
    await migrateUsers();
    await migratePoints();
    
    // Regular collections
    await migrateCollection('submissions', Submission);
    await migrateCollection('notifications', Notification);
    await migrateCollection('attendance', Attendance);
    await migrateCollection('announcements', Announcement, (data) => ({
      ...data,
      date: toDate(data.date) || new Date(),
    }));
    await migrateCollection('assignments', Assignment, (data) => ({
      ...data,
      dueDates: data.dueDates?.map(d => ({
        day: d.day,
        dateTime: toDate(d.dateTime) || new Date(),
      })) || [],
      createdAt: toDate(data.createdAt) || new Date(),
    }));
    await migrateCollection('exercises', Exercise, (data) => ({
      ...data,
      createdAt: toDate(data.createdAt) || new Date(),
    }));
    await migrateCollection('projects', Project, (data) => ({
      ...data,
      createdAt: toDate(data.createdAt) || new Date(),
    }));
    await migrateCollection('resources', Resource, (data) => ({
      ...data,
      createdAt: toDate(data.createdAt) || new Date(),
    }));
    await migrateCollection('materials', Material, (data) => ({
      ...data,
      createdAt: toDate(data.createdAt) || new Date(),
    }));
    await migrateCollection('bookings', Booking, (data) => ({
      ...data,
      dateTime: toDate(data.dateTime) || new Date(),
      createdAt: toDate(data.createdAt) || new Date(),
      respondedAt: toDate(data.respondedAt) || null,
    }));
    await migrateCollection('student_fees', Fee, (data) => ({
      ...data,
      enrollmentDate: toDate(data.enrollmentDate) || new Date(),
      expectedCompletionDate: toDate(data.expectedCompletionDate) || null,
      lastPaymentDate: toDate(data.lastPaymentDate) || null,
      createdAt: toDate(data.createdAt) || new Date(),
      updatedAt: toDate(data.updatedAt) || new Date(),
      payments: data.payments?.map(p => ({
        ...p,
        date: toDate(p.date) || new Date(),
      })) || [],
    }));

    // Nested collections
    await migrateChats();
    await migrateSoftSkills();

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