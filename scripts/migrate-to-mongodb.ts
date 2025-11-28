// scripts/migrate-to-mongodb.ts
/**
 * Migration script to sync existing Firestore data to MongoDB
 * Run this once to populate MongoDB with existing data
 * 
 * Usage: npx ts-node scripts/migrate-to-mongodb.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import mongoose from 'mongoose';
import User, { Point, Submission, Notification, Attendance } from '../src/models/User';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = require('../service-account.json'); // You'll need to download this from Firebase Console
  
  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'campus-compass-ug6bc',
  });
}

const db = getFirestore();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://eskool:KrjXFOc1mIQuwDfK@cluster0.84rsoje.mongodb.net/campus-compass?retryWrites=true&w=majority';

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
            availability: data.availability || {},
            availableDays: data.availableDays || [],
            gensTaught: data.gensTaught || '',
            linkedin: data.linkedin || '',
            github: data.github || '',
            fcmToken: data.fcmToken || '',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      count++;
      
      if (count % 10 === 0) {
        console.log(`   ✓ Migrated ${count} users`);
      }
    } catch (error) {
      console.error(`   ✗ Error migrating user ${doc.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${count} users total`);
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
          { 
            userId: userDoc.id,
            activityId: data.activityId 
          },
          {
            $set: {
              userId: userDoc.id,
              points: data.points || 0,
              reason: data.reason || '',
              assignmentTitle: data.assignmentTitle || '',
              activityId: data.activityId || '',
              awardedBy: data.awardedBy || '',
              awardedAt: data.awardedAt?.toDate() || new Date(),
            },
          },
          { upsert: true }
        );
        totalCount++;
        
        if (totalCount % 50 === 0) {
          console.log(`   ✓ Migrated ${totalCount} point records`);
        }
      } catch (error) {
        console.error(`   ✗ Error migrating point ${pointDoc.id}:`, error);
      }
    }
  }
  
  console.log(`✅ Migrated ${totalCount} point records total`);
}

async function migrateSubmissions() {
  console.log('📦 Migrating submissions...');
  
  const submissionsSnapshot = await db.collection('submissions').get();
  let count = 0;
  
  for (const doc of submissionsSnapshot.docs) {
    const data = doc.data();
    
    try {
      await Submission.findByIdAndUpdate(
        doc.id,
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
            submittedAt: data.submittedAt?.toDate() || new Date(),
            gradedAt: data.gradedAt?.toDate() || null,
            gradedBy: data.gradedBy || null,
          },
        },
        { upsert: true }
      );
      count++;
      
      if (count % 50 === 0) {
        console.log(`   ✓ Migrated ${count} submissions`);
      }
    } catch (error) {
      console.error(`   ✗ Error migrating submission ${doc.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${count} submissions total`);
}

async function migrateNotifications() {
  console.log('📦 Migrating notifications...');
  
  const notificationsSnapshot = await db.collection('notifications').get();
  let count = 0;
  
  for (const doc of notificationsSnapshot.docs) {
    const data = doc.data();
    
    try {
      await Notification.findByIdAndUpdate(
        doc.id,
        {
          $set: {
            _id: doc.id,
            userId: data.userId || '',
            title: data.title || '',
            description: data.description || '',
            href: data.href || '',
            read: data.read || false,
            date: data.date?.toDate() || new Date(),
          },
        },
        { upsert: true }
      );
      count++;
      
      if (count % 100 === 0) {
        console.log(`   ✓ Migrated ${count} notifications`);
      }
    } catch (error) {
      console.error(`   ✗ Error migrating notification ${doc.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${count} notifications total`);
}

async function migrateAttendance() {
  console.log('📦 Migrating attendance records...');
  
  const attendanceSnapshot = await db.collection('attendance').get();
  let count = 0;
  
  for (const doc of attendanceSnapshot.docs) {
    const data = doc.data();
    
    try {
      await Attendance.findByIdAndUpdate(
        doc.id,
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
            submittedAt: data.submittedAt?.toDate() || new Date(),
          },
        },
        { upsert: true }
      );
      count++;
      
      if (count % 50 === 0) {
        console.log(`   ✓ Migrated ${count} attendance records`);
      }
    } catch (error) {
      console.error(`   ✗ Error migrating attendance ${doc.id}:`, error);
    }
  }
  
  console.log(`✅ Migrated ${count} attendance records total`);
}

async function main() {
  console.log('🚀 Starting migration to MongoDB...\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Run migrations in order
    await migrateUsers();
    console.log('');
    
    await migratePoints();
    console.log('');
    
    await migrateSubmissions();
    console.log('');
    
    await migrateNotifications();
    console.log('');
    
    await migrateAttendance();
    console.log('');
    
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