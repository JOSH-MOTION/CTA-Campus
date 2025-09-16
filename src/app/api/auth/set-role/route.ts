
// src/app/api/auth/set-role/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, role } = await request.json();

    if (!uid || !role) {
      return NextResponse.json({ success: false, error: 'Missing uid or role' }, { status: 400 });
    }
    
    // Set custom user claims on the server.
    await adminAuth.setCustomUserClaims(uid, { role });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
