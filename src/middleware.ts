import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();
const WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Clean old entries
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) rateLimit.delete(key);
  }
  
  const userLimit = rateLimit.get(ip);
  
  if (!userLimit) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW });
  } else if (now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW });
  } else if (userLimit.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  } else {
    userLimit.count++;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};