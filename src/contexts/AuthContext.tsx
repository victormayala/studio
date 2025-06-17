
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback }  from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setIsLoading(true); 
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        
        const redirectUrl = searchParams.get('redirect');
        const isAuthPage = pathname === '/signin' || pathname === '/signup';

        if (isAuthPage) {
          router.push(redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/signin') && !redirectUrl.startsWith('/signup') ? redirectUrl : '/dashboard');
        } else if (redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/signin') && !redirectUrl.startsWith('/signup')) {
          // If there's a valid redirectUrl from being sent to signin from a protected route
          router.push(redirectUrl);
        }
        // If already on a protected page or dashboard, no specific redirect needed here as user is auth'd
        
      } else {
        setUser(null);
        const protectedUserPaths = ['/dashboard', '/customizer', '/dashboard/products']; 
        const isCurrentlyOnProtectedPath = protectedUserPaths.some(p => pathname.startsWith(p));

        if (isCurrentlyOnProtectedPath) {
          const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
          router.push(`/signin?redirect=${encodeURIComponent(fullPath)}`);
        }
      }
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, [auth, router, pathname, searchParams]); 

  const signIn = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Signed In", description: "Welcome back!" });
      // Redirection is now handled by onAuthStateChanged useEffect
    } catch (error: any) {
      console.error("Firebase sign in error:", error);
      // Toast removed from here to rely on inline form error
      setIsLoading(false); 
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
      setIsLoading(false); 
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
      setIsLoading(false); 
      throw error;
    }
  }, [auth, toast]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      await clearAccessCookie(); 
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/signin'); 
    } catch (error: any)      {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoading(false); 
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
