
"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Logo() {
  // State for the logo source, initially the static path
  const [versionedLogoSrc, setVersionedLogoSrc] = useState("/logo.png");

  // useEffect to append a version query string on the client-side
  // This helps in cache-busting if the browser is aggressively caching
  useEffect(() => {
    // This ensures that Date.now() is only called on the client after mount
    setVersionedLogoSrc(`/logo.png?v=${Date.now()}`);
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={versionedLogoSrc} // Use the versioned path as a key
        src={versionedLogoSrc}
        alt="Customizer Studio Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority 
      />
    </div>
  );
}
