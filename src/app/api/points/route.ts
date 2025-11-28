// src/app/api/points/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { Point } from '@/models/User';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      points,
      reason,
      assignmentTitle,
      activityId,
      awardedBy,
      action,
      idToken,
    } = body;

    // Validate required fields
    if (!userId || points === undefined || !reason || !activityId || !idToken) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ID token
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    await connectDB();

    if (action === 'award') {
      // Check if points already awarded for this activity
      const existingPoint = await Point.findOne({ userId, activityId });
      if (existingPoint) {
        return NextResponse.json({
          success: false,
          message: 'Points already awarded for this activity',
        });
      }

      // Award points
      const pointRecord = await Point.create({
        userId,
        points,
        reason,
        assignmentTitle: assignmentTitle || reason,
        activityId,
        awardedBy,
        awardedAt: new Date(),
      });

      // Update user's total points
      await User.findOneAndUpdate(
        { uid: userId },
        { $inc: { totalPoints: points } },
        { upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: 'Points awarded successfully',
        pointRecord,
      });
    } else if (action === 'revoke') {
      // Find and delete the point record
      const pointRecord = await Point.findOneAndDelete({ userId, activityId });

      if (!pointRecord) {
        return NextResponse.json({
          success: false,
          message: 'Points already revoked or never existed',
        });
      }

      // Decrease user's total points
      await User.findOneAndUpdate(
        { uid: userId },
        { $inc: { totalPoints: -pointRecord.points } }
      );

      return NextResponse.json({
        success: true,
        message: 'Points revoked successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error managing points:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to manage points' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const points = await Point.find({ userId })
      .sort({ awardedAt: -1 })
      .lean();

    const user = await User.findOne({ uid: userId }).lean();

    return NextResponse.json({
      success: true,
      points,
      totalPoints: user?.totalPoints || 0,
    });
  } catch (error: any) {
    console.error('Error fetching points:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch points' },
      { status: 500 }
    );
  }
}