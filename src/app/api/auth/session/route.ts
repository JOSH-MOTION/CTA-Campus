// src/app/api/auth/session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { doc, getDoc } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userDocRef = doc(adminDb, 'users', decodedToken.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userRole = userDoc.data()?.role || 'student';
    
    // Set custom claim for role if it's not already set
    if (decodedToken.role !== userRole) {
        await adminAuth.setCustomUserClaims(decodedToken.uid, { role: userRole });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ status: 'success' });
    
    response.cookies.set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    
    return response;

  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
