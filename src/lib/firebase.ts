
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
// We need a placeholder for auth that can be exported even if initialization fails,
// but its usage should be guarded by successful app initialization.
let auth: any; 

if (!firebaseConfig.apiKey) {
  console.error(
    'CRITICAL FIREBASE CONFIG ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is MISSING or NOT ACCESSIBLE in the environment. Firebase will NOT initialize correctly. Please check your .env.local file (and ensure you restart your dev server) or your hosting environment variables. The key must be prefixed with NEXT_PUBLIC_ for client-side Next.js access.'
  );
  // To prevent further errors down the line if Firebase can't be initialized.
  // We assign undefined or a similar falsy value so checks for `auth` instance fail gracefully.
  app = undefined; 
  auth = undefined;
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error: any) {
      console.error(
        `Firebase initialization error during initializeApp: ${error.message}. This can occur if Firebase configuration values (other than API key, which was present) are incorrect or if the project setup is incomplete for this app. Double-check all NEXT_PUBLIC_FIREBASE_ environment variables.`
      );
      app = undefined; // Ensure app is undefined on catastrophic init failure
      auth = undefined;
      // Optionally re-throw or handle more explicitly if needed for app stability
      // throw new Error(`Firebase app initialization failed. Original error: ${error.message || error}`);
    }
  } else {
    app = getApp();
  }

  // Only attempt to getAuth if app was successfully initialized
  if (app) {
    try {
      auth = getAuth(app);
    } catch (error: any) {
      console.error(
        `Firebase getAuth() error: ${error.message}. This often follows an 'auth/invalid-api-key' during initializeApp if the API key in your environment variables (though present) is incorrect, or if other config values are problematic.`
      );
      auth = undefined; // Ensure auth is undefined on getAuth failure
      // Optionally re-throw to make the auth-specific failure more visible
      // throw error; 
    }
  } else {
    // If app is still undefined here, it means initializeApp failed silently or was skipped due to missing API key.
    // Ensure auth is also marked as uninitialized.
    auth = undefined;
    if (firebaseConfig.apiKey) { // Only log this if API key was present but app init still failed
        console.error("Firebase app object is undefined after initialization attempt, even though API key was present. Cannot initialize auth. Check for earlier Firebase initialization errors.");
    }
  }
}

export { app, auth };
