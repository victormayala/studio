
"use client";

import Image from 'next/image';
// Removed useState and useEffect

export function Logo() {
  // Use a static path. Cache busting should be handled by build processes or hard refresh in dev.
  const logoSrc = "/logo.png";

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        src={logoSrc}
        alt="Customizer Studio Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority // Keep priority if it's an LCP element
      />
    </div>
  );
}
