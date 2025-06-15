
"use client";

import Image from 'next/image';

export function Logo() {
  // Original image dimensions: 327x82
  // Target height: 32px (Tailwind h-8)
  // Calculated width: 327 * (32 / 82) = approx 128px (Tailwind w-32)
  return (
    <div className="relative h-8 w-32" aria-label="Customizer Studio Logo">
      <Image
        src="/logo.png" // Removed timestamp
        alt="Customizer Studio Logo"
        fill
        style={{ objectFit: 'contain' }} // Ensures the entire logo is visible and maintains aspect ratio
        priority // Good for LCP elements like logos in headers
      />
    </div>
  );
}
