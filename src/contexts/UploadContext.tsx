
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
  fontSize: number; // in px
  fontFamily: string;
  zIndex: number;
  isLocked: boolean;
  width?: number; // Optional: for bounding box calculations later
  height?: number; // Optional: for bounding box calculations later
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
  updateCanvasText: (canvasTextId: string, updates: Partial<CanvasText>) => void;
  // Future text-specific layer/lock/duplicate functions can go here
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
      zIndex: (canvasImages.length > 0 || canvasTexts.length > 0 ? Math.max(0, ...canvasImages.map(img => img.zIndex), ...canvasTexts.map(txt => txt.zIndex)) : -1) + 1,
      isLocked: false, 
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
    setSelectedCanvasTextId(null); // Deselect any selected text
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
      setSelectedCanvasTextId(null); // Deselect text if image is selected
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
      const imagesCopy = prevImages.map(img => ({ ...img })); // Create shallow copies for modification
      const sortedImages = [...imagesCopy].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndexInSorted = sortedImages.findIndex(img => img.id === canvasImageId);
  
      if (currentIndexInSorted === -1 || sortedImages[currentIndexInSorted].isLocked) {
        return prevImages; // Return original if not found or locked
      }
  
      const imageToMove = sortedImages[currentIndexInSorted];
  
      if (currentIndexInSorted === sortedImages.length - 1) {
        // Already visually topmost or tied for topmost
        const maxZ = imageToMove.zIndex;
        const isUniquelyTopmost = !sortedImages.some(img => img.id !== imageToMove.id && img.zIndex === maxZ);
        if (isUniquelyTopmost) return prevImages; // No change needed
        
        // If tied, make it definitively the highest
        const newZIndex = maxZ + 1;
        const finalImages = prevImages.map(img =>
          img.id === imageToMove.id ? { ...img, zIndex: newZIndex } : { ...img }
        );
        return finalImages;
      }
  
      const imageToSwapWith = sortedImages[currentIndexInSorted + 1];
      const originalZIndexImageToMove = prevImages.find(img => img.id === imageToMove.id)!.zIndex;
      const originalZIndexImageToSwapWith = prevImages.find(img => img.id === imageToSwapWith.id)!.zIndex;
  
      if (originalZIndexImageToMove === originalZIndexImageToSwapWith) {
        const newZIndex = originalZIndexImageToMove + 1;
        const finalImages = prevImages.map(img =>
          img.id === imageToMove.id ? { ...img, zIndex: newZIndex } : { ...img }
        );
        return finalImages;
      } else {
        const finalImages = prevImages.map(img => {
          if (img.id === imageToMove.id) return { ...img, zIndex: originalZIndexImageToSwapWith };
          if (img.id === imageToSwapWith.id) return { ...img, zIndex: originalZIndexImageToMove };
          return { ...img };
        });
        return finalImages;
      }
    });
  }, []);
  
  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const imagesCopy = prevImages.map(img => ({ ...img })); // Create shallow copies for modification
      const sortedImages = [...imagesCopy].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndexInSorted = sortedImages.findIndex(img => img.id === canvasImageId);
  
      if (currentIndexInSorted === -1 || sortedImages[currentIndexInSorted].isLocked) {
        return prevImages; // Return original if not found or locked
      }
  
      const imageToMove = sortedImages[currentIndexInSorted];
  
      if (currentIndexInSorted === 0) {
        // Already visually bottommost or tied for bottommost
        const minZ = imageToMove.zIndex;
        const isUniquelyBottommost = !sortedImages.some(img => img.id !== imageToMove.id && img.zIndex === minZ);
        if (isUniquelyBottommost && minZ === 0) return prevImages; // No change if uniquely bottom and zIndex is 0

        if (isUniquelyBottommost && minZ > 0) { // Can go lower
             const newZIndex = Math.max(0, minZ - 1);
             const finalImages = prevImages.map(img =>
                img.id === imageToMove.id ? { ...img, zIndex: newZIndex } : { ...img }
             );
             return finalImages;
        }
        
        // If tied, and imageToMove.zIndex > 0 ensure it's lower than one it's tied with by making that one higher.
        // This interpretation of "send backward" when tied at zIndex > 0 is to increment the one it would be "behind"
        if (imageToMove.zIndex > 0) {
            const imageToEffectivelyPushForward = sortedImages.find(img => img.id !== imageToMove.id && img.zIndex === imageToMove.zIndex);
            if (imageToEffectivelyPushForward) {
                const newZForPushed = imageToEffectivelyPushForward.zIndex + 1;
                const finalImages = prevImages.map(img =>
                    img.id === imageToEffectivelyPushForward.id ? { ...img, zIndex: newZForPushed } : { ...img }
                );
                return finalImages;
            }
        }
        return prevImages; // No change if tied at zIndex 0
      }
  
      const imageToSwapWith = sortedImages[currentIndexInSorted - 1];
      const originalZIndexImageToMove = prevImages.find(img => img.id === imageToMove.id)!.zIndex;
      const originalZIndexImageToSwapWith = prevImages.find(img => img.id === imageToSwapWith.id)!.zIndex;
  
      if (originalZIndexImageToMove === originalZIndexImageToSwapWith) {
        // To send imageToMove "backward" when tied, increment the zIndex of imageToSwapWith
        const newZIndexForSwapped = originalZIndexImageToSwapWith + 1;
        const finalImages = prevImages.map(img => {
          if (img.id === imageToSwapWith.id) return { ...img, zIndex: newZIndexForSwapped };
          return { ...img };
        });
        return finalImages;
      } else {
        const finalImages = prevImages.map(img => {
          if (img.id === imageToMove.id) return { ...img, zIndex: originalZIndexImageToSwapWith };
          if (img.id === imageToSwapWith.id) return { ...img, zIndex: originalZIndexImageToMove };
          return { ...img };
        });
        return finalImages;
      }
    });
  }, []);


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;

    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, 
      y: originalImage.y + 2, 
      zIndex: (canvasImages.length > 0 || canvasTexts.length > 0 ? Math.max(0, ...canvasImages.map(img => img.zIndex), ...canvasTexts.map(txt => txt.zIndex)) : -1) + 1,
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
    const newText: CanvasText = {
      id: crypto.randomUUID(),
      content,
      x: 50, // Default to center
      y: 50, // Default to center
      rotation: 0,
      scale: 1,
      color: '#000000', // Default to black
      fontSize: 24, // Default font size
      fontFamily: 'Arial', // Default font family
      zIndex: (canvasImages.length > 0 || canvasTexts.length > 0 ? Math.max(0, ...canvasImages.map(img => img.zIndex), ...canvasTexts.map(txt => txt.zIndex)) : -1) + 1,
      isLocked: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null); // Deselect any selected image
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
      setSelectedCanvasImageId(null); // Deselect image if text is selected
    }
  }, []);

  const updateCanvasText = useCallback((canvasTextId: string, updates: Partial<CanvasText>) => {
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
