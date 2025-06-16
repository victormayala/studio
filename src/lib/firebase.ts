
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
let auth: any; // Use 'any' initially, will be 'Auth' after successful initialization

if (!firebaseConfig.apiKey) {
  console.error(
    'CRITICAL FIREBASE CONFIG ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is MISSING or NOT ACCESSIBLE in the environment. Firebase will NOT initialize correctly. Please check your .env.local file (and ensure you restart your dev server) or your hosting environment variables. The key must be prefixed with NEXT_PUBLIC_ for client-side Next.js access.'
  );
  // To prevent further errors down the line if Firebase can't be initialized.
  // You might want to throw an error here or handle it differently based on your app's needs.
} else {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error: any) {
      console.error(
        `Firebase initialization error: ${error.message}. This can occur if Firebase configuration values are incorrect or if the project setup is incomplete for this app.`
      );
      // If app initialization fails catastrophically, make sure subsequent 'getAuth' doesn't run on an undefined 'app'.
      // Throwing here makes the init failure more explicit.
      throw new Error(`Firebase app initialization failed. Original error: ${error.message || error}`);
    }
  } else {
    app = getApp();
  }

  try {
    // This is where 'auth/invalid-api-key' is typically thrown by Firebase if the app was initialized with an incorrect API key
    auth = getAuth(app);
  } catch (error: any) {
    console.error(
      `Firebase getAuth() error: ${error.message}. This often follows an 'auth/invalid-api-key' during initializeApp if the API key in your environment variables is incorrect.`
    );
    // Re-throw the error to make it visible and stop further execution that depends on auth.
    throw error; 
  }
}

// Export them, but they might be undefined if the API key was missing.
// Downstream code should handle the possibility of 'auth' being undefined if recovery from this state is desired,
// though typically a missing/invalid API key is a critical startup failure.
export { app, auth };
