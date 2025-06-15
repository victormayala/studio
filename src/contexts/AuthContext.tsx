
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback }  from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearAccessCookie } from '@/app/access-login/actions'; // Import the action

interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>; // pass is unused for mock
  signUp: (email: string, pass: string) => Promise<void>; // pass is unused for mock
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to check session
  const router = useRouter();
  const pathname = usePathname();

  // Mock session check
  useEffect(() => {
    const mockSessionUser = localStorage.getItem('mockUser');
    if (mockSessionUser) {
      try {
        const parsedUser = JSON.parse(mockSessionUser);
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.email === 'string') {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('mockUser');
        }
      } catch (error) {
        console.error("Failed to parse mockUser from localStorage", error);
        localStorage.removeItem('mockUser');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, _pass: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: User = { id: 'mock-user-id-' + Date.now(), email };
    setUser(mockUser);
    try {
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    } catch (error) {
      console.error("Failed to set mockUser in localStorage", error);
    }
    setIsLoading(false);
    // Check if already on access-login, if so, dashboard, otherwise let middleware handle
    if (pathname === '/access-login') {
      router.push('/dashboard');
    } else {
      // If signing in from a public page, attempt to go to dashboard.
      // Middleware will intercept if app access is still needed.
      router.push('/dashboard');
    }
  }, [router, pathname]);

  const signUp = useCallback(async (email: string, _pass: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: User = { id: 'mock-user-id-' + Date.now(), email };
    setUser(mockUser);
    try {
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    } catch (error) {
      console.error("Failed to set mockUser in localStorage", error);
    }
    setIsLoading(false);
    // Similar to signIn, attempt dashboard, middleware handles access gate.
    router.push('/dashboard');
  }, [router]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 250)); // Shorten delay for signout
    setUser(null);
    try {
      localStorage.removeItem('mockUser');
    } catch (error) {
      console.error("Failed to remove mockUser from localStorage", error);
    }
    
    // Clear the app access cookie as well
    try {
      await clearAccessCookie();
    } catch (error) {
        console.error("Failed to clear app access cookie on sign out:", error);
    }

    setIsLoading(false);
    // Always redirect to /signin after a full sign-out.
    // If they want to re-access protected parts, they'll hit the /access-login via middleware.
    router.push('/signin');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
