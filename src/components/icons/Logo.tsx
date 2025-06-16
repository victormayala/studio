
"use client";

import Image from 'next/image';

export function Logo() {
  // Using a static path directly.
  const logoSrc = "/logo.png"; // Ensure this file exists in your /public directory

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={logoSrc} 
        src={logoSrc}
        alt="Customizer Studio Logo" // Ensures alt text matches "Customizer Studio"
        fill
        style={{ objectFit: 'contain' }}
        priority // Ensures the logo loads quickly, important for LCP
      />
    </div>
  );
}
