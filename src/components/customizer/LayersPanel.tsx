
"use client";

import { useUploads } from '@/contexts/UploadContext';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, Layers, Copy, Trash2, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LayersPanel() {
  const { 
    canvasImages, 
    selectedCanvasImageId, 
    selectCanvasImage, 
    bringLayerForward, 
    sendLayerBackward,
    duplicateCanvasImage,
    removeCanvasImage,
    toggleLockCanvasImage
  } = useUploads();

  const sortedCanvasImages = [...canvasImages].sort((a, b) => b.zIndex - a.zIndex);

  if (canvasImages.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
        <Layers className="w-12 h-12 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-1">Layers</h3>
        <p className="text-sm">No images on the canvas yet.</p>
        <p className="text-xs mt-2">Add images using the Uploads panel.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-md font-semibold text-foreground mb-3 px-1 font-headline">Image Layers</h3>
      <ScrollArea className="flex-grow border rounded-md bg-background">
        <div className="p-2 space-y-1">
          {sortedCanvasImages.map((image, index) => {
            const isSelected = image.id === selectedCanvasImageId;
            const isTopmost = index === 0;
            const isBottommost = index === sortedCanvasImages.length - 1;

            return (
              <div
                key={image.id}
                onClick={() => {
                  // Allow selecting from layers panel even if locked,
                  // selection on canvas itself is prevented for locked items.
                  selectCanvasImage(image.id); 
                }}
                className={cn(
                  "p-2 border rounded-md flex items-center gap-3 transition-all bg-card border-border", // Base: white background, standard border
                  image.isLocked
                    ? "opacity-70 cursor-not-allowed" // Locked state: reduced opacity, non-interactive cursor
                    : "cursor-pointer hover:bg-accent/10", // Unlocked state: interactive cursor, hover effect
                  isSelected && "ring-2 ring-primary" // Selected (locked or unlocked): primary ring
                  // Removed: isSelected && !image.isLocked && "bg-primary/10" 
                )}
                title={image.isLocked ? `${image.name} (Locked)` : `Select "${image.name}"`}
              >
                <Image
                  src={image.dataUrl}
                  alt={image.name}
                  width={32}
                  height={32}
                  className="rounded-sm object-cover aspect-square bg-muted-foreground/10"
                />
                <span className="text-sm truncate flex-grow">{image.name}</span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); duplicateCanvasImage(image.id); }}
                    title="Duplicate Layer"
                    disabled={image.isLocked} 
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); removeCanvasImage(image.id); }}
                    title="Delete Layer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); toggleLockCanvasImage(image.id); }}
                    title={image.isLocked ? "Unlock Layer" : "Lock Layer"}
                  >
                    {image.isLocked ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); bringLayerForward(image.id); }}
                    disabled={isTopmost || image.isLocked}
                    title="Bring Forward"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); sendLayerBackward(image.id); }}
                    disabled={isBottommost || image.isLocked}
                    title="Send Backward"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

