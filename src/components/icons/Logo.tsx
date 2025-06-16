
"use client";

import Image from 'next/image';

export function Logo() {
  // Using a static path directly.
  let logoSrc = "/logo.png"; // Ensure this file exists in your /public directory

  // Add cache-busting query parameter in development
  if (process.env.NODE_ENV === 'development') {
    logoSrc = `/logo.png?t=${Date.now()}`;
  }

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={logoSrc} // Using logoSrc as key to force re-render if it changes
        src={logoSrc}
        alt="Customizer Studio Logo" // Ensures alt text matches "Customizer Studio"
        fill
        style={{ objectFit: 'contain' }}
        priority // Ensures the logo loads quickly, important for LCP
      />
    </div>
  );
}
