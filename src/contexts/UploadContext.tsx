
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
  itemType?: 'text'; // To help differentiate in combined lists
}

// Helper type for combined operations
type CanvasItem = (CanvasImage & { itemType: 'image' }) | (CanvasText & { itemType: 'text' });


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
  bringTextLayerForward: (canvasTextId: string) => void;
  sendTextLayerBackward: (canvasTextId: string) => void;
  duplicateCanvasText: (canvasTextId: string) => void;
  toggleLockCanvasText: (canvasTextId: string) => void;
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

  const getMaxZIndex = useCallback(() => {
    const imageZIndexes = canvasImages.map(img => img.zIndex);
    const textZIndexes = canvasTexts.map(txt => txt.zIndex);
    return Math.max(-1, ...imageZIndexes, ...textZIndexes);
  }, [canvasImages, canvasTexts]);

  const addCanvasImage = useCallback((sourceImageId: string) => {
    const sourceImage = uploadedImages.find(img => img.id === sourceImageId);
    if (!sourceImage) return;

    const currentMaxZIndex = getMaxZIndex();

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
  }, [uploadedImages, getMaxZIndex]);

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


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;

    const currentMaxZIndex = getMaxZIndex();

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
  }, [canvasImages, getMaxZIndex]);

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
    const currentMaxZIndex = getMaxZIndex();
    const newText: CanvasText = {
      id: crypto.randomUUID(),
      content,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
      color: '#333333', 
      fontSize: 24, 
      fontFamily: 'Arial, sans-serif', 
      zIndex: currentMaxZIndex + 1,
      isLocked: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null);
  }, [getMaxZIndex]);

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

  const duplicateCanvasText = useCallback((canvasTextId: string) => {
    const originalText = canvasTexts.find(txt => txt.id === canvasTextId);
    if (!originalText) return;
    const currentMaxZIndex = getMaxZIndex();
    const newText: CanvasText = {
      ...originalText,
      id: crypto.randomUUID(),
      x: originalText.x + 2,
      y: originalText.y + 2,
      zIndex: currentMaxZIndex + 1,
      isLocked: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null);
  }, [canvasTexts, getMaxZIndex]);

  const toggleLockCanvasText = useCallback((canvasTextId: string) => {
    setCanvasTexts(prevTexts =>
      prevTexts.map(txt => {
        if (txt.id === canvasTextId) {
          const isNowLocked = !txt.isLocked;
          if (isNowLocked && selectedCanvasTextId === canvasTextId) {
            setSelectedCanvasTextId(null);
          }
          return { ...txt, isLocked: isNowLocked };
        }
        return txt;
      })
    );
  }, [selectedCanvasTextId]);

  // Unified Layer Reordering Logic
  const reorderLayers = useCallback((itemId: string, itemType: 'image' | 'text', direction: 'forward' | 'backward') => {
    const currentImages = [...canvasImages];
    const currentTexts = [...canvasTexts];

    let allItems: CanvasItem[] = [
      ...currentImages.map(img => ({ ...img, itemType: 'image' as const })),
      ...currentTexts.map(txt => ({ ...txt, itemType: 'text' as const })),
    ];

    allItems.sort((a, b) => a.zIndex - b.zIndex); // Sort by zIndex ascending (visual bottom to top)

    const itemIndex = allItems.findIndex(item => item.id === itemId && item.itemType === itemType);

    if (itemIndex === -1) return; // Should not happen
    if (allItems[itemIndex].isLocked) return; // Cannot reorder locked items

    if (direction === 'forward') {
      if (itemIndex < allItems.length - 1) { // Can move up
        // Swap with the item above it
        const temp = allItems[itemIndex];
        allItems[itemIndex] = allItems[itemIndex + 1];
        allItems[itemIndex + 1] = temp;
      } else {
        return; // Already at the top
      }
    } else { // backward
      if (itemIndex > 0) { // Can move down
        // Swap with the item below it
        const temp = allItems[itemIndex];
        allItems[itemIndex] = allItems[itemIndex - 1];
        allItems[itemIndex - 1] = temp;
      } else {
        return; // Already at the bottom
      }
    }

    // Re-assign sequential zIndex values
    const newCanvasImages: CanvasImage[] = [];
    const newCanvasTexts: CanvasText[] = [];

    allItems.forEach((item, newZIndex) => {
      if (item.itemType === 'image') {
        newCanvasImages.push({ ...(item as CanvasImage), zIndex: newZIndex });
      } else {
        newCanvasTexts.push({ ...(item as CanvasText), zIndex: newZIndex });
      }
    });

    setCanvasImages(newCanvasImages);
    setCanvasTexts(newCanvasTexts);

  }, [canvasImages, canvasTexts]);


  const bringLayerForward = useCallback((canvasImageId: string) => {
    reorderLayers(canvasImageId, 'image', 'forward');
  }, [reorderLayers]);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    reorderLayers(canvasImageId, 'image', 'backward');
  }, [reorderLayers]);

  const bringTextLayerForward = useCallback((canvasTextId: string) => {
    reorderLayers(canvasTextId, 'text', 'forward');
  }, [reorderLayers]);

  const sendTextLayerBackward = useCallback((canvasTextId: string) => {
    reorderLayers(canvasTextId, 'text', 'backward');
  }, [reorderLayers]);


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
        bringTextLayerForward,
        sendTextLayerBackward,
        duplicateCanvasText,
        toggleLockCanvasText,
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
