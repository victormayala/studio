
"use client";

import { useUploads } from '@/contexts/UploadContext';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'; // Assuming Eye/EyeOff for future visibility

export default function LayersPanel() {
  const { canvasImages, selectedCanvasImageId, selectCanvasImage, bringLayerForward, sendLayerBackward } = useUploads();

  // Sort images by zIndex for display (topmost layer first)
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
                onClick={() => selectCanvasImage(image.id)}
                className={`p-2 border rounded-md cursor-pointer hover:bg-muted/50 flex items-center gap-3 transition-all
                            ${isSelected ? 'bg-muted ring-2 ring-primary' : 'border-border'}`}
                title={`Select "${image.name}"`}
              >
                <Image
                  src={image.dataUrl}
                  alt={image.name}
                  width={32}
                  height={32}
                  className="rounded-sm object-cover aspect-square bg-muted-foreground/10"
                />
                <span className="text-sm truncate flex-grow">{image.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); bringLayerForward(image.id); }}
                    disabled={isTopmost}
                    title="Bring Forward"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); sendLayerBackward(image.id); }}
                    disabled={isBottommost}
                    title="Send Backward"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  {/* Placeholder for visibility toggle
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Toggle Visibility">
                    <Eye className="h-4 w-4" /> 
                  </Button>
                  */}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Placeholder for Layers icon if not already imported/used in LeftPanel
import { Layers } from "lucide-react";
