
'use client';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

// Represents a file uploaded by the user
export interface UploadedImage {
  id: string; // Unique ID for the uploaded file itself
  name: string;
  dataUrl: string;
  type: string; // e.g., 'image/png'
}

// Represents an instance of an image on the canvas
export interface CanvasImage {
  id: string; // Unique ID for THIS INSTANCE on the canvas
  sourceImageId: string; // ID of the original UploadedImage
  name: string;
  dataUrl: string;
  type: string;
  scale: number;
  rotation: number;
  x: number; // percentage for left
  y: number; // percentage for top
  zIndex: number;
  isLocked: boolean;
}

// Represents an instance of a text element on the canvas
export interface CanvasText {
  id: string;
  content: string;
  x: number; // percentage for left
  y: number; // percentage for top
  rotation: number;
  scale: number;
  color: string;
  fontSize: number; // in px, this is the base size
  fontFamily: string;
  zIndex: number;
  isLocked: boolean;
  // width and height are not explicitly stored for text, scaling affects fontSize
}

interface UploadContextType {
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => Promise<void>;
  
  canvasImages: CanvasImage[];
  addCanvasImage: (sourceImageId: string) => void;
  removeCanvasImage: (canvasImageId: string) => void;
  selectedCanvasImageId: string | null;
  selectCanvasImage: (canvasImageId: string | null) => void;
  updateCanvasImage: (canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => void;
  bringLayerForward: (canvasImageId: string) => void;
  sendLayerBackward: (canvasImageId: string) => void;
  duplicateCanvasImage: (canvasImageId: string) => void; 
  toggleLockCanvasImage: (canvasImageId: string) => void;

  canvasTexts: CanvasText[];
  addCanvasText: (content: string) => void;
  removeCanvasText: (canvasTextId: string) => void;
  selectedCanvasTextId: string | null;
  selectCanvasText: (canvasTextId: string | null) => void;
  updateCanvasText: (canvasTextId: string, updates: Partial<Pick<CanvasText, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked' | 'content' | 'color' | 'fontSize' | 'fontFamily'>>) => void;
  // TODO: Add text-specific layer/lock/duplicate functions if they need separate management from images
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [selectedCanvasImageId, setSelectedCanvasImageId] = useState<string | null>(null);

  const [canvasTexts, setCanvasTexts] = useState<CanvasText[]>([]);
  const [selectedCanvasTextId, setSelectedCanvasTextId] = useState<string | null>(null);

  const addUploadedImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const newImage: UploadedImage = {
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          type: file.type,
        };
        setUploadedImages((prev) => [...prev, newImage]);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
    reader.readAsDataURL(file);
  }, []);

  const addCanvasImage = useCallback((sourceImageId: string) => {
    const sourceImage = uploadedImages.find(img => img.id === sourceImageId);
    if (!sourceImage) return;

    const currentMaxZIndex = Math.max(
      -1, // Default if no items
      ...canvasImages.map(img => img.zIndex), 
      ...canvasTexts.map(txt => txt.zIndex)
    );

    const newCanvasImage: CanvasImage = {
      id: crypto.randomUUID(),
      sourceImageId: sourceImage.id,
      name: sourceImage.name,
      dataUrl: sourceImage.dataUrl,
      type: sourceImage.type,
      scale: 1,
      rotation: 0,
      x: 50, 
      y: 50, 
      zIndex: currentMaxZIndex + 1,
      isLocked: false, 
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
    setSelectedCanvasTextId(null);
  }, [uploadedImages, canvasImages, canvasTexts]);

  const removeCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== canvasImageId));
    if (selectedCanvasImageId === canvasImageId) {
      setSelectedCanvasImageId(null);
    }
  }, [selectedCanvasImageId]);

  const selectCanvasImage = useCallback((canvasImageId: string | null) => {
    setSelectedCanvasImageId(canvasImageId);
    if (canvasImageId !== null) {
      setSelectedCanvasTextId(null);
    }
  }, []); 

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => {
    setCanvasImages(prevCanvasImages =>
      prevCanvasImages.map(img =>
        img.id === canvasImageId ? { ...img, ...updates } : img
      )
    );
  }, []); 

  const bringLayerForward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
        const imagesCopy = [...prevImages];
        const sortedImages = imagesCopy.sort((a, b) => a.zIndex - b.zIndex);
        const imageIndex = sortedImages.findIndex(img => img.id === canvasImageId);

        if (imageIndex === -1 || sortedImages[imageIndex].isLocked) return prevImages;
        if (imageIndex === sortedImages.length - 1) { // Already at the top visually
            // If it's tied with others at the top, increment its zIndex to make it uniquely highest
            const topZ = sortedImages[imageIndex].zIndex;
            const isTiedAtTop = sortedImages.some((img, idx) => idx !== imageIndex && img.zIndex === topZ);
            if (isTiedAtTop) {
                 return prevImages.map(img => img.id === canvasImageId ? { ...img, zIndex: topZ + 1 } : img);
            }
            return prevImages; // No change if uniquely at the top
        }

        const currentImage = sortedImages[imageIndex];
        const nextImage = sortedImages[imageIndex + 1];
        
        const currentImageOriginalZ = currentImage.zIndex;
        const nextImageOriginalZ = nextImage.zIndex;

        // Swap zIndex values
        const updatedImages = prevImages.map(img => {
            if (img.id === currentImage.id) return { ...img, zIndex: nextImageOriginalZ };
            if (img.id === nextImage.id) return { ...img, zIndex: currentImageOriginalZ };
            return img;
        });

        // If they had the same zIndex initially, ensure the moved image is now higher
        if (currentImageOriginalZ === nextImageOriginalZ) {
            return updatedImages.map(img => img.id === currentImage.id ? { ...img, zIndex: currentImageOriginalZ + 1 } : img);
        }
        
        return updatedImages;
    });
  }, []);
  
  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
        const imagesCopy = [...prevImages];
        const sortedImages = imagesCopy.sort((a, b) => a.zIndex - b.zIndex);
        const imageIndex = sortedImages.findIndex(img => img.id === canvasImageId);

        if (imageIndex === -1 || sortedImages[imageIndex].isLocked) return prevImages;
        if (imageIndex === 0) { // Already at the bottom visually
             // If it's tied with others at the bottom and its zIndex > 0, decrement its zIndex
            const bottomZ = sortedImages[imageIndex].zIndex;
            const isTiedAtBottom = sortedImages.some((img, idx) => idx !== imageIndex && img.zIndex === bottomZ);
            if (isTiedAtBottom && bottomZ > 0) {
                 return prevImages.map(img => img.id === canvasImageId ? { ...img, zIndex: Math.max(0, bottomZ - 1) } : img);
            }
            return prevImages; // No change if uniquely at the bottom or at zIndex 0
        }

        const currentImage = sortedImages[imageIndex];
        const prevImage = sortedImages[imageIndex - 1];

        const currentImageOriginalZ = currentImage.zIndex;
        const prevImageOriginalZ = prevImage.zIndex;

        const updatedImages = prevImages.map(img => {
            if (img.id === currentImage.id) return { ...img, zIndex: prevImageOriginalZ };
            if (img.id === prevImage.id) return { ...img, zIndex: currentImageOriginalZ };
            return img;
        });
        
        // If they had the same zIndex initially, ensure the image being moved "behind" (prevImage) is now higher
        if (currentImageOriginalZ === prevImageOriginalZ && currentImageOriginalZ > 0) {
             return updatedImages.map(img => img.id === prevImage.id ? { ...img, zIndex: currentImageOriginalZ + 1 } : img);
        }


        return updatedImages;
    });
  }, []);


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;

    const currentMaxZIndex = Math.max(
      -1, 
      ...canvasImages.map(img => img.zIndex), 
      ...canvasTexts.map(txt => txt.zIndex)
    );

    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, 
      y: originalImage.y + 2, 
      zIndex: currentMaxZIndex + 1,
      isLocked: false, 
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id); 
    setSelectedCanvasTextId(null);
  }, [canvasImages, canvasTexts]);

  const toggleLockCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages =>
      prevImages.map(img => {
        if (img.id === canvasImageId) {
          const isNowLocked = !img.isLocked;
          if (isNowLocked && selectedCanvasImageId === canvasImageId) {
            setSelectedCanvasImageId(null); 
          }
          return { ...img, isLocked: isNowLocked };
        }
        return img;
      })
    );
  }, [selectedCanvasImageId]);

  // Text specific functions
  const addCanvasText = useCallback((content: string) => {
    const currentMaxZIndex = Math.max(
      -1, 
      ...canvasImages.map(img => img.zIndex), 
      ...canvasTexts.map(txt => txt.zIndex)
    );
    const newText: CanvasText = {
      id: crypto.randomUUID(),
      content,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
      color: '#333333', // Dark grey, more visible on light backgrounds
      fontSize: 24, 
      fontFamily: 'Arial, sans-serif', // Common sans-serif
      zIndex: currentMaxZIndex + 1,
      isLocked: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null);
  }, [canvasImages, canvasTexts]);

  const removeCanvasText = useCallback((canvasTextId: string) => {
    setCanvasTexts(prev => prev.filter(txt => txt.id !== canvasTextId));
    if (selectedCanvasTextId === canvasTextId) {
      setSelectedCanvasTextId(null);
    }
  }, [selectedCanvasTextId]);

  const selectCanvasText = useCallback((canvasTextId: string | null) => {
    setSelectedCanvasTextId(canvasTextId);
    if (canvasTextId !== null) {
      setSelectedCanvasImageId(null);
    }
  }, []);

  const updateCanvasText = useCallback((canvasTextId: string, updates: Partial<Pick<CanvasText, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked' | 'content' | 'color' | 'fontSize' | 'fontFamily'>>) => {
    setCanvasTexts(prevCanvasTexts =>
      prevCanvasTexts.map(txt =>
        txt.id === canvasTextId ? { ...txt, ...updates } : txt
      )
    );
  }, []);


  return (
    <UploadContext.Provider
      value={{
        uploadedImages,
        addUploadedImage,
        canvasImages,
        addCanvasImage,
        removeCanvasImage,
        selectedCanvasImageId,
        selectCanvasImage,
        updateCanvasImage,
        bringLayerForward,
        sendLayerBackward,
        duplicateCanvasImage,
        toggleLockCanvasImage,
        canvasTexts,
        addCanvasText,
        removeCanvasText,
        selectedCanvasTextId,
        selectCanvasText,
        updateCanvasText,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
}
