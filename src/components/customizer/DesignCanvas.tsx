
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage, type CanvasText } from '@/contexts/UploadContext'; // Added CanvasText
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

const BASE_IMAGE_DIMENSION = 200;

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const {
    canvasImages,
    selectCanvasImage,
    selectedCanvasImageId,
    updateCanvasImage,
    removeCanvasImage,
    canvasTexts, // Added
    selectCanvasText, // Added
    selectedCanvasTextId, // Added
    // updateCanvasText, // Will be needed for text manipulation
    // removeCanvasText, // Will be needed for text manipulation
  } = useUploads();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'rotate' | 'resize' | 'move';
    itemId: string; // Changed from imageId to itemId
    itemType: 'image' | 'text'; // Added itemType
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    itemCenterX?: number; // Changed from imageCenterX
    itemCenterY?: number; // Changed from imageCenterY
    itemInitialWidth?: number; // Changed from imageInitialWidth
    itemInitialHeight?: number; // Changed from imageInitialHeight
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
        selectCanvasImage(null);
        selectCanvasText(null); // Also deselect text
    }
  };

  const handleImageSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    image: CanvasImage
  ) => {
    if (image.isLocked) return;
    handleDragStart(e, 'move', image, 'image');
  };

  // Generic drag start for both images and text
  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    type: 'rotate' | 'resize' | 'move',
    item: CanvasImage | CanvasText, // Item can be image or text
    itemType: 'image' | 'text'
  ) => {
    if (item.isLocked && type !== 'move') return; // Allow selecting locked items, but not moving/transforming
    if (item.isLocked && type === 'move') return;


    e.preventDefault();
    e.stopPropagation();
    
    if (itemType === 'image') {
      selectCanvasImage(item.id);
    } else {
      selectCanvasText(item.id);
    }

    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

    const itemCenterXInCanvasPx = item.x/100 * canvasRect.width;
    const itemCenterYInCanvasPx = item.y/100 * canvasRect.height;
    
    let itemInitialWidth = 0;
    let itemInitialHeight = 0;

    if (itemType === 'image') {
        itemInitialWidth = BASE_IMAGE_DIMENSION;
        itemInitialHeight = BASE_IMAGE_DIMENSION;
    } else {
        // For text, initial width/height might be derived differently or fixed
        // For now, let's use a placeholder or calculate from rendered text later
        // This part will be crucial for text resizing.
        // For now, setting to a default or derived from item if available.
        const textItem = item as CanvasText;
        itemInitialWidth = textItem.width || 100; // Placeholder for text width
        itemInitialHeight = textItem.height || 50; // Placeholder for text height
    }


    setActiveDrag({
      type,
      itemId: item.id,
      itemType,
      startX: coords.x,
      startY: coords.y,
      initialRotation: item.rotation,
      initialScale: item.scale,
      initialX: item.x,
      initialY: item.y,
      itemCenterX: itemCenterXInCanvasPx,
      itemCenterY: itemCenterYInCanvasPx,
      itemInitialWidth,
      itemInitialHeight,
    });
  };

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !canvasRef.current) return;
    
    const activeItem = activeDrag.itemType === 'image' 
        ? canvasImages.find(img => img.id === activeDrag.itemId)
        : canvasTexts.find(txt => txt.id === activeDrag.itemId);

    if (activeItem?.isLocked) {
      setActiveDrag(null);
      return;
    }

    const coords = getMouseOrTouchCoords(e);
    const {
        type, itemId, itemType, startX, startY,
        initialRotation, initialScale, initialX, initialY,
        itemCenterX, itemCenterY, itemInitialWidth, itemInitialHeight
    } = activeDrag;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (type === 'rotate' && initialRotation !== undefined && itemCenterX !== undefined && itemCenterY !== undefined) {
      const angle = Math.atan2(coords.y - (canvasRect.top + itemCenterY) , coords.x - (canvasRect.left + itemCenterX)) * (180 / Math.PI);
      const startAngle = Math.atan2(startY - (canvasRect.top + itemCenterY), startX - (canvasRect.left + itemCenterX)) * (180 / Math.PI);
      let newRotation = initialRotation + (angle - startAngle);
      if (itemType === 'image') updateCanvasImage(itemId, { rotation: newRotation % 360 });
      // else updateCanvasText(itemId, { rotation: newRotation % 360 }); // TODO: Implement updateCanvasText
    } else if (type === 'resize' && initialScale !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined && itemCenterX !== undefined && itemCenterY !== undefined) {
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + itemCenterX), 2) + Math.pow(coords.y - (canvasRect.top + itemCenterY), 2));
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + itemCenterX), 2) + Math.pow(startY - (canvasRect.top + itemCenterY), 2));

      if (initialDistFromCenter === 0) return;

      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, 10)); // General scale limits
      if (itemType === 'image') updateCanvasImage(itemId, { scale: newScale });
      // else updateCanvasText(itemId, { scale: newScale }); // TODO: Implement updateCanvasText
    } else if (type === 'move' && initialX !== undefined && initialY !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;

        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;

        const currentItemScale = (itemType === 'image' 
            ? canvasImages.find(img => img.id === itemId)?.scale 
            : canvasTexts.find(txt => txt.id === itemId)?.scale) || initialScale || 1;
        
        const scaledItemWidthPx = itemInitialWidth * currentItemScale;
        const scaledItemHeightPx = itemInitialHeight * currentItemScale;

        const halfWidthPercent = (scaledItemWidthPx / 2 / canvasRect.width) * 100;
        const halfHeightPercent = (scaledItemHeightPx / 2 / canvasRect.height) * 100;

        newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
        newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));

        if (isNaN(newX) || isNaN(newY)) return;

        if (itemType === 'image') updateCanvasImage(itemId, { x: newX, y: newY });
        // else updateCanvasText(itemId, { x: newX, y: newY }); // TODO: Implement updateCanvasText
    }
  }, [activeDrag, updateCanvasImage, canvasImages, canvasTexts]); // Added canvasTexts


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
      window.removeEventListener('touchmove',handleDragging);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeDrag, handleDragging, handleDragEnd]);

  const handleRemoveImage = (e: ReactMouseEvent | ReactTouchEvent, imageId: string) => {
    e.stopPropagation();
    removeCanvasImage(imageId);
  };

  // Placeholder for text item interactions
  // const handleRemoveText = (e: ReactMouseEvent | ReactTouchEvent, textId: string) => {
  //   e.stopPropagation();
  //   removeCanvasText(textId);
  // };


  return (
    <div
      ref={canvasRef}
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden"
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasClick as any}
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
              isSelected={img.id === selectedCanvasImageId && !img.isLocked}
              isBeingDragged={activeDrag?.itemId === img.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'image'}
              baseImageDimension={BASE_IMAGE_DIMENSION}
              onImageSelect={selectCanvasImage}
              onImageSelectAndDragStart={handleImageSelectAndDragStart}
              onRotateHandleMouseDown={(e, imageItem) => handleDragStart(e, 'rotate', imageItem, 'image')}
              onResizeHandleMouseDown={(e, imageItem) => handleDragStart(e, 'resize', imageItem, 'image')}
              onRemoveHandleClick={handleRemoveImage}
            />
          ))}

          {/* Render Canvas Texts */}
          {canvasTexts.map((text) => (
            <div
              key={text.id}
              className={`absolute cursor-grab whitespace-nowrap ${selectedCanvasTextId === text.id && !text.isLocked ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${text.isLocked ? 'cursor-not-allowed opacity-70' : 'hover:ring-1 hover:ring-primary/50'}`}
              style={{
                top: `${text.y}%`,
                left: `${text.x}%`,
                zIndex: text.zIndex,
                color: text.color,
                fontSize: `${text.fontSize * text.scale}px`, // Apply scale to font size for now
                fontFamily: text.fontFamily,
                transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`, // Scale is applied to font size directly for now
                // transition: activeDrag?.itemId === text.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'text' ? 'none' : 'transform 0.1s ease-out, border 0.1s ease-out',
                // userSelect: 'none' // Prevent text selection during drag
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!text.isLocked) selectCanvasText(text.id);
              }}
              // onMouseDown={(e) => { // Basic move for text, more complex handles later
              //   if (!text.isLocked) handleDragStart(e, 'move', text, 'text');
              // }}
              // onTouchStart={(e) => {
              //   if (!text.isLocked) handleDragStart(e, 'move', text, 'text');
              // }}
            >
              {text.content}
              {/* TODO: Add text manipulation handles (remove, rotate, resize/edit) similar to images */}
            </div>
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 || canvasTexts.length > 0 ? 
            (selectedCanvasImageId || selectedCanvasTextId ? "Click & drag item or handles to transform. Click background to deselect." : "Click an item to select and transform it.") 
            : "Add images or text using the tools on the left."}
        </p>
      </div>
    </div>
  );
}
