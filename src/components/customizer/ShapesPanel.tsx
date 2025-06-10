
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUploads, type ShapeType } from '@/contexts/UploadContext';
import { Square, Circle, Triangle, Star, Shapes } from 'lucide-react'; // Assuming Star is for a generic shape or actual star
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShapeOption {
  type: ShapeType;
  label: string;
  icon: React.ElementType;
}

const shapeOptions: ShapeOption[] = [
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
  // { type: 'triangle', label: 'Triangle', icon: Triangle },
  // { type: 'star', label: 'Star', icon: Star },
];

export default function ShapesPanel() {
  const { addCanvasShape } = useUploads();

  const handleAddShape = (shapeType: ShapeType) => {
    addCanvasShape(shapeType);
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <h3 className="text-md font-semibold text-foreground mb-0 px-1 font-headline">Add a Shape</h3>
      <p className="text-xs text-muted-foreground px-1">Click a shape to add it to the canvas.</p>
      
      {shapeOptions.length > 0 ? (
        <ScrollArea className="flex-grow border rounded-md bg-background">
          <div className="p-2 grid grid-cols-2 gap-2">
            {shapeOptions.map((shape) => (
              <Button
                key={shape.type}
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-3 space-y-1 aspect-square hover:bg-accent/10"
                onClick={() => handleAddShape(shape.type)}
                title={`Add ${shape.label}`}
              >
                <shape.icon className="w-8 h-8 text-primary" />
                <span className="text-xs text-foreground">{shape.label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : (
         <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20">
          <Shapes className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No shapes available.</p>
          <p className="text-xs text-muted-foreground">Check back later for more shapes!</p>
        </div>
      )}

      {/* Placeholder for shape customization - to be added later */}
      {/* 
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20 mt-2">
          <Shapes className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Select a shape on the canvas to edit its properties.</p>
          <p className="text-xs text-muted-foreground mt-1">(Shape property editor coming soon)</p>
      </div>
      */}
    </div>
  );
}
