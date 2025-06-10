
"use client";

import { useUploads } from '@/contexts/UploadContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function ImageTransformControls() {
  const {
    canvasImages,
    selectedCanvasImageId,
    updateCanvasImage,
    removeCanvasImage,
    selectCanvasImage
  } = useUploads();

  const selectedImage = canvasImages.find(img => img.id === selectedCanvasImageId);

  if (!selectedImage) {
    return (
      <div className="p-4 border-t border-border mt-4 text-center text-sm text-muted-foreground">
        Select an image on the canvas to see transform controls.
      </div>
    );
  }

  const handleScaleChange = (value: number[]) => {
    updateCanvasImage(selectedImage.id, { scale: value[0] });
  };

  const handleRotationChange = (value: number[]) => {
    updateCanvasImage(selectedImage.id, { rotation: value[0] });
  };

  const handleScaleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 5) { // Increased max scale to 5
      updateCanvasImage(selectedImage.id, { scale: value });
    }
  };

  const handleRotationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= -360 && value <= 360) {
      updateCanvasImage(selectedImage.id, { rotation: value });
    }
  };

  const handleRemoveImage = () => {
    removeCanvasImage(selectedImage.id);
  };

  return (
    <div className="space-y-6 p-4 border-t border-border mt-4">
      <h3 className="text-sm font-medium text-foreground mb-1">Transform: <span className="font-normal truncate">{selectedImage.name}</span></h3>
      <div className="space-y-3">
        <Label htmlFor="scale" className="text-xs text-muted-foreground">Scale: {selectedImage.scale.toFixed(2)}x</Label>
        <div className="flex items-center gap-2">
          <Slider
            id="scale"
            min={0.1}
            max={5} // Max scale of 5x
            step={0.05}
            value={[selectedImage.scale]}
            onValueChange={handleScaleChange}
            className="flex-grow"
          />
          <Input
            type="number"
            value={selectedImage.scale.toFixed(2)}
            onChange={handleScaleInputChange}
            min="0.1"
            max="5"
            step="0.05"
            className="w-20 h-8 text-xs"
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label htmlFor="rotation" className="text-xs text-muted-foreground">Rotation: {selectedImage.rotation}°</Label>
         <div className="flex items-center gap-2">
          <Slider
            id="rotation"
            min={-180}
            max={180}
            step={1}
            value={[selectedImage.rotation]}
            onValueChange={handleRotationChange}
            className="flex-grow"
          />
          <Input
            type="number"
            value={selectedImage.rotation}
            onChange={handleRotationInputChange}
            min="-180"
            max="180"
            step="1"
            className="w-20 h-8 text-xs"
          />
        </div>
      </div>
      <Button onClick={handleRemoveImage} variant="destructive" size="sm" className="w-full">
        <Trash2 className="mr-2 h-4 w-4" />
        Remove from Canvas
      </Button>
    </div>
  );
}
