
"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Logo() {
  const baseLogoSrc = "/logo.png";
  // Initialize with the base source, which will be consistent between server and client initial render
  const [effectiveLogoSrc, setEffectiveLogoSrc] = useState(baseLogoSrc);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    if (process.env.NODE_ENV === 'development') {
      // Update the src to include cache-busting timestamp only on the client in dev mode
      setEffectiveLogoSrc(`${baseLogoSrc}?t=${Date.now()}`);
    }
    // If not in development, effectiveLogoSrc remains baseLogoSrc.
  }, []); // Empty dependency array ensures this runs once on mount (client-side)

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={effectiveLogoSrc} // Using key helps React re-render if src changes, ensuring new image loads
        src={effectiveLogoSrc}
        alt="Customizer Studio Logo" // Ensures alt text matches "Customizer Studio"
        fill
        style={{ objectFit: 'contain' }}
        priority // Ensures the logo loads quickly, important for LCP
      />
    </div>
  );
}
