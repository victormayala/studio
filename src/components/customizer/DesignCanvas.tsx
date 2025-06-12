
"use client";

import Image from 'next/image';
import { useUploads, type CanvasImage, type CanvasText, type CanvasShape } from '@/contexts/UploadContext';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { InteractiveCanvasImage } from './InteractiveCanvasImage';
import { InteractiveCanvasText } from './InteractiveCanvasText';
import { InteractiveCanvasShape } from './InteractiveCanvasShape';

interface BoundaryBox {
  id: string;
  name: string;
  x: number; 
  y: number; 
  width: number;
  height: number;
}

const defaultProductBase = {
  name: 'Plain White T-shirt (Default)',
  imageUrl: 'https://placehold.co/700x700.png',
  imageAlt: 'Plain white T-shirt ready for customization',
  width: 700,
  height: 700,
  aiHint: 't-shirt mockup',
};

const BASE_IMAGE_DIMENSION = 200;
const BASE_TEXT_DIMENSION_APPROX_WIDTH = 100; // Approx width for unscaled text 
const BASE_TEXT_DIMENSION_APPROX_HEIGHT = 50; // Approx height for unscaled text
const BASE_SHAPE_DIMENSION = 100; // Base for shapes, actual depends on shape.width/height

interface DesignCanvasProps {
  productImageUrl?: string;
  productImageAlt?: string;
  productImageAiHint?: string;
  productDefinedBoundaryBoxes?: BoundaryBox[];
}

export default function DesignCanvas({ 
  productImageUrl,
  productImageAlt,
  productImageAiHint,
  productDefinedBoundaryBoxes = [] // Default to empty array
}: DesignCanvasProps) {

  const productToDisplay = {
    ...defaultProductBase,
    imageUrl: productImageUrl || defaultProductBase.imageUrl,
    imageAlt: productImageAlt || defaultProductBase.imageAlt,
    aiHint: productImageAiHint || defaultProductBase.aiHint,
  };
  
  const {
    canvasImages, selectCanvasImage, selectedCanvasImageId, updateCanvasImage, removeCanvasImage,
    canvasTexts, selectCanvasText, selectedCanvasTextId, updateCanvasText, removeCanvasText,
    canvasShapes, selectCanvasShape, selectedCanvasShapeId, updateCanvasShape, removeCanvasShape,
  } = useUploads();

  const [activeDrag, setActiveDrag] = useState<{
    type: 'rotate' | 'resize' | 'move';
    itemId: string;
    itemType: 'image' | 'text' | 'shape';
    startX: number;
    startY: number;
    initialRotation?: number;
    initialScale?: number;
    initialX?: number;
    initialY?: number;
    itemCenterX?: number; // Center of item in pixels relative to canvasRef's top-left
    itemCenterY?: number;
    itemInitialWidth?: number; // Unscaled base width in pixels
    itemInitialHeight?: number; // Unscaled base height in pixels
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null); // This will now refer to the product image container
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);


  // Effect to snap newly added items to the first boundary box
  useEffect(() => {
    if (!canvasRef.current || productDefinedBoundaryBoxes.length === 0) return;

    const checkAndMoveItem = (item: CanvasImage | CanvasText | CanvasShape, updateFunc: (id: string, updates: Partial<any>) => void) => {
      // Check if item is new (e.g. at default 50,50 and not yet explicitly moved by this effect)
      // and a boundary box exists.
      // A more robust check might involve a flag on the item or comparing its ID to a 'lastProcessedNewItemId'
      if (item.x === 50 && item.y === 50 && item.id === lastAddedItemId) {
        const firstBox = productDefinedBoundaryBoxes[0];
        const newX = firstBox.x + firstBox.width / 2;
        const newY = firstBox.y + firstBox.height / 2;
        updateFunc(item.id, { x: newX, y: newY });
        setLastAddedItemId(null); // Reset after moving
      }
    };
    
    if (lastAddedItemId) {
        const newImage = canvasImages.find(img => img.id === lastAddedItemId);
        if (newImage) checkAndMoveItem(newImage, updateCanvasImage);

        const newText = canvasTexts.find(txt => txt.id === lastAddedItemId);
        if (newText) checkAndMoveItem(newText, updateCanvasText);

        const newShape = canvasShapes.find(shp => shp.id === lastAddedItemId);
        if (newShape) checkAndMoveItem(newShape, updateCanvasShape);
    }

  }, [canvasImages, canvasTexts, canvasShapes, productDefinedBoundaryBoxes, updateCanvasImage, updateCanvasText, updateCanvasShape, lastAddedItemId]);

  // Capture the ID of the most recently added item to trigger the snap effect
  useEffect(() => {
    if (canvasImages.length > 0) {
        const latestImage = canvasImages[canvasImages.length -1];
        if (latestImage && latestImage.x === 50 && latestImage.y === 50) setLastAddedItemId(latestImage.id);
    }
  }, [canvasImages]);
    useEffect(() => {
    if (canvasTexts.length > 0) {
        const latestText = canvasTexts[canvasTexts.length -1];
        if (latestText && latestText.x === 50 && latestText.y === 50) setLastAddedItemId(latestText.id);
    }
  }, [canvasTexts]);
    useEffect(() => {
    if (canvasShapes.length > 0) {
        const latestShape = canvasShapes[canvasShapes.length -1];
        if (latestShape && latestShape.x === 50 && latestShape.y === 50) setLastAddedItemId(latestShape.id);
    }
  }, [canvasShapes]);


  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent<SVGElement> | ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // If click is on canvasRef (image container) or the outer product-image-container, deselect.
    if (target === canvasRef.current || target.classList.contains('product-image-outer-container')) {
        selectCanvasImage(null);
        selectCanvasText(null);
        selectCanvasShape(null);
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

  const handleShapeSelectAndDragStart = (
    e: ReactMouseEvent<SVGElement> | ReactTouchEvent<SVGElement>,
    shape: CanvasShape
  ) => {
    if (shape.isLocked) return;
    handleDragStart(e, 'move', shape, 'shape');
  };

  const handleDragStart = (
    e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<SVGElement> | ReactTouchEvent<SVGElement>,
    type: 'rotate' | 'resize' | 'move',
    item: CanvasImage | CanvasText | CanvasShape,
    itemType: 'image' | 'text' | 'shape'
  ) => {
    if (item.isLocked && type !== 'move') return; // Allow selecting locked items to unlock
    if (item.isLocked && type === 'move') return; // Prevent moving locked items

    e.preventDefault();
    e.stopPropagation();
    
    if (itemType === 'image') { selectCanvasImage(item.id); selectCanvasText(null); selectCanvasShape(null); }
    else if (itemType === 'text') { selectCanvasText(item.id); selectCanvasImage(null); selectCanvasShape(null); }
    else if (itemType === 'shape') { selectCanvasShape(item.id); selectCanvasImage(null); selectCanvasText(null); }

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

    // Calculate item's center in pixels relative to canvasRef's top-left
    const itemCenterXInCanvasPx = item.x/100 * canvasRect.width;
    const itemCenterYInCanvasPx = item.y/100 * canvasRect.height;
    
    let itemInitialUnscaledWidth = 0;
    let itemInitialUnscaledHeight = 0;

    if (itemType === 'image') {
        itemInitialUnscaledWidth = BASE_IMAGE_DIMENSION;
        itemInitialUnscaledHeight = BASE_IMAGE_DIMENSION;
    } else if (itemType === 'text') {
        const textEl = document.getElementById(`canvas-text-${item.id}`);
        if (textEl) {
            itemInitialUnscaledWidth = textEl.offsetWidth / item.scale; // Get unscaled width
            itemInitialUnscaledHeight = textEl.offsetHeight / item.scale; // Get unscaled height
        } else {
            itemInitialUnscaledWidth = BASE_TEXT_DIMENSION_APPROX_WIDTH;
            itemInitialUnscaledHeight = BASE_TEXT_DIMENSION_APPROX_HEIGHT;
        }
    } else if (itemType === 'shape') {
        const shapeItem = item as CanvasShape;
        itemInitialUnscaledWidth = shapeItem.width; 
        itemInitialUnscaledHeight = shapeItem.height;
    }

    setActiveDrag({
      type, itemId: item.id, itemType,
      startX: coords.x, startY: coords.y,
      initialRotation: item.rotation, initialScale: item.scale,
      initialX: item.x, initialY: item.y,
      itemCenterX: itemCenterXInCanvasPx, itemCenterY: itemCenterYInCanvasPx,
      itemInitialWidth: itemInitialUnscaledWidth, itemInitialHeight: itemInitialUnscaledHeight,
    });
  };

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !canvasRef.current) return;
    
    let activeItemData: CanvasImage | CanvasText | CanvasShape | undefined;
    if (activeDrag.itemType === 'image') activeItemData = canvasImages.find(img => img.id === activeDrag.itemId);
    else if (activeDrag.itemType === 'text') activeItemData = canvasTexts.find(txt => txt.id === activeDrag.itemId);
    else if (activeDrag.itemType === 'shape') activeItemData = canvasShapes.find(shp => shp.id === activeDrag.itemId);

    if (activeItemData?.isLocked) { setActiveDrag(null); return; }

    const coords = getMouseOrTouchCoords(e);
    const {
        type, itemId, itemType, startX, startY,
        initialRotation, initialScale, initialX, initialY,
        itemCenterX, itemCenterY, itemInitialWidth, itemInitialHeight
    } = activeDrag;

    if (initialRotation === undefined || initialScale === undefined || initialX === undefined || initialY === undefined || itemCenterX === undefined || itemCenterY === undefined || itemInitialWidth === undefined || itemInitialHeight === undefined) {
        console.warn("Dragging with undefined initial values", activeDrag);
        return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (type === 'rotate') {
      const angle = Math.atan2(coords.y - (canvasRect.top + itemCenterY) , coords.x - (canvasRect.left + itemCenterX)) * (180 / Math.PI);
      const startAngle = Math.atan2(startY - (canvasRect.top + itemCenterY), startX - (canvasRect.left + itemCenterX)) * (180 / Math.PI);
      let newRotation = initialRotation + (angle - startAngle);
      if (itemType === 'image') updateCanvasImage(itemId, { rotation: newRotation % 360 });
      else if (itemType === 'text') updateCanvasText(itemId, { rotation: newRotation % 360 });
      else if (itemType === 'shape') updateCanvasShape(itemId, { rotation: newRotation % 360 });
    } else if (type === 'resize') {
      const distFromCenter = Math.sqrt(Math.pow(coords.x - (canvasRect.left + itemCenterX), 2) + Math.pow(coords.y - (canvasRect.top + itemCenterY), 2));
      const initialDistFromCenter = Math.sqrt(Math.pow(startX - (canvasRect.left + itemCenterX), 2) + Math.pow(startY - (canvasRect.top + itemCenterY), 2));
      if (initialDistFromCenter === 0) return;
      const scaleRatio = distFromCenter / initialDistFromCenter;
      let newScale = initialScale * scaleRatio;
      newScale = Math.max(0.1, Math.min(newScale, itemType === 'text' ? 20 : 10)); // Text can scale larger
      
      if (itemType === 'image') updateCanvasImage(itemId, { scale: newScale });
      else if (itemType === 'text') updateCanvasText(itemId, { scale: newScale });
      else if (itemType === 'shape') updateCanvasShape(itemId, { scale: newScale });
    } else if (type === 'move') {
        const dx = coords.x - startX;
        const dy = coords.y - startY;
        const dxPercent = (dx / canvasRect.width) * 100;
        const dyPercent = (dy / canvasRect.height) * 100;
        let newX = initialX + dxPercent;
        let newY = initialY + dyPercent;
        
        const currentItemScaleFactor = activeItemData?.scale || initialScale;
        const scaledItemWidthPx = itemInitialWidth * currentItemScaleFactor;
        const scaledItemHeightPx = itemInitialHeight * currentItemScaleFactor;
        const itemHalfWidthPercent = (scaledItemWidthPx / 2 / canvasRect.width) * 100;
        const itemHalfHeightPercent = (scaledItemHeightPx / 2 / canvasRect.height) * 100;

        if (productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.length > 0) {
            const targetBox = productDefinedBoundaryBoxes[0]; // Constrain to the first boundary box

            const boxMinXCanvasPercent = targetBox.x;
            const boxMaxXCanvasPercent = targetBox.x + targetBox.width;
            const boxMinYCanvasPercent = targetBox.y;
            const boxMaxYCanvasPercent = targetBox.y + targetBox.height;

            let clampedX = Math.max(
                boxMinXCanvasPercent + itemHalfWidthPercent,
                Math.min(newX, boxMaxXCanvasPercent - itemHalfWidthPercent)
            );
            let clampedY = Math.max(
                boxMinYCanvasPercent + itemHalfHeightPercent,
                Math.min(newY, boxMaxYCanvasPercent - itemHalfHeightPercent)
            );

            if (itemHalfWidthPercent * 2 > targetBox.width) { // Item wider than box
                clampedX = targetBox.x + targetBox.width / 2; // Center it
            }
             if (itemHalfHeightPercent * 2 > targetBox.height) { // Item taller than box
                clampedY = targetBox.y + targetBox.height / 2; // Center it
            }
            newX = clampedX;
            newY = clampedY;
        } else {
            // Default canvas boundary clamping if no specific boxes
            newX = Math.max(itemHalfWidthPercent, Math.min(newX, 100 - itemHalfWidthPercent));
            newY = Math.max(itemHalfHeightPercent, Math.min(newY, 100 - itemHalfHeightPercent));
        }
        
        if (isNaN(newX) || isNaN(newY)) return;
        if (itemType === 'image') updateCanvasImage(itemId, { x: newX, y: newY });
        else if (itemType === 'text') updateCanvasText(itemId, { x: newX, y: newY });
        else if (itemType === 'shape') updateCanvasShape(itemId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages, updateCanvasText, canvasTexts, updateCanvasShape, canvasShapes, productDefinedBoundaryBoxes]);

  const handleDragEnd = useCallback(() => setActiveDrag(null), []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('touchmove', handleDragging, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
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
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden select-none product-image-outer-container"
      onClick={handleCanvasClick} // For deselecting items by clicking canvas background
      onTouchStart={handleCanvasClick as any} 
    >
      <div className="text-center"> {/* This div helps with centering the content below */}
        <div
          ref={canvasRef} // canvasRef is now on the direct product image container
          className="relative product-image-canvas-area bg-muted/10" // Added a class for clarity
          style={{ 
            width: productToDisplay.width, 
            height: productToDisplay.height,
            // backgroundImage: `url(${productToDisplay.imageUrl})`, // Optional: use as background
            // backgroundSize: 'contain',
            // backgroundRepeat: 'no-repeat',
            // backgroundPosition: 'center',
          }}
        >
          <Image
            src={productToDisplay.imageUrl}
            alt={productToDisplay.imageAlt}
            fill // Use fill to make image cover the canvasRef container
            className="rounded-md object-contain pointer-events-none select-none" 
            data-ai-hint={productToDisplay.aiHint}
            priority
          />

          {productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.map(box => (
            <div
              key={`defined-${box.id}`}
              className="absolute border-2 border-dashed border-primary/30 pointer-events-none"
              style={{
                left: `${box.x}%`, top: `${box.y}%`,
                width: `${box.width}%`, height: `${box.height}%`,
                zIndex: 0, 
              }}
              title={box.name}
            >
              <span className="absolute -top-5 left-0 text-xs text-primary/50 bg-background/30 px-1 rounded-t-sm">
                {box.name}
              </span>
            </div>
          ))}

          {canvasImages.map((img) => (
            <InteractiveCanvasImage
              key={`${img.id}-${img.zIndex}`} image={img}
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
              key={`${textItem.id}-${textItem.zIndex}`} textItem={textItem}
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
              key={`${shape.id}-${shape.zIndex}`} shape={shape}
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
          {productDefinedBoundaryBoxes.length > 0 ? "Items will be kept within the dashed areas. " : ""}
          {canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0 ? 
            (selectedCanvasImageId || selectedCanvasTextId || selectedCanvasShapeId ? "Click & drag item or handles to transform. Click background to deselect." : "Click an item to select and transform it.") 
            : "Add images, text or shapes using the tools on the left."}
        </p>
      </div>
    </div>
  );
}

    