"use client";

import Image from 'next/image';

export default function DesignCanvas() {
  return (
    <div className="flex-grow flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[400px] lg:min-h-[600px]">
      {/* Placeholder for the canvas content */}
      <div className="text-center">
        <Image 
          src="https://placehold.co/600x400.png" 
          alt="Design Canvas Placeholder" 
          width={600} 
          height={400} 
          className="rounded-md opacity-50"
          data-ai-hint="workspace mockup"
        />
        <p className="mt-4 text-muted-foreground font-medium">Your Design Canvas</p>
        <p className="text-sm text-muted-foreground">Select elements from the left panel to start designing.</p>
      </div>
    </div>
  );
}
