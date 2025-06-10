
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage } from '@/contexts/UploadContext';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveCanvasImage } from './InteractiveCanvasImage'; // New import

const defaultProduct = {
  id: 'tshirt-white',
  name: 'Plain White T-shirt',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700,
  height: 700,
  aiHint: 'white t-shirt mockup'
};

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
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
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
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // This check ensures that if the click originated from an interactive element
    // (which should have called e.stopPropagation()), we don't deselect.
    // The target check is a fallback, direct clicks on the canvasRef div.
    if (e.target === canvasRef.current) {
        selectCanvasImage(null);
    }
  };
  
  const handleImageSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    image: CanvasImage
  ) => {
     // Allow drag start on the image itself to initiate 'move'
    handleDragStart(e, 'move', image);
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    type: 'rotate' | 'resize' | 'move',
    image: CanvasImage
  ) => {
    e.preventDefault();
    e.stopPropagation(); // Important: stop propagation here
    selectCanvasImage(image.id);

    const imageElement = document.getElementById(`canvas-image-${image.id}`);
    if (!imageElement || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

    const imageRect = imageElement.getBoundingClientRect();
    // Calculate image center relative to the canvas, considering current scale for accuracy
    const imageCenterX = image.x/100 * canvasRect.width; 
    const imageCenterY = image.y/100 * canvasRect.height;


    setActiveDrag({
      type,
      imageId: image.id,
      startX: coords.x,
      startY: coords.y,
      initialRotation: image.rotation,
      initialScale: image.scale,
      initialX: image.x,
      initialY: image.y,
      imageCenterX,
      imageCenterY,
      imageInitialWidth: imageRect.width / image.scale, // Unscaled width
      imageInitialHeight: imageRect.height / image.scale, // Unscaled height
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
    } else if (type === 'resize' && initialScale !== undefined && imageInitialWidth !== undefined && imageInitialHeight !== undefined) {
      // Calculate distance from image center to current mouse position
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + imageCenterX!), 2) + Math.pow(coords.y - (canvasRect.top + imageCenterY!), 2));
      // Calculate distance from image center to initial mouse position for resize
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + imageCenterX!), 2) + Math.pow(startY - (canvasRect.top + imageCenterY!), 2));
      
      if (initialDistFromCenter === 0) return; // Avoid division by zero

      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, 10)); // Clamp scale
      updateCanvasImage(imageId, { scale: newScale });

    } else if (type === 'move' && initialX !== undefined && initialY !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;

        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;
        
        // Clamping logic needs to be aware of the image's display size (scaled size)
        // The image's actual pixel dimensions on canvas are (imageInitialWidth * currentScale)
        // For clamping, we need half of this, converted to percentage of canvas
        const currentScale = canvasImages.find(img => img.id === imageId)?.scale || initialScale || 1;
        const scaledImageWidthPx = (imageInitialWidth || 200) * currentScale;
        const scaledImageHeightPx = (imageInitialHeight || 200) * currentScale;

        const halfWidthPercent = (scaledImageWidthPx / 2 / canvasRect.width) * 100;
        const halfHeightPercent = (scaledImageHeightPx / 2 / canvasRect.height) * 100;

        newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
        newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));

        updateCanvasImage(imageId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages]);


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
    e.stopPropagation(); // Important
    removeCanvasImage(imageId);
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden"
      onClick={handleCanvasClick}
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
              onImageSelectAndDragStart={handleImageSelectAndDragStart}
              onRotateHandleMouseDown={(e, image) => handleDragStart(e, 'rotate', image)}
              onResizeHandleMouseDown={(e, image) => handleDragStart(e, 'resize', image)}
              onRemoveHandleClick={handleRemoveImage}
            />
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 ? (selectedCanvasImageId ? "Drag handles to transform. Click background to deselect." : "Click an image to select it.") : "Add images using the tools on the left."}
        </p>
      </div>
    </div>
  );
}
