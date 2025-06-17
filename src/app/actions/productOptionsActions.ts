
'use server';

import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore'; // Removed getDoc, setDoc, serverTimestamp
import type { ProductOptionsFirestoreData } from '@/app/dashboard/products/[productId]/options/page'; // Adjusted import if needed


// The saveProductOptionsToFirestore function is removed from here as its logic
// has been moved to the client-side in src/app/dashboard/products/[productId]/options/page.tsx
// to correctly use the client's Firebase auth context for Firestore security rules.

// The loadProductOptionsFromFirestore function is removed from here as its logic
// has been moved to the client-side in src/app/dashboard/products/[productId]/options/page.tsx
// to correctly use the client's Firebase auth context for Firestore security rules.


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

// Export the interface if it's defined here and needed elsewhere,
// or ensure it's correctly imported from its definition file (options/page.tsx in this case)
export type { ProductOptionsFirestoreData };

