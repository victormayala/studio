
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { WooCommerceCredentials } from '@/app/actions/woocommerceActions'; // Assuming interface is exported

export interface UserWooCommerceCredentials extends WooCommerceCredentials {
  lastSaved?: any; // Firestore server timestamp
}

// The saveWooCommerceCredentials function is removed from here as its logic
// has been moved to the client-side in src/app/dashboard/page.tsx
// to correctly use the client's Firebase auth context for Firestore security rules.

// The loadWooCommerceCredentials function is removed from here as its logic
// has been moved to client-side components (dashboard, customizer, product options)
// to correctly use the client's Firebase auth context for Firestore security rules.

export async function deleteWooCommerceCredentials(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { success: false, error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userWooCommerceCredentials', userId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting WooCommerce credentials from Firestore:', error);
    return { success: false, error: `Failed to delete credentials: ${error.message}` };
  }
}

    