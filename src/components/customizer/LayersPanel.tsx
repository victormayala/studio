
"use client";

import { useUploads, type CanvasImage, type CanvasText, type CanvasShape } from '@/contexts/UploadContext';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown, Layers, Copy, Trash2, Lock, Unlock, Type, Shapes as ShapesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

type CanvasItem = (CanvasImage & { itemType: 'image' }) | (CanvasText & { itemType: 'text' }) | (CanvasShape & { itemType: 'shape' });

export default function LayersPanel() {
  const { 
    canvasImages, selectedCanvasImageId, selectCanvasImage, bringLayerForward, sendLayerBackward,
    duplicateCanvasImage, removeCanvasImage, toggleLockCanvasImage,

    canvasTexts, selectedCanvasTextId, selectCanvasText, bringTextLayerForward, sendTextLayerBackward,
    duplicateCanvasText, removeCanvasText, toggleLockCanvasText,

    canvasShapes, selectedCanvasShapeId, selectCanvasShape, bringShapeLayerForward, sendShapeLayerBackward,
    duplicateCanvasShape, removeCanvasShape, toggleLockCanvasShape,
  } = useUploads();

  const combinedItems: CanvasItem[] = React.useMemo(() => {
    const imagesWithType: CanvasItem[] = canvasImages.map(img => ({ ...img, itemType: 'image' }));
    const textsWithType: CanvasItem[] = canvasTexts.map(txt => ({ ...txt, itemType: 'text' }));
    const shapesWithType: CanvasItem[] = canvasShapes.map(shp => ({ ...shp, itemType: 'shape' }));
    return [...imagesWithType, ...textsWithType, ...shapesWithType].sort((a, b) => b.zIndex - a.zIndex);
  }, [canvasImages, canvasTexts, canvasShapes]);


  if (combinedItems.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
        <Layers className="w-12 h-12 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-1">Canvas Layers</h3>
        <p className="text-sm">No items on the canvas yet.</p>
        <p className="text-xs mt-2">Add images, text or shapes using the tools.</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-md font-semibold text-foreground mb-3 px-1 font-headline">Canvas Layers</h3>
      <ScrollArea className="flex-grow border rounded-md bg-background">
        <div className="p-2 space-y-1">
          {combinedItems.map((item, index) => {
            const isSelected = 
                item.itemType === 'image' ? item.id === selectedCanvasImageId :
                item.itemType === 'text' ? item.id === selectedCanvasTextId :
                item.itemType === 'shape' ? item.id === selectedCanvasShapeId :
                false;

            const isTopmost = index === 0;
            const isBottommost = index === combinedItems.length - 1;

            const handleSelect = () => {
              if (item.itemType === 'image') selectCanvasImage(item.id);
              else if (item.itemType === 'text') selectCanvasText(item.id);
              else if (item.itemType === 'shape') selectCanvasShape(item.id);
            };

            const handleDuplicate = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'image') duplicateCanvasImage(item.id);
              else if (item.itemType === 'text') duplicateCanvasText(item.id);
              else if (item.itemType === 'shape') duplicateCanvasShape(item.id);
            };
            
            const handleRemove = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'image') removeCanvasImage(item.id);
              else if (item.itemType === 'text') removeCanvasText(item.id);
              else if (item.itemType === 'shape') removeCanvasShape(item.id);
            };

            const handleToggleLock = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'image') toggleLockCanvasImage(item.id);
              else if (item.itemType === 'text') toggleLockCanvasText(item.id);
              else if (item.itemType === 'shape') toggleLockCanvasShape(item.id);
            };

            const handleBringForward = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'image') bringLayerForward(item.id);
              else if (item.itemType === 'text') bringTextLayerForward(item.id);
              else if (item.itemType === 'shape') bringShapeLayerForward(item.id);
            };

            const handleSendBackward = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (item.itemType === 'image') sendLayerBackward(item.id);
              else if (item.itemType === 'text') sendTextLayerBackward(item.id);
              else if (item.itemType === 'shape') sendShapeLayerBackward(item.id);
            };
            
            let displayName = "Unknown Item";
            if (item.itemType === 'image') displayName = item.name;
            else if (item.itemType === 'text') displayName = item.content.substring(0, 20) + (item.content.length > 20 ? '...' : '');
            else if (item.itemType === 'shape') displayName = `${item.shapeType.charAt(0).toUpperCase() + item.shapeType.slice(1)}`;

            const title = item.isLocked 
              ? `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}: "${displayName}" (Locked)` 
              : `Select ${item.itemType}: "${displayName}"`;

            return (
              <div
                key={`${item.itemType}-${item.id}`}
                onClick={handleSelect}
                className={cn(
                  "p-2 border rounded-md flex items-center gap-3 transition-all bg-card border-border",
                  item.isLocked
                    ? "opacity-70 cursor-not-allowed"
                    : "cursor-pointer hover:bg-accent/10",
                  isSelected && "ring-2 ring-primary"
                )}
                title={title}
              >
                {item.itemType === 'image' ? (
                  <Image
                    src={item.dataUrl}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="rounded-sm object-cover aspect-square bg-muted-foreground/10"
                  />
                ) : item.itemType === 'text' ? (
                  <div className="w-8 h-8 flex items-center justify-center bg-muted-foreground/10 rounded-sm">
                    <Type className="h-5 w-5 text-foreground" />
                  </div>
                ) : item.itemType === 'shape' ? (
                  <div className="w-8 h-8 flex items-center justify-center bg-muted-foreground/10 rounded-sm">
                    {/* Could use specific shape icons here if available */}
                    <ShapesIcon className="h-5 w-5 text-foreground" /> 
                  </div>
                ) : null}
                <span className="text-sm truncate flex-grow">{displayName}</span>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDuplicate} title={`Duplicate ${item.itemType}`} disabled={item.isLocked} >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRemove} title={`Delete ${item.itemType}`} >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleToggleLock} title={item.isLocked ? `Unlock ${item.itemType}` : `Lock ${item.itemType}`} >
                    {item.isLocked ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBringForward} disabled={isTopmost || item.isLocked} title="Bring Forward" >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSendBackward} disabled={isBottommost || item.isLocked} title="Send Backward" >
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
