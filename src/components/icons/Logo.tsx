
"use client";

import Image from 'next/image';

export function Logo() {
  // Attempt to bust cache by adding a query string.
  // The value of the query string (timestamp) changes on each build/render,
  // forcing the browser to fetch the new image.
  const logoSrc = `/logo.png?v=${Date.now()}`;

  return (
    <div className="relative h-8 w-32" aria-label="Customizer Studio Logo">
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
