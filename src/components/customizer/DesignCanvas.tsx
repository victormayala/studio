
"use client";

import Image from 'next/image';
import { useUploads } from '@/contexts/UploadContext';

const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700, // Increased from 600
  height: 700, // Increased from 600
  aiHint: 'white t-shirt product'
};

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const { activeUploadedImage } = useUploads();

  return (
    <div className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative">
      <div className="text-center">
        <div
          className="relative" // Parent for absolute positioning of uploaded image
          style={{ width: productToDisplay.width, height: productToDisplay.height }}
        >
          <Image 
            src={productToDisplay.imageUrl} 
            alt={productToDisplay.imageAlt}
            width={productToDisplay.width}
            height={productToDisplay.height}
            className="rounded-md object-contain"
            data-ai-hint={productToDisplay.aiHint}
            priority
          />
          
          {activeUploadedImage && (
            <div
              className="absolute inset-0 flex items-center justify-center p-8" // p-8 to give some margin from product edges
              style={{ pointerEvents: 'none' }} // Initially not interactive
            >
              <Image
                src={activeUploadedImage.dataUrl}
                alt={activeUploadedImage.name}
                fill 
                style={{ objectFit: 'contain' }}
                className="rounded-sm" // Optional: add slight rounding to uploaded image
              />
            </div>
          )}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">Add images, text, or designs using the tools on the left.</p>
      </div>
    </div>
  );
}
