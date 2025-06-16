
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

// This check is crucial for debugging.
// It helps determine if the environment variable is being loaded at all.
if (!firebaseConfig.apiKey) {
  // This warning will appear in the server console during build/startup,
  // and potentially in the browser console if server-side rendering errors occur early.
  console.warn(
    'CRITICAL FIREBASE CONFIG ERROR: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing or not accessible in the environment. Firebase will not initialize correctly. Please check your .env.local file or hosting environment variables. If the key is set, ensure it is prefixed with NEXT_PUBLIC_ for client-side Next.js access.'
  );
}

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Firebase initialization error (this often happens due to an invalid apiKey or other config values):", error);
    // If initialization fails, 'app' will be undefined, and subsequent getAuth(app) will also fail.
    // The auth/invalid-api-key error often originates here if the config is bad.
    // We re-throw here to make it clear initialization failed, though the specific `auth/invalid-api-key` 
    // usually happens at `getAuth` if `app` is passed in a broken state.
    // To prevent getAuth from throwing an even more obscure error if 'app' is undefined,
    // we can throw a more direct error here, or let getAuth handle it.
    // For now, let's ensure 'app' is defined before calling getAuth.
    if (!app && firebaseConfig.apiKey) { // Only throw if API key was present but init still failed
        throw new Error(`Firebase app initialization failed despite API key being present. Check other Firebase config values and ensure your Firebase project setup is complete for this app. Original error: ${error}`);
    } else if (!firebaseConfig.apiKey) {
        throw new Error("Firebase app initialization failed: API key is missing. Cannot proceed.");
    }
    // If apiKey was present and init succeeded but later getAuth fails, that's a separate issue.
  }
} else {
  app = getApp();
}

// Ensure app is defined before calling getAuth.
// If app initialization failed above (e.g., due to missing API key),
// 'app' might be undefined here, leading to an error in getAuth.
// The checks above try to make the missing API key error more explicit.
if (!app) {
    // This case should ideally be caught by the API key check or the try-catch block.
    // However, as a safeguard:
    console.error("CRITICAL: Firebase app object is undefined before calling getAuth(). This indicates a severe initialization failure, likely due to missing or invalid Firebase config (especially API Key).");
    // To prevent a less clear error from getAuth(undefined), we can throw here,
    // though the earlier checks should have caught the root cause.
    // For this iteration, we'll let getAuth handle it if 'app' is somehow still undefined
    // and the previous checks didn't explicitly throw.
}

const auth = getAuth(app);

export { app, auth };
