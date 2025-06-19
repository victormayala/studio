
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
      // This is a server configuration issue, so return 500.
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
      // If Firestore read fails, the API itself should indicate a server error.
      // The WordPress plugin will then use its "API fails -> show button" logic.
      return NextResponse.json({ error: `Server error checking product customization: ${firestoreError.message}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in /api/product-customization-check handler:', error);
    if (error instanceof SyntaxError) { // For errors like malformed JSON request body
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    // For other unexpected errors in the handler itself
    return NextResponse.json({ error: 'An unexpected error occurred processing the request' }, { status: 500 });
  }
}

