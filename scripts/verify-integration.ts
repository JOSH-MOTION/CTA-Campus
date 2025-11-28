// scripts/verify-integration.ts
/**
 * Verification script to test MongoDB integration
 * Run: npx ts-node scripts/verify-integration.ts
 */

import mongoose from 'mongoose';
import User, { Point, Submission } from '../src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://eskool:KrjXFOc1mIQuwDfK@cluster0.84rsoje.mongodb.net/campus-compass?retryWrites=true&w=majority';

async function verifyConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    return false;
  }
}

async function verifyCollections() {
  console.log('🔍 Checking collections...\n');
  
  const collections = [
    { name: 'Users', model: User },
    { name: 'Points', model: Point },
    { name: 'Submissions', model: Submission },
  ];
  
  for (const { name, model } of collections) {
    try {
      const count = await model.countDocuments();
      console.log(`✅ ${name}: ${count} documents`);
    } catch (error) {
      console.error(`❌ ${name}: Error counting documents`, error);
    }
  }
  
  console.log('');
}

async function verifySampleData() {
  console.log('🔍 Checking sample data...\n');
  
  // Check for at least one user
  const sampleUser = await User.findOne();
  if (sampleUser) {
    console.log('✅ Found sample user:');
    console.log(`   - Name: ${sampleUser.displayName}`);
    console.log(`   - Role: ${sampleUser.role}`);
    console.log(`   - Total Points: ${sampleUser.totalPoints}`);
  } else {
    console.log('⚠️  No users found in MongoDB');
  }
  
  console.log('');
  
  // Check for at least one point record
  const samplePoint = await Point.findOne();
  if (samplePoint) {
    console.log('✅ Found sample point record:');
    console.log(`   - Points: ${samplePoint.points}`);
    console.log(`   - Reason: ${samplePoint.reason}`);
  } else {
    console.log('⚠️  No point records found in MongoDB');
  }
  
  console.log('');
  
  // Check for at least one submission
  const sampleSubmission = await Submission.findOne();
  if (sampleSubmission) {
    console.log('✅ Found sample submission:');
    console.log(`   - Title: ${sampleSubmission.assignmentTitle}`);
    console.log(`   - Student: ${sampleSubmission.studentName}`);
    console.log(`   - Category: ${sampleSubmission.pointCategory}`);
  } else {
    console.log('⚠️  No submissions found in MongoDB');
  }
  
  console.log('');
}

async function verifyIndexes() {
  console.log('🔍 Checking indexes...\n');
  
  const collections = [
    { name: 'Users', model: User },
    { name: 'Points', model: Point },
    { name: 'Submissions', model: Submission },
  ];
  
  for (const { name, model } of collections) {
    try {
      const indexes = await model.collection.getIndexes();
      console.log(`✅ ${name} indexes:`, Object.keys(indexes).join(', '));
    } catch (error) {
      console.error(`❌ ${name}: Error getting indexes`, error);
    }
  }
  
  console.log('');
}

async function generateReport() {
  console.log('📊 MongoDB Integration Report\n');
  console.log('=' .repeat(50));
  console.log('');
  
  const userCount = await User.countDocuments();
  const studentCount = await User.countDocuments({ role: 'student' });
  const teacherCount = await User.countDocuments({ role: 'teacher' });
  const pointCount = await Point.countDocuments();
  const submissionCount = await Submission.countDocuments();
  
  console.log(`Total Users: ${userCount}`);
  console.log(`  - Students: ${studentCount}`);
  console.log(`  - Teachers: ${teacherCount}`);
  console.log(`  - Admins: ${userCount - studentCount - teacherCount}`);
  console.log('');
  console.log(`Total Point Records: ${pointCount}`);
  console.log(`Total Submissions: ${submissionCount}`);
  console.log('');
  
  // Calculate statistics
  const totalPoints = await Point.aggregate([
    { $group: { _id: null, total: { $sum: '$points' } } }
  ]);
  
  if (totalPoints.length > 0) {
    console.log(`Total Points Awarded: ${totalPoints[0].total}`);
  }
  
  const gradedSubmissions = await Submission.countDocuments({ grade: { $ne: null } });
  const pendingSubmissions = await Submission.countDocuments({ grade: null });
  
  console.log(`Graded Submissions: ${gradedSubmissions}`);
  console.log(`Pending Submissions: ${pendingSubmissions}`);
  console.log('');
  console.log('=' .repeat(50));
  console.log('');
}

async function main() {
  console.log('🚀 MongoDB Integration Verification\n');
  
  try {
    // Step 1: Verify connection
    const connected = await verifyConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Step 2: Check collections
    await verifyCollections();
    
    // Step 3: Check sample data
    await verifySampleData();
    
    // Step 4: Check indexes
    await verifyIndexes();
    
    // Step 5: Generate report
    await generateReport();
    
    console.log('✅ Verification completed successfully!\n');
    
    // Recommendations
    console.log('📝 Recommendations:');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('   ⚠️  Run migration script: npx ts-node scripts/migrate-to-mongodb.ts');
    } else {
      console.log('   ✅ Integration is working correctly');
      console.log('   ✅ You can start using the application');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();