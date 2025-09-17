// src/utils/auth-utils.ts
'use client';

import { auth } from '@/lib/firebase';

/**
 * Gets a fresh ID token from the current user
 */
export async function getFreshIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found. Please login again.');
  }
  
  try {
    // Force refresh the token to get a fresh one
    return await user.getIdToken(true);
  } catch (error: any) {
    console.error('Failed to get fresh ID token:', error);
    
    // If force refresh fails, try without forcing
    try {
      return await user.getIdToken(false);
    } catch (retryError: any) {
      console.error('Retry also failed:', retryError);
      throw new Error('Session expired. Please refresh the page and login again.');
    }
  }
}

/**
 * Check if an error is authentication related
 */
export function isAuthError(error: any): boolean {
  const authErrorMessages = [
    'session invalid',
    'session expired', 
    'please login again',
    'token expired',
    'authentication failed',
    'Invalid authentication token'
  ];
  
  return error.message && authErrorMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Wrapper function that handles token refresh and retries for operations
 */
export async function withFreshToken<T>(
  operation: (token: string) => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get fresh token on each attempt, forcing refresh on retries
      const token = await getFreshIdToken();
      return await operation(token);
    } catch (error: any) {
      lastError = error;
      
      // If it's not an auth error, don't retry
      if (!isAuthError(error)) {
        throw error;
      }
      
      // If this was our last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw new Error('Authentication failed after multiple attempts. Please refresh the page and login again.');
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw lastError!;
}