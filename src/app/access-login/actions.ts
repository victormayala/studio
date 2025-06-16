
'use server';

import { cookies } from 'next/headers';

export async function verifyPasswordAndSetCookie(passwordAttempt: string, redirectUrl?: string | null) {
  const correctPassword = process.env.APP_ACCESS_PASSWORD;
  const cookieValue = process.env.APP_ACCESS_COOKIE_VALUE;

  if (!correctPassword || !cookieValue) {
    console.error("APP_ACCESS_PASSWORD or APP_ACCESS_COOKIE_VALUE is not set in environment variables.");
    return { success: false, error: 'Server configuration error. Please contact support.' };
  }

  if (passwordAttempt === correctPassword) {
    try {
      // @ts-ignore TS2339: Property 'set' does not exist on type 'Promise<ReadonlyRequestCookies>' in this build context.
      cookies().set('app-access-granted', cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax', 
      });
      return { success: true, redirectPath: redirectUrl || '/dashboard' };
    } catch (e: any) {
      console.error("Error setting cookie in verifyPasswordAndSetCookie:", e);
      return { success: false, error: `Failed to set access session. Details: ${e.message || 'Unknown error'}` };
    }
  } else {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
}

export async function clearAccessCookie() {
  try {
    // @ts-ignore TS2339: Property 'delete' does not exist on type 'Promise<ReadonlyRequestCookies>' in this build context.
    cookies().delete('app-access-granted');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to clear access cookie:", error);
    return { success: false, error: `Failed to clear access session. Details: ${error.message || 'Unknown error'}` };
  }
}
