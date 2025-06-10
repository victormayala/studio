
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage, type CanvasText } from '@/contexts/UploadContext';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveCanvasImage } from './InteractiveCanvasImage';
import { InteractiveCanvasText } from './InteractiveCanvasText'; // Added

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
const BASE_TEXT_DIMENSION_APPROX = 50; // Approx base for text scaling logic

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const {
    canvasImages,
    selectCanvasImage,
    selectedCanvasImageId,
    updateCanvasImage,
    removeCanvasImage,
    canvasTexts,
    selectCanvasText,
    selectedCanvasTextId,
    updateCanvasText,
    removeCanvasText,
  } = useUploads();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'rotate' | 'resize' | 'move';
    itemId: string;
    itemType: 'image' | 'text';
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    itemCenterX?: number;
    itemCenterY?: number;
    itemInitialWidth?: number;
    itemInitialHeight?: number;
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
        selectCanvasText(null);
    }
  };

  // For Images
  const handleImageSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    image: CanvasImage
  ) => {
    if (image.isLocked) return;
    handleDragStart(e, 'move', image, 'image');
  };

  // For Text
  const handleTextSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    textItem: CanvasText
  ) => {
    if (textItem.isLocked) return;
    handleDragStart(e, 'move', textItem, 'text');
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    type: 'rotate' | 'resize' | 'move',
    item: CanvasImage | CanvasText,
    itemType: 'image' | 'text'
  ) => {
    if (item.isLocked && type !== 'move') return; 
    if (item.isLocked && type === 'move') return;


    e.preventDefault();
    e.stopPropagation();
    
    if (itemType === 'image') {
      selectCanvasImage(item.id);
      selectCanvasText(null);
    } else {
      selectCanvasText(item.id);
      selectCanvasImage(null);
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
        const textItem = item as CanvasText;
        // Estimate based on font size, very rough. Scale factor is applied to this.
        itemInitialWidth = Math.max(BASE_TEXT_DIMENSION_APPROX, textItem.fontSize * (textItem.content.length * 0.5)); 
        itemInitialHeight = Math.max(BASE_TEXT_DIMENSION_APPROX / 2, textItem.fontSize);
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
    
    const activeItemData = activeDrag.itemType === 'image' 
        ? canvasImages.find(img => img.id === activeDrag.itemId)
        : canvasTexts.find(txt => txt.id === activeDrag.itemId);

    if (activeItemData?.isLocked) {
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
      else updateCanvasText(itemId, { rotation: newRotation % 360 });
    } else if (type === 'resize' && initialScale !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined && itemCenterX !== undefined && itemCenterY !== undefined) {
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + itemCenterX), 2) + Math.pow(coords.y - (canvasRect.top + itemCenterY), 2));
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + itemCenterX), 2) + Math.pow(startY - (canvasRect.top + itemCenterY), 2));

      if (initialDistFromCenter === 0) return;

      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, itemType === 'image' ? 10 : 20)); // Allow larger scale for text
      if (itemType === 'image') updateCanvasImage(itemId, { scale: newScale });
      else updateCanvasText(itemId, { scale: newScale });
    } else if (type === 'move' && initialX !== undefined && initialY !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;

        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;
        
        // Get current scale for clamping calculations
        const currentItem = itemType === 'image' ? canvasImages.find(i => i.id === itemId) : canvasTexts.find(t => t.id === itemId);
        const currentItemScale = currentItem?.scale || initialScale || 1;

        // Use itemInitialWidth/Height from activeDrag state for clamping, scaled by current item scale
        const scaledItemWidthPx = itemInitialWidth * currentItemScale;
        const scaledItemHeightPx = itemInitialHeight * currentItemScale;

        const halfWidthPercent = (scaledItemWidthPx / 2 / canvasRect.width) * 100;
        const halfHeightPercent = (scaledItemHeightPx / 2 / canvasRect.height) * 100;
        
        // Clamp based on the item's bounding box staying within the canvas
        newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
        newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));


        if (isNaN(newX) || isNaN(newY)) return;

        if (itemType === 'image') updateCanvasImage(itemId, { x: newX, y: newY });
        else updateCanvasText(itemId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages, updateCanvasText, canvasTexts]);


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

  const handleRemoveItem = (e: ReactMouseEvent | ReactTouchEvent, itemId: string, itemType: 'image' | 'text') => {
    e.stopPropagation();
    if (itemType === 'image') {
      removeCanvasImage(itemId);
    } else {
      removeCanvasText(itemId);
    }
  };


  return (
    <div
      ref={canvasRef}
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden"
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasClick as any} // For touch devices to deselect
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
              onRemoveHandleClick={(e, imageId) => handleRemoveItem(e, imageId, 'image')}
            />
          ))}

          {canvasTexts.map((textItem) => (
            <InteractiveCanvasText
              key={textItem.id}
              textItem={textItem}
              isSelected={textItem.id === selectedCanvasTextId && !textItem.isLocked}
              isBeingDragged={activeDrag?.itemId === textItem.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'text'}
              onTextSelect={selectCanvasText}
              onTextSelectAndDragStart={handleTextSelectAndDragStart}
              onRotateHandleMouseDown={(e, item) => handleDragStart(e, 'rotate', item, 'text')}
              onResizeHandleMouseDown={(e, item) => handleDragStart(e, 'resize', item, 'text')}
              onRemoveHandleClick={(e, textId) => handleRemoveItem(e, textId, 'text')}
            />
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
