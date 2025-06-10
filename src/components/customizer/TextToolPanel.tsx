
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUploads } from '@/contexts/UploadContext';
import { Type } from 'lucide-react';

export default function TextToolPanel() {
  const [textValue, setTextValue] = useState('');
  const { addCanvasText } = useUploads();

  const handleAddText = () => {
    if (textValue.trim()) {
      addCanvasText(textValue.trim());
      setTextValue(''); // Clear textarea after adding
    }
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <h3 className="text-md font-semibold text-foreground font-headline px-1">Add Text</h3>
      <div className="space-y-2">
        <Label htmlFor="textInput" className="text-sm">Your Text:</Label>
        <Textarea
          id="textInput"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Enter text here..."
          rows={4}
          className="bg-background"
        />
      </div>
      <Button onClick={handleAddText} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        <Type className="mr-2 h-4 w-4" />
        Add Text to Canvas
      </Button>
      <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20 mt-4">
          <Type className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Use the controls above to add text.</p>
          <p className="text-xs text-muted-foreground mt-1">More styling options coming soon!</p>
      </div>
    </div>
  );
}
