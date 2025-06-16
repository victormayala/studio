
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
      setIsLoading(true); // Set loading true at the start of auth state evaluation
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        // User is authenticated
        if (pathname === '/signin' || pathname === '/signup' || pathname === '/access-login') {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectUrl = searchParams.get('redirect');
          // Redirect to intended URL or dashboard, but not if redirect is to root (marketing page)
          router.push(redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/signin') && !redirectUrl.startsWith('/signup') ? redirectUrl : '/dashboard');
        }
      } else {
        setUser(null);
        // User is NOT authenticated
        const protectedUserPaths = ['/dashboard', '/customizer']; // Add more base paths as needed
        // Check if current path starts with any of the protected base paths
        const isCurrentlyOnProtectedPath = protectedUserPaths.some(p => pathname.startsWith(p));

        if (isCurrentlyOnProtectedPath) {
          // User is on a protected path but not logged in. Redirect to signin.
          // Preserve original path and query params for redirection after login.
          const fullPath = pathname + window.location.search;
          router.push(`/signin?redirect=${encodeURIComponent(fullPath)}`);
        }
      }
      setIsLoading(false); // Set loading false after processing auth state
    });

    return () => unsubscribe();
  }, [auth, router, pathname]); // Ensure pathname is a dependency

  const signIn = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed In", description: "Welcome back!" });
      // Redirection is now handled by onAuthStateChanged useEffect
    } catch (error: any) {
      console.error("Firebase sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials or user not found.",
        variant: "destructive",
      });
      setIsLoading(false); // Ensure loading is false on error
      throw error;
    }
  }, [auth, toast]);

  const signUp = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Sign Up Successful", description: "Welcome! Your account has been created." });
      // Redirection is now handled by onAuthStateChanged useEffect
    } catch (error: any) {
      console.error("Firebase sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false); // Ensure loading is false on error
      throw error;
    }
  }, [auth, toast]);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Signed In with Google", description: "Welcome!" });
      // Redirection is now handled by onAuthStateChanged useEffect
    } catch (error: any) {
      console.error("Google sign in error:", error);
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
      setIsLoading(false); // Ensure loading is false on error
      throw error;
    }
  }, [auth, toast]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      await clearAccessCookie(); 
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      // onAuthStateChanged will set user to null, and the useEffect will redirect if needed,
      // but explicitly pushing to /signin ensures a clean state.
      router.push('/signin'); 
    } catch (error: any)      {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoading(false); 
      throw error;
    }
    // setIsLoading(false) will be handled by onAuthStateChanged
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
