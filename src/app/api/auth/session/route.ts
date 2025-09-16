// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { doc, getDoc } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return new Response('ID token is required', { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userDocRef = doc(adminDb, 'users', decodedToken.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }
    
    const userRole = userDoc.data()?.role || 'student';
    
    // Set custom claim for role
    await adminAuth.setCustomUserClaims(decodedToken.uid, { role: userRole });

    // The session cookie will be set by Firebase Auth for httpOnly access
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    const response = new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    response.headers.append('Set-Cookie', `${options.name}=${options.value}; Max-Age=${options.maxAge}; Path=${options.path}; ${options.secure ? 'Secure;' : ''} HttpOnly; SameSite=Lax`);
    
    return response;

  } catch (error) {
    console.error('Session login error:', error);
    return new Response('Authentication failed', { status: 401 });
  }
}
