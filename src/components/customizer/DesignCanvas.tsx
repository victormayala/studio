
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
const BASE_TEXT_DIMENSION_APPROX_WIDTH = 100; 
const BASE_TEXT_DIMENSION_APPROX_HEIGHT = 50; 
const BASE_SHAPE_DIMENSION = 100; 

interface DesignCanvasProps {
  productImageUrl?: string;
  productImageAlt?: string;
  productImageAiHint?: string;
  productDefinedBoundaryBoxes?: BoundaryBox[];
  activeViewId: string | null;
  showGrid: boolean;
}

export default function DesignCanvas({ 
  productImageUrl,
  productImageAlt,
  productImageAiHint,
  productDefinedBoundaryBoxes = [],
  activeViewId,
  showGrid
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
    startInteractiveOperation, endInteractiveOperation, // Import new functions
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
    itemCenterX?: number; 
    itemCenterY?: number;
    itemInitialWidth?: number; 
    itemInitialHeight?: number; 
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null); 
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);


  useEffect(() => {
    if (!canvasRef.current || !productDefinedBoundaryBoxes || productDefinedBoundaryBoxes.length === 0 || !activeViewId) return;

    const checkAndMoveItem = (item: CanvasImage | CanvasText | CanvasShape, updateFunc: (id: string, updates: Partial<any>) => void) => {
      if (item.x === 50 && item.y === 50 && item.id === lastAddedItemId && item.viewId === activeViewId) {
        const firstBox = productDefinedBoundaryBoxes[0];
        const newX = firstBox.x + firstBox.width / 2;
        const newY = firstBox.y + firstBox.height / 2;
        
        startInteractiveOperation(); // Wrap this single update as an operation for consistency if needed, or decide if it's too minor
        updateFunc(item.id, { x: newX, y: newY });
        endInteractiveOperation(); // Or simply call updateFunc if it's atomic enough not to warrant undo batching

        setLastAddedItemId(null); 
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

  }, [canvasImages, canvasTexts, canvasShapes, productDefinedBoundaryBoxes, updateCanvasImage, updateCanvasText, updateCanvasShape, lastAddedItemId, activeViewId, startInteractiveOperation, endInteractiveOperation]);

  useEffect(() => {
    if (canvasImages.length > 0) {
        const latestImage = canvasImages[canvasImages.length -1];
        if (latestImage && latestImage.x === 50 && latestImage.y === 50 && latestImage.viewId === activeViewId) setLastAddedItemId(latestImage.id);
    }
  }, [canvasImages, activeViewId]);
    useEffect(() => {
    if (canvasTexts.length > 0) {
        const latestText = canvasTexts[canvasTexts.length -1];
        if (latestText && latestText.x === 50 && latestText.y === 50 && latestText.viewId === activeViewId) setLastAddedItemId(latestText.id);
    }
  }, [canvasTexts, activeViewId]);
    useEffect(() => {
    if (canvasShapes.length > 0) {
        const latestShape = canvasShapes[canvasShapes.length -1];
        if (latestShape && latestShape.x === 50 && latestShape.y === 50 && latestShape.viewId === activeViewId) setLastAddedItemId(latestShape.id);
    }
  }, [canvasShapes, activeViewId]);


  const getMouseOrTouchCoords = (e: MouseEvent | TouchEvent | ReactMouseEvent | ReactTouchEvent<SVGElement> | ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
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
    if (item.isLocked && type !== 'move') return; 
    if (item.isLocked && type === 'move') return; 

    e.preventDefault();
    e.stopPropagation();
    
    if (itemType === 'image') { selectCanvasImage(item.id); selectCanvasText(null); selectCanvasShape(null); }
    else if (itemType === 'text') { selectCanvasText(item.id); selectCanvasImage(null); selectCanvasShape(null); }
    else if (itemType === 'shape') { selectCanvasShape(item.id); selectCanvasImage(null); selectCanvasText(null); }

    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const coords = getMouseOrTouchCoords(e);

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
            itemInitialUnscaledWidth = textEl.offsetWidth / item.scale; 
            itemInitialUnscaledHeight = textEl.offsetHeight / item.scale; 
        } else {
            itemInitialUnscaledWidth = BASE_TEXT_DIMENSION_APPROX_WIDTH;
            itemInitialUnscaledHeight = BASE_TEXT_DIMENSION_APPROX_HEIGHT;
        }
    } else if (itemType === 'shape') {
        const shapeItem = item as CanvasShape;
        itemInitialUnscaledWidth = shapeItem.width; 
        itemInitialUnscaledHeight = shapeItem.height;
    }

    startInteractiveOperation(); // Call before setting activeDrag

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
      newScale = Math.max(0.1, Math.min(newScale, itemType === 'text' ? 20 : 10)); 
      
      if (productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.length > 0 && itemInitialWidth > 0 && itemInitialHeight > 0 && canvasRect.width > 0 && canvasRect.height > 0) {
        const targetBox = productDefinedBoundaryBoxes[0]; 

        const itemCurrentXPercent = activeItemData?.x || initialX;
        const itemCurrentYPercent = activeItemData?.y || initialY;

        const distToBoxLeftEdge = itemCurrentXPercent - targetBox.x;
        const distToBoxRightEdge = (targetBox.x + targetBox.width) - itemCurrentXPercent;
        const distToBoxTopEdge = itemCurrentYPercent - targetBox.y;
        const distToBoxBottomEdge = (targetBox.y + targetBox.height) - itemCurrentYPercent;

        const maxAllowedHalfWidthPercent = Math.min(distToBoxLeftEdge, distToBoxRightEdge);
        const maxAllowedHalfHeightPercent = Math.min(distToBoxTopEdge, distToBoxBottomEdge);

        if (maxAllowedHalfWidthPercent < 0 || maxAllowedHalfHeightPercent < 0) {
            if (newScale > initialScale) { 
                 newScale = initialScale;
            }
        } else {
            const maxAllowedWidthPx = (maxAllowedHalfWidthPercent * 2 / 100) * canvasRect.width;
            const maxAllowedHeightPx = (maxAllowedHalfHeightPercent * 2 / 100) * canvasRect.height;

            const maxScaleBasedOnWidth = maxAllowedWidthPx / itemInitialWidth;
            const maxScaleBasedOnHeight = maxAllowedHeightPx / itemInitialHeight;
            
            newScale = Math.min(newScale, maxScaleBasedOnWidth, maxScaleBasedOnHeight);
        }
        newScale = Math.max(0.1, newScale); 
      }
      
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
        const scaledItemWidthPx = itemInitialWidth > 0 ? itemInitialWidth * currentItemScaleFactor : 0;
        const scaledItemHeightPx = itemInitialHeight > 0 ? itemInitialHeight * currentItemScaleFactor : 0;

        const itemHalfWidthPercent = canvasRect.width > 0 ? (scaledItemWidthPx / 2 / canvasRect.width) * 100 : 0;
        const itemHalfHeightPercent = canvasRect.height > 0 ? (scaledItemHeightPx / 2 / canvasRect.height) * 100 : 0;


        if (productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.length > 0) {
            const targetBox = productDefinedBoundaryBoxes[0]; 

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

            if (itemHalfWidthPercent * 2 > targetBox.width) { 
                clampedX = targetBox.x + targetBox.width / 2; 
            }
             if (itemHalfHeightPercent * 2 > targetBox.height) { 
                clampedY = targetBox.y + targetBox.height / 2; 
            }
            newX = clampedX;
            newY = clampedY;
        } else {
            newX = Math.max(itemHalfWidthPercent, Math.min(newX, 100 - itemHalfWidthPercent));
            newY = Math.max(itemHalfHeightPercent, Math.min(newY, 100 - itemHalfHeightPercent));
        }
        
        if (isNaN(newX) || isNaN(newY)) return;
        if (itemType === 'image') updateCanvasImage(itemId, { x: newX, y: newY });
        else if (itemType === 'text') updateCanvasText(itemId, { x: newX, y: newY });
        else if (itemType === 'shape') updateCanvasShape(itemId, { x: newX, y: newY });
    }
  }, [activeDrag, updateCanvasImage, canvasImages, updateCanvasText, canvasTexts, updateCanvasShape, canvasShapes, productDefinedBoundaryBoxes]);

  const handleDragEnd = useCallback(() => {
    endInteractiveOperation(); // Call when drag ends
    setActiveDrag(null);
  }, [endInteractiveOperation]);

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

  const visibleImages = canvasImages.filter(img => img.viewId === activeViewId);
  const visibleTexts = canvasTexts.filter(txt => txt.viewId === activeViewId);
  const visibleShapes = canvasShapes.filter(shp => shp.viewId === activeViewId);

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-card border border-dashed border-border rounded-lg shadow-inner p-4 min-h-[500px] lg:min-h-[700px] relative overflow-hidden select-none product-image-outer-container"
      onClick={handleCanvasClick} 
      onTouchStart={handleCanvasClick as any} 
    >
      <div className="text-center"> 
        <div
          ref={canvasRef} 
          className="relative product-image-canvas-area bg-muted/10" 
          style={{ 
            width: productToDisplay.width, 
            height: productToDisplay.height,
          }}
        >
          <Image
            src={productToDisplay.imageUrl}
            alt={productToDisplay.imageAlt}
            fill 
            className="rounded-md object-contain pointer-events-none select-none" 
            data-ai-hint={productToDisplay.aiHint}
            priority
          />

          {productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.length > 0 && showGrid && (
            <div
              style={{
                position: 'absolute',
                left: `${productDefinedBoundaryBoxes[0].x}%`,
                top: `${productDefinedBoundaryBoxes[0].y}%`,
                width: `${productDefinedBoundaryBoxes[0].width}%`,
                height: `${productDefinedBoundaryBoxes[0].height}%`,
                pointerEvents: 'none',
                zIndex: 0, 
                overflow: 'hidden',
                backgroundImage: `
                  repeating-linear-gradient(to right, hsla(var(--primary) / 0.8) 0, hsla(var(--primary) / 0.8) 1px, transparent 1px, transparent 100%),
                  repeating-linear-gradient(to bottom, hsla(var(--primary) / 0.8) 0, hsla(var(--primary) / 0.8) 1px, transparent 1px, transparent 100%)
                `,
                backgroundSize: '10% 10%', 
              }}
              className="grid-overlay"
            />
          )}

          {productDefinedBoundaryBoxes && productDefinedBoundaryBoxes.map(box => (
            <div
              key={`defined-${box.id}`}
              className="absolute border-2 border-dashed border-primary/30 pointer-events-none"
              style={{
                left: `${box.x}%`, top: `${box.y}%`,
                width: `${box.width}%`, height: `${box.height}%`,
                zIndex: 1, 
              }}
              title={box.name}
            >
              <span className="absolute -top-5 left-0 text-xs text-primary/50 bg-background/30 px-1 rounded-t-sm">
                {box.name}
              </span>
            </div>
          ))}

          {visibleImages.map((img) => (
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
          {visibleTexts.map((textItem) => (
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
          {visibleShapes.map((shape) => (
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
          {visibleImages.length > 0 || visibleTexts.length > 0 || visibleShapes.length > 0 ? 
            (selectedCanvasImageId || selectedCanvasTextId || selectedCanvasShapeId ? "Click & drag item or handles to transform. Click background to deselect." : "Click an item to select and transform it.") 
            : "Add images, text or shapes using the tools on the left."}
        </p>
      </div>
    </div>
  );
}

    
