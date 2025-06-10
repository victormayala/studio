
"use client";

import { useUploads } from '@/contexts/UploadContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input'; // For direct number input

export default function ImageTransformControls() {
  const { activeUploadedImage, updateActiveImageTransform } = useUploads();

  if (!activeUploadedImage) {
    return null;
  }

  const handleScaleChange = (value: number[]) => {
    updateActiveImageTransform({ scale: value[0] });
  };

  const handleRotationChange = (value: number[]) => {
    updateActiveImageTransform({ rotation: value[0] });
  };

  const handleScaleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 5) {
      updateActiveImageTransform({ scale: value });
    }
  };

  const handleRotationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value >= -360 && value <= 360) {
      updateActiveImageTransform({ rotation: value });
    }
  };


  return (
    <div className="space-y-6 p-4 border-t border-border mt-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Transform Active Image</h3>
      <div className="space-y-3">
        <Label htmlFor="scale" className="text-xs text-muted-foreground">Scale: {activeUploadedImage.scale.toFixed(2)}x</Label>
        <div className="flex items-center gap-2">
          <Slider
            id="scale"
            min={0.1}
            max={3} // Max scale of 3x
            step={0.05}
            value={[activeUploadedImage.scale]}
            onValueChange={handleScaleChange}
            className="flex-grow"
          />
          <Input
            type="number"
            value={activeUploadedImage.scale.toFixed(2)}
            onChange={handleScaleInputChange}
            min="0.1"
            max="3"
            step="0.05"
            className="w-20 h-8 text-xs"
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label htmlFor="rotation" className="text-xs text-muted-foreground">Rotation: {activeUploadedImage.rotation}°</Label>
         <div className="flex items-center gap-2">
          <Slider
            id="rotation"
            min={-180}
            max={180}
            step={1}
            value={[activeUploadedImage.rotation]}
            onValueChange={handleRotationChange}
            className="flex-grow"
          />
          <Input
            type="number"
            value={activeUploadedImage.rotation}
            onChange={handleRotationInputChange}
            min="-180"
            max="180"
            step="1"
            className="w-20 h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
