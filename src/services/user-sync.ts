// src/services/user-sync.ts
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { UserData } from '@/contexts/AuthContext';

/**
 * Sync Firebase user to MongoDB
 * This runs whenever a user signs in or their profile updates
 */
export async function syncUserToMongoDB(firebaseUser: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  gen?: string;
  schoolId?: string;
  lessonDay?: string;
  lessonType?: string;
  lessonTime?: string;
  bio?: string;
  totalPoints?: number;
  [key: string]: any;
}): Promise<void> {
  try {
    await connectDB();

    // Upsert user document
    await User.findOneAndUpdate(
      { uid: firebaseUser.uid },
      {
        $set: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL || '',
          role: firebaseUser.role || 'student',
          gen: firebaseUser.gen || '',
          schoolId: firebaseUser.schoolId || '',
          lessonDay: firebaseUser.lessonDay || '',
          lessonType: firebaseUser.lessonType || '',
          lessonTime: firebaseUser.lessonTime || '',
          bio: firebaseUser.bio || '',
          totalPoints: firebaseUser.totalPoints || 0,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Synced user ${firebaseUser.uid} to MongoDB`);
  } catch (error) {
    console.error('❌ Error syncing user to MongoDB:', error);
    throw error;
  }
}

/**
 * Get user from MongoDB
 */
export async function getUserFromMongoDB(uid: string): Promise<UserData | null> {
  try {
    await connectDB();
    const user = await User.findOne({ uid });
    
    if (!user) return null;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role as 'student' | 'teacher' | 'admin',
      photoURL: user.photoURL,
      gen: user.gen,
      schoolId: user.schoolId,
      lessonDay: user.lessonDay,
      lessonType: user.lessonType,
      lessonTime: user.lessonTime,
      bio: user.bio,
      totalPoints: user.totalPoints,
    };
  } catch (error) {
    console.error('Error fetching user from MongoDB:', error);
    return null;
  }
}

/**
 * Update user in MongoDB
 */
export async function updateUserInMongoDB(
  uid: string,
  updates: Partial<UserData>
): Promise<void> {
  try {
    await connectDB();
    await User.findOneAndUpdate(
      { uid },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    console.log(`✅ Updated user ${uid} in MongoDB`);
  } catch (error) {
    console.error('Error updating user in MongoDB:', error);
    throw error;
  }
}