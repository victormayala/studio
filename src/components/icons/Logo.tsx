
"use client";

import Image from 'next/image';

export function Logo() {
  // Use a static path. Cache busting should be handled by a hard refresh in dev if the file is replaced.
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
