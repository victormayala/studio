
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { ProductOptionsFirestoreData } from '@/app/dashboard/products/[productId]/options/page';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { configUserId, productId } = body;

    if (!configUserId || !productId) {
      return NextResponse.json({ error: 'Missing configUserId or productId' }, { status: 400 });
    }

    if (!db) {
      console.error("/api/product-customization-check: Firestore not initialized. Check firebase.ts");
      return NextResponse.json({ error: 'Database service is not available on the server.' }, { status: 500 });
    }

    let allowCustomization = true; // Default to true

    try {
      const docRef = doc(db, 'userProductOptions', configUserId, 'products', productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const optionsData = docSnap.data() as ProductOptionsFirestoreData;
        // If allowCustomization is explicitly set to false, respect it.
        // Otherwise (true, undefined, or null), it's considered allowed.
        if (optionsData.allowCustomization === false) {
          allowCustomization = false;
        }
      }
      // If the document doesn't exist, we default to allowCustomization = true (as initialized)
      // because no specific rule has been set to disable it.
      
      return NextResponse.json({ allowCustomization });

    } catch (firestoreError: any) {
      console.error(`Firestore error in /api/product-customization-check for configUser ${configUserId}, product ${productId}:`, firestoreError);
      // Even if Firestore fails, we might want to default to allowing customization
      // to prevent breaking product pages if there's a transient issue.
      // Or, you could return a 500 error. For now, defaulting to true for resilience.
      // If you prefer to fail closed:
      // return NextResponse.json({ error: `Error fetching product options: ${firestoreError.message}` }, { status: 500 });
      return NextResponse.json({ allowCustomization: true, warning: "Error fetching options, defaulted to allowing customization." });
    }

  } catch (error: any) {
    console.error('Error in /api/product-customization-check handler:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

