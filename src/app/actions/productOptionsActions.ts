
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

// Define interfaces directly here or import from a shared types file
// Ensure these match the structures used in your components
interface BoundaryBox { id: string; name: string; x: number; y: number; width: number; height: number; }
interface ProductView { id: string; name: string; imageUrl: string; aiHint?: string; boundaryBoxes: BoundaryBox[]; price?: number; }
interface ColorGroupOptions { selectedVariationIds: string[]; variantViewImages: Record<string, { imageUrl: string; aiHint?: string }>; }

export interface ProductOptionsFirestoreData {
  id: string; // Product ID
  name: string;
  description: string;
  price: number;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  defaultViews: ProductView[];
  optionsByColor: Record<string, ColorGroupOptions>;
  groupingAttributeName: string | null;
  lastSaved?: any; // Firestore server timestamp
  createdAt?: any; // Firestore server timestamp
}

export async function saveProductOptionsToFirestore(
  userId: string,
  productId: string,
  options: Omit<ProductOptionsFirestoreData, 'lastSaved' | 'createdAt' | 'id'> // `id` is part of options, but used as doc ID too
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !productId) {
    return { success: false, error: 'User ID and Product ID are required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { success: false, error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userProductOptions', userId, 'products', productId);
    // Check if document exists to set createdAt only on creation
    const docSnap = await getDoc(docRef);
    const dataToSave: Partial<ProductOptionsFirestoreData> = {
      ...options,
      id: productId, // Ensure product ID is part of the stored data
      lastSaved: serverTimestamp(),
    };
    if (!docSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error saving product options to Firestore:', error);
    return { success: false, error: `Failed to save options: ${error.message}` };
  }
}

export async function loadProductOptionsFromFirestore(
  userId: string,
  productId: string
): Promise<{ options?: ProductOptionsFirestoreData; error?: string }> {
  if (!userId || !productId) {
    return { error: 'User ID and Product ID are required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userProductOptions', userId, 'products', productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ProductOptionsFirestoreData;
      // Firestore Timestamps will be handled by Firestore's SDK, 
      // or convert to Date on client: data.lastSaved = data.lastSaved?.toDate();
      return { options: data };
    } else {
      return { options: undefined }; // No options saved yet
    }
  } catch (error: any) {
    console.error('Error loading product options from Firestore:', error);
    return { error: `Failed to load options: ${error.message}` };
  }
}

export async function deleteProductOptionsFromFirestore(
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !productId) {
    return { success: false, error: 'User ID and Product ID are required.' };
  }
  if (!db) {
    console.error("Firestore not initialized. Check firebase.ts");
    return { success: false, error: 'Database service is not available.' };
  }

  try {
    const docRef = doc(db, 'userProductOptions', userId, 'products', productId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting product options from Firestore:', error);
    return { success: false, error: `Failed to delete options: ${error.message}` };
  }
}
