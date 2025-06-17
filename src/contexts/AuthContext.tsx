
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
import { auth } from '@/lib/firebase'; 
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
  isLoading: boolean; // This isLoading is for the initial auth state check
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial auth state is known
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        
        const redirectUrl = searchParams.get('redirect');
        const isAuthPage = pathname === '/signin' || pathname === '/signup';

        if (isAuthPage) {
          router.push(redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/signin') && !redirectUrl.startsWith('/signup') ? redirectUrl : '/dashboard');
        } else if (redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/signin') && !redirectUrl.startsWith('/signup')) {
          router.push(redirectUrl);
        }
      } else {
        setUser(null);
        // Only protect dashboard and product options pages, /customizer can be accessed by guests (e.g. embedded)
        const protectedUserPaths = ['/dashboard', '/dashboard/products']; 
        const isCurrentlyOnProtectedPath = protectedUserPaths.some(p => pathname.startsWith(p));

        if (isCurrentlyOnProtectedPath) {
          const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
          router.push(`/signin?redirect=${encodeURIComponent(fullPath)}`);
        }
      }
      setIsLoading(false); // Auth state determined, set loading to false
    });

    return () => unsubscribe();
  }, [auth, router, pathname, searchParams]); 

  const signIn = useCallback(async (email: string, pass: string) => {
    // This function's loading state is handled by localIsLoading in SignInPage
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Successful sign-in will trigger onAuthStateChanged, which handles redirection and global loading state.
    } catch (error: any) {
      console.error("Firebase sign in error in AuthContext:", error);
      // Error is re-thrown to be handled by the calling component (SignInPage)
      throw error; 
    }
  }, [auth]);

  const signUp = useCallback(async (email: string, pass: string) => {
    // This function's loading state is handled by localIsLoading in SignUpPage
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Sign Up Successful", description: "Welcome! Your account has been created." });
      // Successful sign-up will trigger onAuthStateChanged.
    } catch (error: any) {
      console.error("Firebase sign up error in AuthContext:", error);
      // Error is re-thrown to be handled by the calling component (SignUpPage)
      let friendlyMessage = "Sign up failed. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = "This email is already registered. Please try signing in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = "Password is too weak. Please choose a stronger password (at least 6 characters).";
      } else if (error.message) {
        friendlyMessage = error.message;
      }
      toast({
        title: "Sign Up Failed",
        description: friendlyMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [auth, toast]);

  const signInWithGoogle = useCallback(async () => {
    // This function's loading state is handled by localIsLoading in the calling page
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Signed In with Google", description: "Welcome!" });
      // Successful sign-in will trigger onAuthStateChanged.
    } catch (error: any) {
      console.error("Google sign in error in AuthContext:", error);
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
      throw error;
    }
  }, [auth, toast]);

  const signOut = useCallback(async () => {
    setIsLoading(true); // Okay to set isLoading true here as it's a global state change for nav
    try {
      await firebaseSignOut(auth);
      await clearAccessCookie(); 
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      // onAuthStateChanged will set user to null and handle redirection.
      // Explicitly push to prevent delay if onAuthStateChanged is slow.
      router.push('/signin'); 
    } catch (error: any)      {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: error.message, variant: "destructive" });
      setIsLoading(false); // Reset loading on error
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
