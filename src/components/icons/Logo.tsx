
"use client";

import Image from 'next/image';

export function Logo() {
  // Attempt to bust cache by adding a query string.
  const logoSrc = `/logo.png?v=${Date.now()}`;

  return (
    <div className="relative h-full w-[180px]" aria-label="Customizer Studio Logo">
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
