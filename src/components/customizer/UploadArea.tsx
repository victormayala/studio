
'use client';

import { ChangeEvent, useRef } from 'react';
import { useUploads, type UploadedImage } from '@/contexts/UploadContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

export default function UploadArea() {
  const { uploadedImages, addUploadedImage, setActiveUploadedImage, activeUploadedImage, clearActiveUploadedImage } = useUploads();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload an image file (PNG, JPG, GIF, etc.).",
        });
        event.target.value = ''; 
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
         toast({
          variant: "destructive",
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB.",
        });
        event.target.value = ''; 
        return;
      }
      await addUploadedImage(file);
      event.target.value = ''; 
    }
  };

  const handleImageClick = (image: UploadedImage) => {
    if (activeUploadedImage?.id === image.id) {
      clearActiveUploadedImage(); // Deselect if clicking the already active image
    } else {
      setActiveUploadedImage(image);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col p-4">
      <div>
        <Input
          type="file"
          id="fileUpload"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button onClick={() => fileInputRef.current?.click()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
        <p className="text-xs text-muted-foreground mt-1 text-center">Max 5MB. PNG, JPG, GIF.</p>
      </div>

      {uploadedImages.length > 0 ? (
        <ScrollArea className="flex-grow border rounded-md bg-background">
          <div className="p-2 space-y-2">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                onClick={() => handleImageClick(image)}
                className={`p-2 border rounded-md cursor-pointer hover:bg-muted/50 flex items-center gap-3 transition-all
                            ${activeUploadedImage?.id === image.id ? 'ring-2 ring-primary bg-muted' : 'border-border'}`}
              >
                <Image 
                  src={image.dataUrl} 
                  alt={image.name} 
                  width={40} 
                  height={40} 
                  className="rounded object-cover aspect-square bg-muted-foreground/10" 
                />
                <span className="text-sm truncate flex-grow" title={image.name}>{image.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20">
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
          <p className="text-xs text-muted-foreground">Click the button above to upload.</p>
        </div>
      )}
    </div>
  );
}
