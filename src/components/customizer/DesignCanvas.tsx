
// src/components/customizer/DesignCanvas.tsx
"use client";

import Image from 'next/image';

// In a real app, this would come from an API or a more complex state management
const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png', // Increased placeholder size
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700, // Increased width
  height: 700, // Increased height
  aiHint: 'white t-shirt'
};

export default function DesignCanvas() {
  // For now, we'll always display the default product.
  // Later, this could be dynamic based on user selection.
  const productToDisplay = defaultProduct;

  return (
    <div className="flex-grow flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px]"> {/* Adjusted min-height */}
      <div className="text-center">
        <div className="relative" style={{ width: productToDisplay.width, height: productToDisplay.height }}>
          <Image 
            src={productToDisplay.imageUrl} 
            alt={productToDisplay.imageAlt}
            width={productToDisplay.width}
            height={productToDisplay.height}
            className="rounded-md object-contain"
            data-ai-hint={productToDisplay.aiHint}
          />
          {/* Overlay for adding elements - to be implemented later */}
          {/* <div className="absolute inset-0 border-2 border-blue-500/50 rounded-md"></div> */}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">Add images, text, or designs using the tools on the left.</p>
      </div>
    </div>
  );
}
