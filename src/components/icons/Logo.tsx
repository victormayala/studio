
"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

export function Logo() {
  const [logoSrc, setLogoSrc] = useState("/logo.png");

  useEffect(() => {
    // Apply cache-busting query param only on the client-side
    setLogoSrc(`/logo.png?v=${Date.now()}`);
  }, []);

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
