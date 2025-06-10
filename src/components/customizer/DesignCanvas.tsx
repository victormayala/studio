
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
    type: 'rotate' | 'resize' | 'move'; // Added 'move'
    imageId: string;
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    initialX?: number; // For moving
    initialY?: number; // For moving
    imageCenterX?: number;
    imageCenterY?: number;
    imageInitialWidth?: number;
    imageInitialHeight?: number;
  } | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    // Fallback for mouse events or if touches is empty (e.g. touchend)
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // If the click target is the canvas itself (not an image or handle which would stop propagation)
    // then deselect the current image.
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('product-image-container')) {
        selectCanvasImage(null);
    }
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, 
    type: 'rotate' | 'resize' | 'move', 
    image: CanvasImage
  ) => {
    e.preventDefault();
    e.stopPropagation();
    selectCanvasImage(image.id); 

    const imageElement = document.getElementById(`canvas-image-${image.id}`);
    if (!imageElement || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);
    
    // Calculate image center relative to the canvas for rotation
    const imageRect = imageElement.getBoundingClientRect();
    const imageCenterX = imageRect.left + imageRect.width / 2 - canvasRect.left;
    const imageCenterY = imageRect.top + imageRect.height / 2 - canvasRect.top;

    setActiveDrag({
      type,
      imageId: image.id,
      startX: coords.x,
      startY: coords.y,
      initialRotation: image.rotation,
      initialScale: image.scale,
      initialX: image.x, // Store initial percentage position
      initialY: image.y, // Store initial percentage position
      imageCenterX,
      imageCenterY,
      imageInitialWidth: imageRect.width / image.scale, 
      imageInitialHeight: imageRect.height / image.scale,
    });
  };

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !canvasRef.current) return;

    const coords = getMouseOrTouchCoords(e);
    const { 
        type, imageId, startX, startY, 
        initialRotation, initialScale, initialX, initialY,
        imageCenterX, imageCenterY, imageInitialWidth, imageInitialHeight 
    } = activeDrag;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (type === 'rotate' && initialRotation !== undefined && imageCenterX !== undefined && imageCenterY !== undefined) {
      const angle = Math.atan2(coords.y - (canvasRect.top + imageCenterY) , coords.x - (canvasRect.left + imageCenterX)) * (180 / Math.PI);
      const startAngle = Math.atan2(startY - (canvasRect.top + imageCenterY), startX - (canvasRect.left + imageCenterX)) * (180 / Math.PI);
      let newRotation = initialRotation + (angle - startAngle);
      updateCanvasImage(imageId, { rotation: newRotation % 360 });
    } else if (type === 'resize' && initialScale !== undefined && imageInitialWidth !== undefined ) {
      const dx = coords.x - startX;
      const scaleFactor = dx / (imageInitialWidth / 2) ; 
      let newScale = initialScale + scaleFactor;
      newScale = Math.max(0.1, Math.min(newScale, 10)); 
      updateCanvasImage(imageId, { scale: newScale });
    } else if (type === 'move' && initialX !== undefined && initialY !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        // Convert pixel delta to percentage delta based on canvas size
        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;
        
        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;

        // Basic boundary collision (can be improved)
        // Assuming image dimensions are roughly 200px base for these checks
        const approxImgWidthPercent = ( (200 * (initialScale || 1)) / canvasRect.width) * 100;
        const approxImgHeightPercent = ( (200 * (initialScale || 1)) / canvasRect.height) * 100;

        newX = Math.max(approxImgWidthPercent / 2, Math.min(newX, 100 - approxImgWidthPercent / 2));
        newY = Math.max(approxImgHeightPercent / 2, Math.min(newY, 100 - approxImgHeightPercent / 2));

        updateCanvasImage(imageId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage]);


  const handleDragEnd = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('touchmove', handleDragging, { passive: false });
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
  
  const handleRemoveImage = (e: ReactMouseEvent | ReactTouchEvent, imageId: string) => {
    e.stopPropagation(); 
    removeCanvasImage(imageId);
  };

  return (
    <div 
      ref={canvasRef} 
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden"
      onClick={handleCanvasClick}
    >
      <div className="text-center product-image-container"> {/* Added class for more specific targeting */}
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
                width: `${200 * img.scale}px`, 
                height: `${200 * img.scale}px`, 
                transform: `translate(-50%, -50%) rotate(${img.rotation}deg)`,
                zIndex: img.id === selectedCanvasImageId ? img.zIndex + 100 : img.zIndex, 
                transition: activeDrag?.imageId === img.id ? 'none' : 'transform 0.1s ease-out, border 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
              }}
              onClick={(e) => { e.stopPropagation(); selectCanvasImage(img.id); }}
              onMouseDown={(e) => handleDragStart(e, 'move', img)}
              onTouchStart={(e) => handleDragStart(e, 'move', img)}
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
                    className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-1 cursor-pointer hover:bg-destructive/80 transition-colors flex items-center justify-center"
                    style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
                    onClick={(e) => handleRemoveImage(e, img.id)}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking remove
                    onTouchStart={(e) => { e.stopPropagation(); handleRemoveImage(e, img.id);}} 
                    title="Remove image"
                  >
                    <Trash2 size={HANDLE_SIZE * 0.6} />
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
                     <MoveIcon size={HANDLE_SIZE * 0.6} /> 
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 ? (selectedCanvasImageId ? "Click an image on the canvas to select it." : "Click an image or the background.") : "Add images using the tools on the left."}
        </p>
      </div>
    </div>
  );
}

