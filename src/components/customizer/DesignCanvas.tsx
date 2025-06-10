
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage, type CanvasText, type CanvasShape } from '@/contexts/UploadContext';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveCanvasImage } from './InteractiveCanvasImage';
import { InteractiveCanvasText } from './InteractiveCanvasText';
import { InteractiveCanvasShape } from './InteractiveCanvasShape'; // Added import

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
const BASE_TEXT_DIMENSION_APPROX = 50; 
const BASE_SHAPE_DIMENSION = 100; // Default base size for shapes

export default function DesignCanvas() {
  const productToDisplay = defaultProduct;
  const {
    canvasImages, selectCanvasImage, selectedCanvasImageId, updateCanvasImage, removeCanvasImage,
    canvasTexts, selectCanvasText, selectedCanvasTextId, updateCanvasText, removeCanvasText,
    canvasShapes, selectCanvasShape, selectedCanvasShapeId, updateCanvasShape, removeCanvasShape, // Added shape context items
  } = useUploads();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'rotate' | 'resize' | 'move';
    itemId: string;
    itemType: 'image' | 'text' | 'shape'; // Added 'shape'
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

  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent<SVGElement> | ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
        selectCanvasImage(null);
        selectCanvasText(null);
        selectCanvasShape(null); // Deselect shape
    }
  };

  const handleImageSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    image: CanvasImage
  ) => {
    if (image.isLocked) return;
    handleDragStart(e, 'move', image, 'image');
  };

  const handleTextSelectAndDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>,
    textItem: CanvasText
  ) => {
    if (textItem.isLocked) return;
    handleDragStart(e, 'move', textItem, 'text');
  };

  const handleShapeSelectAndDragStart = ( // Added for shapes
    e: ReactMouseEvent<SVGElement> | ReactTouchEvent<SVGElement>, // Event target is SVG for shapes
    shape: CanvasShape
  ) => {
    if (shape.isLocked) return;
    handleDragStart(e, 'move', shape, 'shape');
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<SVGElement> | ReactTouchEvent<SVGElement>,
    type: 'rotate' | 'resize' | 'move',
    item: CanvasImage | CanvasText | CanvasShape, // Added CanvasShape
    itemType: 'image' | 'text' | 'shape' // Added 'shape'
  ) => {
    if (item.isLocked && type !== 'move') return;
    if (item.isLocked && type === 'move') return;

    e.preventDefault();
    e.stopPropagation();
    
    if (itemType === 'image') {
      selectCanvasImage(item.id);
      selectCanvasText(null);
      selectCanvasShape(null);
    } else if (itemType === 'text') {
      selectCanvasText(item.id);
      selectCanvasImage(null);
      selectCanvasShape(null);
    } else if (itemType === 'shape') {
      selectCanvasShape(item.id);
      selectCanvasImage(null);
      selectCanvasText(null);
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
    } else if (itemType === 'text') {
        const textItem = item as CanvasText;
        itemInitialWidth = Math.max(BASE_TEXT_DIMENSION_APPROX, textItem.fontSize * (textItem.content.length * 0.5)); 
        itemInitialHeight = Math.max(BASE_TEXT_DIMENSION_APPROX / 2, textItem.fontSize);
    } else if (itemType === 'shape') {
        const shapeItem = item as CanvasShape;
        itemInitialWidth = shapeItem.width; // Use actual base width/height from shape data
        itemInitialHeight = shapeItem.height;
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
    
    let activeItemData: CanvasImage | CanvasText | CanvasShape | undefined;
    if (activeDrag.itemType === 'image') activeItemData = canvasImages.find(img => img.id === activeDrag.itemId);
    else if (activeDrag.itemType === 'text') activeItemData = canvasTexts.find(txt => txt.id === activeDrag.itemId);
    else if (activeDrag.itemType === 'shape') activeItemData = canvasShapes.find(shp => shp.id === activeDrag.itemId);


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
      else if (itemType === 'text') updateCanvasText(itemId, { rotation: newRotation % 360 });
      else if (itemType === 'shape') updateCanvasShape(itemId, { rotation: newRotation % 360 });
    } else if (type === 'resize' && initialScale !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined && itemCenterX !== undefined && itemCenterY !== undefined) {
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + itemCenterX), 2) + Math.pow(coords.y - (canvasRect.top + itemCenterY), 2));
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + itemCenterX), 2) + Math.pow(startY - (canvasRect.top + itemCenterY), 2));

      if (initialDistFromCenter === 0) return;

      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, itemType === 'image' ? 10 : (itemType === 'text' ? 20 : 10))); // Max scale for shapes also 10
      
      if (itemType === 'image') updateCanvasImage(itemId, { scale: newScale });
      else if (itemType === 'text') updateCanvasText(itemId, { scale: newScale });
      else if (itemType === 'shape') updateCanvasShape(itemId, { scale: newScale });
    } else if (type === 'move' && initialX !== undefined && initialY !== undefined && itemInitialWidth !== undefined && itemInitialHeight !== undefined) {
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;

        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;
        
        let currentItem;
        if (itemType === 'image') currentItem = canvasImages.find(i => i.id === itemId);
        else if (itemType === 'text') currentItem = canvasTexts.find(t => t.id === itemId);
        else if (itemType === 'shape') currentItem = canvasShapes.find(s => s.id === itemId);
        
        const currentItemScale = currentItem?.scale || initialScale || 1;

        const scaledItemWidthPx = itemInitialWidth * currentItemScale;
        const scaledItemHeightPx = itemInitialHeight * currentItemScale;

        const halfWidthPercent = (scaledItemWidthPx / 2 / canvasRect.width) * 100;
        const halfHeightPercent = (scaledItemHeightPx / 2 / canvasRect.height) * 100;
        
        newX = Math.max(halfWidthPercent, Math.min(newX, 100 - halfWidthPercent));
        newY = Math.max(halfHeightPercent, Math.min(newY, 100 - halfHeightPercent));

        if (isNaN(newX) || isNaN(newY)) return;

        if (itemType === 'image') updateCanvasImage(itemId, { x: newX, y: newY });
        else if (itemType === 'text') updateCanvasText(itemId, { x: newX, y: newY });
        else if (itemType === 'shape') updateCanvasShape(itemId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages, updateCanvasText, canvasTexts, updateCanvasShape, canvasShapes]);


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

  const handleRemoveItem = (e: ReactMouseEvent | ReactTouchEvent, itemId: string, itemType: 'image' | 'text' | 'shape') => {
    e.stopPropagation();
    if (itemType === 'image') removeCanvasImage(itemId);
    else if (itemType === 'text') removeCanvasText(itemId);
    else if (itemType === 'shape') removeCanvasShape(itemId);
  };


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
              key={`${img.id}-${img.zIndex}`}
              image={img}
              isSelected={img.id === selectedCanvasImageId && !img.isLocked}
              isBeingDragged={activeDrag?.itemId === img.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'image'}
              baseImageDimension={BASE_IMAGE_DIMENSION}
              onImageSelect={selectCanvasImage}
              onImageSelectAndDragStart={handleImageSelectAndDragStart}
              onRotateHandleMouseDown={(e, item) => handleDragStart(e, 'rotate', item, 'image')}
              onResizeHandleMouseDown={(e, item) => handleDragStart(e, 'resize', item, 'image')}
              onRemoveHandleClick={(e, id) => handleRemoveItem(e, id, 'image')}
            />
          ))}

          {canvasTexts.map((textItem) => (
            <InteractiveCanvasText
              key={`${textItem.id}-${textItem.zIndex}`}
              textItem={textItem}
              isSelected={textItem.id === selectedCanvasTextId && !textItem.isLocked}
              isBeingDragged={activeDrag?.itemId === textItem.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'text'}
              onTextSelect={selectCanvasText}
              onTextSelectAndDragStart={handleTextSelectAndDragStart}
              onRotateHandleMouseDown={(e, item) => handleDragStart(e, 'rotate', item, 'text')}
              onResizeHandleMouseDown={(e, item) => handleDragStart(e, 'resize', item, 'text')}
              onRemoveHandleClick={(e, id) => handleRemoveItem(e, id, 'text')}
            />
          ))}

          {canvasShapes.map((shape) => (
            <InteractiveCanvasShape
              key={`${shape.id}-${shape.zIndex}`}
              shape={shape}
              isSelected={shape.id === selectedCanvasShapeId && !shape.isLocked}
              isBeingDragged={activeDrag?.itemId === shape.id && activeDrag?.type === 'move' && activeDrag?.itemType === 'shape'}
              onShapeSelect={selectCanvasShape}
              onShapeSelectAndDragStart={handleShapeSelectAndDragStart}
              onRotateHandleMouseDown={(e, item) => handleDragStart(e, 'rotate', item, 'shape')}
              onResizeHandleMouseDown={(e, item) => handleDragStart(e, 'resize', item, 'shape')}
              onRemoveHandleClick={(e, id) => handleRemoveItem(e, id, 'shape')}
            />
          ))}
        </div>
        <p className="mt-4 text-muted-foreground font-medium">{productToDisplay.name}</p>
        <p className="text-sm text-muted-foreground">
          {canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0 ? 
            (selectedCanvasImageId || selectedCanvasTextId || selectedCanvasShapeId ? "Click & drag item or handles to transform. Click background to deselect." : "Click an item to select and transform it.") 
            : "Add images, text or shapes using the tools on the left."}
        </p>
      </div>
    </div>
  );
}
