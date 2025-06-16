
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback }  from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Import configured auth instance
import { clearAccessCookie } from '@/app/access-login/actions';
import { useToast } from '@/hooks/use-toast';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = useCallback(() => {
    // If signing in/up from a public page, redirect to dashboard.
    // Middleware will handle access gate if necessary.
    if (pathname === '/signin' || pathname === '/signup' || pathname === '/') {
      router.push('/dashboard');
    } else if (pathname === '/access-login') {
       router.push('/dashboard');
    }
    // For other paths, stay on the current page, user state is updated.
  }, [router, pathname]);

  const signIn = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user and loading state
      toast({ title: "Signed In", description: "Welcome back!" });
      handleAuthSuccess();
    } catch (error: any) {
      console.error("Firebase sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials or user not found.",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  }, [auth, toast, handleAuthSuccess]);

  const signUp = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting user and loading state
      toast({ title: "Sign Up Successful", description: "Welcome! Your account has been created." });
      handleAuthSuccess();
    } catch (error: any) {
      console.error("Firebase sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  }, [auth, toast, handleAuthSuccess]);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting user and loading state
      toast({ title: "Signed In with Google", description: "Welcome!" });
      handleAuthSuccess();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      // Handle specific errors like popup closed by user, account exists with different credential, etc.
      let description = "Could not sign in with Google. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        description = "Sign-in popup closed. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with this email address. Try signing in with a different method.";
      }
      toast({
        title: "Google Sign In Failed",
        description,
        variant: "destructive",
      });
      setIsLoading(false);
      throw error;
    }
  }, [auth, toast, handleAuthSuccess]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null
      await clearAccessCookie(); // Clear separate app access if it exists
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/signin');
    } catch (error: any)      {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoading(false); // Ensure loading is false on error too
      throw error;
    }
  }, [auth, router, toast]);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInWithGoogle, signOut }}>
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
