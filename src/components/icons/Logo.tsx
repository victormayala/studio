
"use client";

import Image from 'next/image';

export function Logo() {
  // Using a static path directly.
  // The dynamic version with Date.now() for cache-busting can sometimes
  // interact subtly with hydration if the key/src change immediately after mount
  // causes issues with how Next.js/React reconciles the initial render.
  // For simplicity and to rule this out as a source of hydration errors,
  // we use a static path.
  const logoSrc = "/logo.png";

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={logoSrc} // Key is now static based on the src
        src={logoSrc}
        alt="Customizer Studio Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}
