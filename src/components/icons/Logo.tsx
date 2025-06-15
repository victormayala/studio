
"use client";

import Image from 'next/image';

export function Logo() {
  // The dynamic timestamp was causing hydration errors.
  // Next.js handles static asset caching effectively.
  const logoSrc = "/logo.png";

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        src={logoSrc}
        alt="Customizer Studio Logo"
        fill
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}
