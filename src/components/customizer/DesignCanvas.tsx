
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage } from '@/contexts/UploadContext';
import { Trash2, RefreshCwIcon, MoveIcon } from 'lucide-react'; // Using RefreshCwIcon for rotate, MoveIcon for resize (placeholder)
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700,
  height: 700,
  aiHint: 'white t-shirt mockup'
};

const HANDLE_SIZE = 24; // Size of the control handles in pixels
const HANDLE_OFFSET = HANDLE_SIZE / 2;

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const { 
    canvasImages, 
    selectCanvasImage, 
    selectedCanvasImageId, 
    updateCanvasImage, 
    removeCanvasImage 
  } = useUploads();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'rotate' | 'resize';
    imageId: string;
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    imageCenterX?: number;
    imageCenterY?: number;
    imageInitialWidth?: number;
    imageInitialHeight?: number;
  } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, 
    type: 'rotate' | 'resize', 
    image: CanvasImage
  ) => {
    e.preventDefault();
    e.stopPropagation();
    selectCanvasImage(image.id); // Ensure image is selected

    const imageElement = document.getElementById(`canvas-image-${image.id}`);
    if (!imageElement || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const imageRect = imageElement.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

    const imageCenterX = imageRect.left + imageRect.width / 2 - canvasRect.left;
    const imageCenterY = imageRect.top + imageRect.height / 2 - canvasRect.top;

    setActiveDrag({
      type,
      imageId: image.id,
      startX: coords.x,
      startY: coords.y,
      initialRotation: image.rotation,
      initialScale: image.scale,
      imageCenterX,
      imageCenterY,
      imageInitialWidth: imageRect.width / image.scale, // Original unscaled width
      imageInitialHeight: imageRect.height / image.scale, // Original unscaled height
    });
  };

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !canvasRef.current) return;

    const coords = getMouseOrTouchCoords(e);
    const { type, imageId, startX, startY, initialRotation, initialScale, imageCenterX, imageCenterY, imageInitialWidth, imageInitialHeight } = activeDrag;
    
    if (type === 'rotate' && initialRotation !== undefined && imageCenterX !== undefined && imageCenterY !== undefined) {
      const angle = Math.atan2(coords.y - (canvasRef.current.offsetTop + imageCenterY) , coords.x - (canvasRef.current.offsetLeft + imageCenterX)) * (180 / Math.PI);
      const startAngle = Math.atan2(startY - (canvasRef.current.offsetTop + imageCenterY), startX - (canvasRef.current.offsetLeft + imageCenterX)) * (180 / Math.PI);
      let newRotation = initialRotation + (angle - startAngle);
      updateCanvasImage(imageId, { rotation: newRotation % 360 });
    } else if (type === 'resize' && initialScale !== undefined && imageInitialWidth !== undefined ) {
      // Simple resize: change in X distance from start influences scale
      const dx = coords.x - startX;
      // Scale factor based on how much x has changed, relative to a portion of initial width
      const scaleFactor = dx / (imageInitialWidth / 4) ; // Arbitrary divisor for sensitivity
      let newScale = initialScale + scaleFactor;
      newScale = Math.max(0.1, Math.min(newScale, 10)); // Clamp scale
      updateCanvasImage(imageId, { scale: newScale });
    }
  }, [activeDrag, updateCanvasImage]);


  const handleDragEnd = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('touchmove', handleDragging);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragging);
      window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragging);
      window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeDrag, handleDragging, handleDragEnd]);
  
  const handleRemoveImage = (e: ReactMouseEvent, imageId: string) => {
    e.stopPropagation(); // Prevent click from bubbling to image selection
    removeCanvasImage(imageId);
  };

  return (
    <div ref={canvasRef} className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden">
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
              id={`canvas-image-${img.id}`}
              className={`absolute cursor-grab group
                          ${img.id === selectedCanvasImageId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background z-50' : 'hover:ring-1 hover:ring-primary/50'}`}
              style={{
                top: `${img.y}%`,
                left: `${img.x}%`,
                width: `${200 * img.scale}px`, // Base width * scale
                height: `${200 * img.scale}px`, // Base height * scale (maintaining aspect ratio if base is square)
                transform: `translate(-50%, -50%) rotate(${img.rotation}deg)`,
                zIndex: img.id === selectedCanvasImageId ? img.zIndex + 100 : img.zIndex, // Ensure selected is on top of others
                transition: activeDrag?.imageId === img.id ? 'none' : 'transform 0.1s ease-out, border 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
              }}
              onClick={() => selectCanvasImage(img.id)}
              // onMouseDown for drag-to-move would go here in the future
            >
              <Image
                src={img.dataUrl}
                alt={img.name}
                fill
                style={{ objectFit: 'contain' }}
                className="rounded-sm pointer-events-none"
              />
              {img.id === selectedCanvasImageId && (
                <>
                  {/* Remove Button */}
                  <div
                    className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-1 cursor-pointer hover:bg-destructive/80 transition-colors"
                    style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    onTouchStart={(e) => { e.stopPropagation(); removeCanvasImage(img.id);}} // Basic touch support
                    title="Remove image"
                  >
                    <Trash2 size={HANDLE_SIZE * 0.6} className="mx-auto my-auto" />
                  </div>

                  {/* Rotate Handle (Top-Center) */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full p-1 cursor-[grab] active:cursor-[grabbing] flex items-center justify-center"
                    style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
                    onMouseDown={(e) => handleDragStart(e, 'rotate', img)}
                    onTouchStart={(e) => handleDragStart(e, 'rotate', img)}
                    title="Rotate image"
                  >
                    <RefreshCwIcon size={HANDLE_SIZE * 0.6} />
                  </div>
                  
                  {/* Resize Handle (Bottom-Right) */}
                  <div
                    className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-full p-1 cursor-nwse-resize flex items-center justify-center"
                    style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
                    onMouseDown={(e) => handleDragStart(e, 'resize', img)}
                    onTouchStart={(e) => handleDragStart(e, 'resize', img)}
                    title="Resize image"
                  >
                     <MoveIcon size={HANDLE_SIZE * 0.6} /> {/* Placeholder icon, proper resize icon would be better */}
                  </div>
                </>
              )}
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
