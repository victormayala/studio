// This file is intentionally left empty or can be deleted.
// The non-AI preview functionality that used node-canvas was removed
// due to build issues with native dependencies in Firebase App Hosting.
// If a preview API is needed, it would need to be reimplemented
// using a different approach (e.g., AI-based or a pure JS library if suitable).

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.warn("/api/preview endpoint was called, but it's currently disabled due to previous build issues with node-canvas. Returning error.");
  return NextResponse.json(
    { error: 'Preview generation is temporarily unavailable. Please contact support if this feature is critical.' },
    { status: 503 } // Service Unavailable
  );
}
