
"use client";

import Image from 'next/image';
import type { CanvasImage } from '@/contexts/UploadContext';
import { Trash2, RefreshCwIcon, MoveIcon } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import React from 'react';

const HANDLE_SIZE = 24;

interface InteractiveCanvasImageProps {
  image: CanvasImage;
  isSelected: boolean;
  isBeingDragged: boolean;
  baseImageDimension: number;
  onImageSelect: (imageId: string) => void; // New prop for pure selection
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
  onImageSelect, // Destructure new prop
  onImageSelectAndDragStart,
  onRotateHandleMouseDown,
  onResizeHandleMouseDown,
  onRemoveHandleClick,
}: InteractiveCanvasImageProps) {
  const showHandles = isSelected && !image.isLocked;

  return (
    <div
      id={`canvas-image-${image.id}`}
      className={`absolute group
                  ${image.isLocked ? 'cursor-not-allowed' : 'cursor-grab'}
                  ${isSelected && !image.isLocked ? 'ring-2 ring-primary ring-offset-2 ring-offset-background z-50' : ''}
                  ${!image.isLocked ? 'hover:ring-1 hover:ring-primary/50' : ''}
                  `}
      style={{
        top: `${image.y}%`,
        left: `${image.x}%`,
        width: `${baseImageDimension * image.scale}px`,
        height: `${baseImageDimension * image.scale}px`,
        transform: `translate(-50%, -50%) rotate(${image.rotation}deg)`,
        zIndex: isSelected && !image.isLocked ? image.zIndex + 100 : image.zIndex,
        transition: isBeingDragged ? 'none' : 'transform 0.1s ease-out, border 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!image.isLocked) {
          onImageSelect(image.id); // Use the new pure selection prop
        }
      }}
      onMouseDown={(e) => {
        if (!image.isLocked) {
          onImageSelectAndDragStart(e, image); // This handles selection AND drag init
        } else {
          e.stopPropagation();
        }
      }}
      onTouchStart={(e) => {
         if (!image.isLocked) {
          onImageSelectAndDragStart(e, image); // This handles selection AND drag init
        } else {
          e.stopPropagation();
        }
      }}
    >
      <Image
        src={image.dataUrl}
        alt={image.name}
        fill
        style={{ objectFit: 'contain' }}
        className={`rounded-sm pointer-events-none ${image.isLocked ? 'opacity-75' : ''}`}
        priority
      />
      {showHandles && (
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
            <MoveIcon size={HANDLE_SIZE * 0.6} />
          </div>
        </>
      )}
    </div>
  );
}

export const InteractiveCanvasImage = React.memo(InteractiveCanvasImageComponent);
