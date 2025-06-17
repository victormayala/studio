
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { WooCommerceCredentials } from '@/app/actions/woocommerceActions'; // Assuming interface is exported

export interface UserWooCommerceCredentials extends WooCommerceCredentials {
  lastSaved?: any; // Firestore server timestamp
}

export async function saveWooCommerceCredentials(
  userId: string,
  credentials: WooCommerceCredentials
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }
  if (!credentials.storeUrl || !credentials.consumerKey || !credentials.consumerSecret) {
    return { success: false, error: 'Store URL, Consumer Key, and Consumer Secret are required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { success: false, error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userWooCommerceCredentials', userId);
    const dataToSave: UserWooCommerceCredentials = {
      ...credentials,
      lastSaved: serverTimestamp(),
    };
    await setDoc(docRef, dataToSave);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving WooCommerce credentials to Firestore:', error);
    return { success: false, error: `Failed to save credentials: ${error.message}` };
  }
}

export async function loadWooCommerceCredentials(
  userId: string
): Promise<{ credentials?: UserWooCommerceCredentials; error?: string }> {
  if (!userId) {
    return { error: 'User ID is required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userWooCommerceCredentials', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { credentials: docSnap.data() as UserWooCommerceCredentials };
    } else {
      return { credentials: undefined }; // No credentials saved yet
    }
  } catch (error: any) {
    console.error('Error loading WooCommerce credentials from Firestore:', error);
    return { error: `Failed to load credentials: ${error.message}` };
  }
}

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
