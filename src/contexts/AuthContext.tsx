
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback }  from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
      setUser(JSON.parse(mockSessionUser));
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, _pass: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: User = { id: 'mock-user-id-' + Date.now(), email };
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const signUp = useCallback(async (email: string, _pass: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockUser: User = { id: 'mock-user-id-' + Date.now(), email };
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setIsLoading(false);
    router.push('/dashboard');
  }, [router]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    localStorage.removeItem('mockUser');
    setIsLoading(false);
    // Redirect to sign-in, but ensure it's not already on a public page that doesn't require redirect
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/customizer')) {
      router.push('/signin');
    }
  }, [router, pathname]);

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
