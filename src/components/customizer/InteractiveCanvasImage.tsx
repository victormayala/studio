
"use client";

import Image from 'next/image';
import type { CanvasImage } from '@/contexts/UploadContext';
import { Trash2, RefreshCwIcon, MoveIcon } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import React from 'react'; // Import React for React.memo

const HANDLE_SIZE = 24; // Size of the control handles in pixels

interface InteractiveCanvasImageProps {
  image: CanvasImage;
  isSelected: boolean;
  isBeingDragged: boolean;
  baseImageDimension: number; // Receive the base dimension as a prop
  onImageSelectAndDragStart: (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, image: CanvasImage) => void;
  onRotateHandleMouseDown: (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, image: CanvasImage) => void;
  onResizeHandleMouseDown: (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, image: CanvasImage) => void;
  onRemoveHandleClick: (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, imageId: string) => void;
}

function InteractiveCanvasImageComponent({
  image,
  isSelected,
  isBeingDragged,
  baseImageDimension,
  onImageSelectAndDragStart,
  onRotateHandleMouseDown,
  onResizeHandleMouseDown,
  onRemoveHandleClick,
}: InteractiveCanvasImageProps) {
  return (
    <div
      id={`canvas-image-${image.id}`}
      className={`absolute cursor-grab group
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background z-50' : 'hover:ring-1 hover:ring-primary/50'}`}
      style={{
        top: `${image.y}%`,
        left: `${image.x}%`,
        // Use baseImageDimension for width and height calculations
        width: `${baseImageDimension * image.scale}px`,
        height: `${baseImageDimension * image.scale}px`,
        transform: `translate(-50%, -50%) rotate(${image.rotation}deg)`,
        zIndex: isSelected ? image.zIndex + 100 : image.zIndex,
        transition: isBeingDragged ? 'none' : 'transform 0.1s ease-out, border 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation(); 
        // Selection is handled by onImageSelectAndDragStart on mousedown/touchstart
      }}
      onMouseDown={(e) => onImageSelectAndDragStart(e, image)}
      onTouchStart={(e) => onImageSelectAndDragStart(e, image)}
    >
      <Image
        src={image.dataUrl}
        alt={image.name}
        fill
        style={{ objectFit: 'contain' }}
        className="rounded-sm pointer-events-none"
        priority 
      />
      {isSelected && (
        <>
          {/* Remove Button */}
          <div
            className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full p-1 cursor-pointer hover:bg-destructive/80 transition-colors flex items-center justify-center"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
            onClick={(e) => onRemoveHandleClick(e, image.id)}
            onMouseDown={(e) => e.stopPropagation()} 
            onTouchStart={(e) => { e.stopPropagation(); onRemoveHandleClick(e, image.id);}}
            title="Remove image"
          >
            <Trash2 size={HANDLE_SIZE * 0.6} />
          </div>

          {/* Rotate Handle (Top-Center) */}
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full p-1 cursor-[grab] active:cursor-[grabbing] flex items-center justify-center"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => onRotateHandleMouseDown(e, image)}
            onTouchStart={(e) => onRotateHandleMouseDown(e, image)}
            title="Rotate image"
          >
            <RefreshCwIcon size={HANDLE_SIZE * 0.6} />
          </div>

          {/* Resize Handle (Bottom-Right) */}
          <div
            className="absolute -bottom-3 -right-3 bg-primary text-primary-foreground rounded-full p-1 cursor-nwse-resize flex items-center justify-center"
            style={{ width: HANDLE_SIZE, height: HANDLE_SIZE, zIndex: 10 }}
            onMouseDown={(e) => onResizeHandleMouseDown(e, image)}
            onTouchStart={(e) => onResizeHandleMouseDown(e, image)}
            title="Resize image"
          >
            <MoveIcon size={HANDLE_SIZE * 0.6} /> {/* This icon is more for "move all directions" but commonly used for resize corner */}
          </div>
        </>
      )}
    </div>
  );
}

export const InteractiveCanvasImage = React.memo(InteractiveCanvasImageComponent);
