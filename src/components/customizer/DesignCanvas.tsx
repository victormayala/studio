
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage } from '@/contexts/UploadContext';

const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700,
  height: 700,
  aiHint: 'white t-shirt product mockup'
};

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const { canvasImages, selectCanvasImage, selectedCanvasImageId } = useUploads();

  return (
    <div className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden">
      <div className="text-center">
        <div
          className="relative"
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

          {canvasImages.map((img) => (
            <div
              key={img.id}
              className={`absolute cursor-pointer
                          ${img.id === selectedCanvasImageId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              style={{
                top: `${img.y}%`,
                left: `${img.x}%`,
                width: '200px', // Default width, consider making this dynamic or part of CanvasImage
                height: '200px', // Default height
                transform: `translate(-50%, -50%) scale(${img.scale}) rotate(${img.rotation}deg)`,
                zIndex: img.zIndex,
                transition: 'transform 0.1s ease-out, border 0.1s ease-out'
              }}
              onClick={() => selectCanvasImage(img.id)}
              onMouseDown={(e) => {
                // Placeholder for future drag functionality
                // e.preventDefault(); 
              }}
            >
              <Image
                src={img.dataUrl}
                alt={img.name}
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-sm pointer-events-none" // pointer-events-none so click goes to parent div
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 ? "Click an image on the canvas to select it." : "Add images using the tools on the left."}
        </p>
      </div>
    </div>
  );
}
