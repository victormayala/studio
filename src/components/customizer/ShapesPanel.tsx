
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUploads, type ShapeType, type CanvasShape } from '@/contexts/UploadContext';
import { Square, Circle, Shapes as ShapesIconLucide, Palette, PenLine } from 'lucide-react';
// ScrollArea is removed as parent handles scrolling
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

interface ShapeOption {
  type: ShapeType;
  label: string;
  icon: React.ElementType;
}

const shapeOptions: ShapeOption[] = [
  { type: 'rectangle', label: 'Rectangle', icon: Square },
  { type: 'circle', label: 'Circle', icon: Circle },
];

const sanitizeHex = (hex: string): string => {
  let sanitized = hex.replace(/[^0-9a-fA-F]/g, '');
  if (sanitized.startsWith('#')) {
    sanitized = sanitized.substring(1);
  }
  if (sanitized.length > 6) {
    sanitized = sanitized.substring(0, 6);
  }
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map(char => char + char).join('');
  }
  return `#${sanitized.padEnd(6, '0').substring(0,6)}`;
};

interface ShapesPanelProps {
  activeViewId: string | null;
}

export default function ShapesPanel({ activeViewId }: ShapesPanelProps) {
  const { 
    addCanvasShape, 
    selectedCanvasShapeId, 
    canvasShapes, 
    updateCanvasShape,
    startInteractiveOperation, // Import for sliders
    endInteractiveOperation    // Import for sliders
  } = useUploads();
  const { toast } = useToast();
  const selectedShape = canvasShapes.find(s => s.id === selectedCanvasShapeId && s.viewId === activeViewId);

  const [fillColorHex, setFillColorHex] = useState(selectedShape?.color || '#468189');
  const [strokeColorHex, setStrokeColorHex] = useState(selectedShape?.strokeColor || '#000000');

  useEffect(() => {
    if (selectedShape) {
      setFillColorHex(selectedShape.color);
      setStrokeColorHex(selectedShape.strokeColor);
    } else {
      // Reset to defaults or keep current if user is setting up for new shape
      // For now, let's keep the last used values if no shape is selected
      // setFillColorHex('#468189');
      // setStrokeColorHex('#000000');
    }
  }, [selectedShape]);

  const handleAddShape = (shapeType: ShapeType) => {
    if (!activeViewId) {
      toast({ title: "No Active View", description: "Please select a product view first.", variant: "info" });
      return;
    }
    addCanvasShape(shapeType, activeViewId, {
      color: fillColorHex, 
      strokeColor: strokeColorHex,
      strokeWidth: currentStrokeWidth, // Use state for new shapes
    });
  };
  
  // State for properties to be applied to new shapes, or to edit selected ones
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(selectedShape?.strokeWidth ?? 0);

  useEffect(() => {
      if (selectedShape) {
          setCurrentStrokeWidth(selectedShape.strokeWidth);
      } else {
         // If no shape is selected, keep the currentStrokeWidth for new shapes
         // Or reset: setCurrentStrokeWidth(0); 
      }
  }, [selectedShape]);


  const handleStyleChange = <K extends keyof CanvasShape>(property: K, value: CanvasShape[K]) => {
    if (selectedCanvasShapeId && selectedShape) { 
      updateCanvasShape(selectedCanvasShapeId, { [property]: value });
    }
    // Update local preview/default states if needed, e.g., for strokeWidth:
    if (property === 'strokeWidth') setCurrentStrokeWidth(value as number);
  };

  const handleFillColorChange = (value: string) => {
    const sanitized = sanitizeHex(value);
    setFillColorHex(sanitized); 
    if (selectedCanvasShapeId && selectedShape) {
      handleStyleChange('color', sanitized);
    }
  };
  
  const handleStrokeColorChange = (value: string) => {
    const sanitized = sanitizeHex(value);
    setStrokeColorHex(sanitized); 
     if (selectedCanvasShapeId && selectedShape) {
      handleStyleChange('strokeColor', sanitized);
    }
  };

  const handleStrokeWidthChange = (value: number) => {
    setCurrentStrokeWidth(value);
    if (selectedCanvasShapeId && selectedShape) {
      handleStyleChange('strokeWidth', value);
    }
  };


  return (
    <div className="space-y-4 h-full flex flex-col"> 
      <div>
        <p className="text-xs text-muted-foreground mb-3">Click a shape to add it to the canvas.</p>
        {shapeOptions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
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
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20">
            <ShapesIconLucide className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No shapes available.</p>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex-grow space-y-4 py-2 pr-1 -mr-1"> 
        <Accordion type="multiple" defaultValue={['shape-colors']} className="w-full">
          <AccordionItem value="shape-colors">
            <AccordionTrigger className="font-medium text-sm py-3 px-1">
              <Palette className="mr-2 h-4 w-4" /> Color Settings
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-3 pb-1 px-1">
              <div className="space-y-1.5">
                <Label htmlFor="shapeFillColorSwatch" className="text-xs">Fill Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    id="shapeFillColorSwatch"
                    className="h-8 w-10 p-0.5 border-none rounded"
                    value={fillColorHex} 
                    onChange={(e) => handleFillColorChange(e.target.value)}
                  />
                  <Input
                    id="shapeFillColorHex"
                    className="h-8 text-xs flex-grow max-w-[100px]"
                    value={fillColorHex} 
                    onChange={(e) => setFillColorHex(e.target.value)} // Update local state for typing
                    onBlur={(e) => handleFillColorChange(e.target.value)} // Commit on blur
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shapeStrokeColorSwatch" className="text-xs">Outline Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    id="shapeStrokeColorSwatch"
                    className="h-8 w-10 p-0.5 border-none rounded"
                    value={strokeColorHex} 
                    onChange={(e) => handleStrokeColorChange(e.target.value)}
                  />
                  <Input
                    id="shapeStrokeColorHex"
                    className="h-8 text-xs flex-grow max-w-[100px]"
                    value={strokeColorHex} 
                    onChange={(e) => setStrokeColorHex(e.target.value)} // Update local state
                    onBlur={(e) => handleStrokeColorChange(e.target.value)} // Commit on blur
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shapeStrokeWidthSlider" className="text-xs">
                  Outline Width: {currentStrokeWidth.toFixed(1)}px
                </Label>
                <Slider
                  id="shapeStrokeWidthSlider"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[currentStrokeWidth]}
                  onValueChange={([value]) => handleStrokeWidthChange(value)}
                  onPointerDownCapture={startInteractiveOperation}
                  onPointerUpCapture={endInteractiveOperation}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {!selectedShape && (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20 mt-2">
                <PenLine className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a shape on the canvas to edit its properties.</p>
                <p className="text-xs text-muted-foreground mt-1">Current settings will apply to new shapes.</p>
            </div>
        )}
      </div>
    </div>
  );
}

    