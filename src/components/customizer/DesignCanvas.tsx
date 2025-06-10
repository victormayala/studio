
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage } from '@/contexts/UploadContext';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveCanvasImage } from './InteractiveCanvasImage';

const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700,
  height: 700,
  aiHint: 'white t-shirt mockup'
};

const BASE_IMAGE_DIMENSION = 200; // Base size of the interactive images in pixels

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
    type: 'rotate' | 'resize' | 'move';
    imageId: string;
    startX: number; // Mouse/touch start X (viewport)
    startY: number; // Mouse/touch start Y (viewport)
    initialRotation?: number; // Image's rotation at drag start
    initialScale?: number;   // Image's scale at drag start
    initialX?: number;       // Image's center X (percentage) at drag start
    initialY?: number;       // Image's center Y (percentage) at drag start
    imageCenterX?: number;   // Image's center X in canvas pixels at drag start (for rotate/resize)
    imageCenterY?: number;   // Image's center Y in canvas pixels at drag start (for rotate/resize)
    imageInitialWidth?: number; // Unscaled width of the image (should be BASE_IMAGE_DIMENSION)
    imageInitialHeight?: number; // Unscaled height of the image (should be BASE_IMAGE_DIMENSION)
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // If the click target is the canvas itself (not an interactive child that stopped propagation)
    if (e.target === canvasRef.current) {
        selectCanvasImage(null);
    }
  };
  
  const handleImageSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    image: CanvasImage
  ) => {
    handleDragStart(e, 'move', image);
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    type: 'rotate' | 'resize' | 'move',
    image: CanvasImage
  ) => {
    e.preventDefault();
    e.stopPropagation(); 
    selectCanvasImage(image.id);

    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

    // Calculate image center relative to the canvas for rotate/resize
    const imageCenterXInCanvasPx = image.x/100 * canvasRect.width; 
    const imageCenterYInCanvasPx = image.y/100 * canvasRect.height;

    setActiveDrag({
      type,
      imageId: image.id,
      startX: coords.x,
      startY: coords.y,
      initialRotation: image.rotation,
      initialScale: image.scale,
      initialX: image.x,
      initialY: image.y,
      imageCenterX: imageCenterXInCanvasPx,
      imageCenterY: imageCenterYInCanvasPx,
      imageInitialWidth: BASE_IMAGE_DIMENSION, 
      imageInitialHeight: BASE_IMAGE_DIMENSION,
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
    } else if (type === 'resize' && initialScale !== undefined && imageInitialWidth !== undefined && imageInitialHeight !== undefined && imageCenterX !== undefined && imageCenterY !== undefined) {
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + imageCenterX), 2) + Math.pow(coords.y - (canvasRect.top + imageCenterY), 2));
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + imageCenterX), 2) + Math.pow(startY - (canvasRect.top + imageCenterY), 2));
      
      if (initialDistFromCenter === 0) return; 

      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, 10)); 
      updateCanvasImage(imageId, { scale: newScale });

    } else if (type === 'move' && initialX !== undefined && initialY !== undefined && imageInitialWidth !== undefined && imageInitialHeight !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;

        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;
        
        const currentImgScale = canvasImages.find(img => img.id === imageId)?.scale || initialScale || 1;
        const scaledImageWidthPx = imageInitialWidth * currentImgScale;
        const scaledImageHeightPx = imageInitialHeight * currentImgScale;

        const halfWidthPercent = (scaledImageWidthPx / 2 / canvasRect.width) * 100;
        const halfHeightPercent = (scaledImageHeightPx / 2 / canvasRect.height) * 100;
        
        // Clamp position so the image center cannot go too close to the edges,
        // effectively keeping the entire image within bounds.
        newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
        newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));
        
        // Prevent NaN values if canvasRect dimensions are zero
        if (isNaN(newX) || isNaN(newY)) return;

        updateCanvasImage(imageId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages]);


  const handleDragEnd = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      // Add passive: false for touchmove if preventDefault might be called inside handleDragging (though not currently for 'move')
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
      window.removeEventListener('touchmove',handleDragging);
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
      onClick={handleCanvasClick} // Deselect on canvas background click
      onTouchStart={handleCanvasClick as any} // Also for touch, though less common for "background" taps
    >
      <div className="text-center product-image-container">
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
            <InteractiveCanvasImage
              key={img.id}
              image={img}
              isSelected={img.id === selectedCanvasImageId}
              isBeingDragged={activeDrag?.imageId === img.id && activeDrag?.type === 'move'}
              baseImageDimension={BASE_IMAGE_DIMENSION} // Pass base dimension
              onImageSelectAndDragStart={handleImageSelectAndDragStart}
              onRotateHandleMouseDown={(e, imageItem) => handleDragStart(e, 'rotate', imageItem)}
              onResizeHandleMouseDown={(e, imageItem) => handleDragStart(e, 'resize', imageItem)}
              onRemoveHandleClick={handleRemoveImage}
            />
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 ? (selectedCanvasImageId ? "Drag image or handles to transform. Click background to deselect." : "Click an image to select and transform it.") : "Add images using the tools on the left."}
        </p>
      </div>
    </div>
  );
}

