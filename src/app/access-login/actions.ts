
'use server';

import { cookies } from 'next/headers';

export async function verifyPasswordAndSetCookie(passwordAttempt: string, redirectUrl?: string | null) {
  const correctPassword = process.env.APP_ACCESS_PASSWORD;
  const cookieValue = process.env.APP_ACCESS_COOKIE_VALUE;

  if (!correctPassword || !cookieValue) {
    console.error("APP_ACCESS_PASSWORD or APP_ACCESS_COOKIE_VALUE is not set in environment variables.");
    // Avoid leaking specific error details to the client
    return { success: false, error: 'Server configuration error. Please contact support.' };
  }

  if (passwordAttempt === correctPassword) {
    cookies().set('app-access-granted', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax', // Recommended for security
    });
    return { success: true, redirectPath: redirectUrl || '/dashboard' };
  } else {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
}

export async function clearAccessCookie() {
  try {
    cookies().delete('app-access-granted');
    return { success: true };
  } catch (error) {
    console.error("Failed to clear access cookie:", error);
    return { success: false, error: "Failed to clear access session." };
  }
}
