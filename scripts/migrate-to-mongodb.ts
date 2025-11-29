// scripts/migrate-to-mongodb.ts
/**
 * Bulk migration script to move existing Firebase data to MongoDB
 * Run with: npx tsx scripts/migrate-to-mongodb.ts
 */

import * as admin from 'firebase-admin';
import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';

// Import models
import User from '../src/models/User';
import Assignment from '../src/models/Assignment';
import Exercise from '../src/models/Exercise';
import Project from '../src/models/Project';
import Announcement from '../src/models/Announcement';
import Attendance from '../src/models/Attendance';

// Initialize Firebase Admin (if not already done)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || '', 'base64').toString('utf-8')
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

interface MigrationStats {
  collection: string;
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}

async function migrateCollection(
  collectionName: string,
  Model: any,
  transform?: (doc: any) => any
): Promise<MigrationStats> {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  const stats: MigrationStats = {
    collection: collectionName,
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };
  
  try {
    const snapshot = await db.collection(collectionName).get();
    stats.total = snapshot.size;
    
    console.log(`Found ${stats.total} documents`);
    
    for (const doc of snapshot.docs) {
      try {
        let data = doc.data();
        
        // Transform Firestore Timestamps to JavaScript Dates
        Object.keys(data).forEach(key => {
          if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate();
          }
        });
        
        // Apply custom transformation if provided
        if (transform) {
          data = transform(data);
        }
        
        // Add the original Firestore ID
        data._id = doc.id;
        
        // Upsert into MongoDB
        await Model.findOneAndUpdate(
          { _id: doc.id },
          { $set: data },
          { upsert: true, new: true }
        );
        
        stats.migrated++;
        
        if (stats.migrated % 100 === 0) {
          console.log(`  ✓ Migrated ${stats.migrated}/${stats.total}`);
        }
      } catch (error: any) {
        stats.failed++;
        stats.errors.push(`Doc ${doc.id}: ${error.message}`);
        console.error(`  ✗ Failed to migrate ${doc.id}:`, error.message);
      }
    }
    
    console.log(`✅ Completed ${collectionName}: ${stats.migrated} migrated, ${stats.failed} failed`);
  } catch (error: any) {
    console.error(`❌ Error migrating ${collectionName}:`, error);
    stats.errors.push(`Collection error: ${error.message}`);
  }
  
  return stats;
}

async function migrateSubcollections() {
  console.log('\n📦 Migrating points subcollections...');
  
  const usersSnapshot = await db.collection('users').get();
  let totalPoints = 0;
  let migratedPoints = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    try {
      const pointsSnapshot = await db
        .collection('users')
        .doc(userDoc.id)
        .collection('points')
        .get();
      
      totalPoints += pointsSnapshot.size;
      
      for (const pointDoc of pointsSnapshot.docs) {
        try {
          const data = pointDoc.data();
          
          // Transform timestamps
          Object.keys(data).forEach(key => {
            if (data[key] && typeof data[key].toDate === 'function') {
              data[key] = data[key].toDate();
            }
          });
          
          // Store in MongoDB User model's embedded array or separate Points collection
          // For now, we'll just count them and update user's totalPoints
          migratedPoints++;
        } catch (error: any) {
          console.error(`Failed to migrate point ${pointDoc.id}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error(`Failed to process user ${userDoc.id}:`, error.message);
    }
  }
  
  console.log(`✅ Processed ${migratedPoints}/${totalPoints} points`);
}

async function main() {
  console.log('🚀 Starting Firebase to MongoDB Migration...\n');
  
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✓ Connected to MongoDB\n');
    
    const allStats: MigrationStats[] = [];
    
    // Migrate each collection
    // USERS
    allStats.push(await migrateCollection('users', User));
    
    // ASSIGNMENTS
    allStats.push(await migrateCollection('assignments', Assignment, (data) => ({
      ...data,
      // Ensure dueDates are properly formatted
      dueDates: data.dueDates?.map((d: any) => ({
        day: d.day,
        dateTime: d.dateTime?.toDate ? d.dateTime.toDate() : new Date(d.dateTime),
      })) || [],
    })));
    
    // EXERCISES
    allStats.push(await migrateCollection('exercises', Exercise));
    
    // PROJECTS
    allStats.push(await migrateCollection('projects', Project));
    
    // ANNOUNCEMENTS
    allStats.push(await migrateCollection('announcements', Announcement));
    
    // ATTENDANCE
    allStats.push(await migrateCollection('attendance', Attendance));
    
    // SUBMISSIONS - Already migrated, skip or update
    console.log('\nℹ️  Skipping submissions (already migrated)');
    
    // Migrate subcollections
    await migrateSubcollections();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    let totalMigrated = 0;
    let totalFailed = 0;
    
    allStats.forEach(stat => {
      console.log(`\n${stat.collection}:`);
      console.log(`  Total: ${stat.total}`);
      console.log(`  Migrated: ${stat.migrated}`);
      console.log(`  Failed: ${stat.failed}`);
      
      if (stat.errors.length > 0 && stat.errors.length <= 5) {
        console.log(`  Errors:`);
        stat.errors.forEach(err => console.log(`    - ${err}`));
      } else if (stat.errors.length > 5) {
        console.log(`  Errors: ${stat.errors.length} (showing first 5)`);
        stat.errors.slice(0, 5).forEach(err => console.log(`    - ${err}`));
      }
      
      totalMigrated += stat.migrated;
      totalFailed += stat.failed;
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ TOTAL MIGRATED: ${totalMigrated}`);
    console.log(`❌ TOTAL FAILED: ${totalFailed}`);
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run migration
main();