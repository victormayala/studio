
"use client";

import Image from 'next/image';

export function Logo() {
  const logoSrc = "/customizer-studio-logo.png"; // Using the new filename

  return (
    <div className="relative h-12 w-[180px]" aria-label="Customizer Studio Logo">
      <Image
        key={logoSrc} // Key helps if src might change, though with static new name it's less critical
        src={logoSrc}
        alt="Customizer Studio Logo"
        fill
        sizes="180px"
        style={{ objectFit: 'contain' }}
        priority // Ensures the logo loads quickly, important for LCP
      />
    </div>
  );
}
