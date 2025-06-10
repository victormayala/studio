
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
  isLocked: boolean; // Added for lock functionality
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
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [selectedCanvasImageId, setSelectedCanvasImageId] = useState<string | null>(null);

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
      zIndex: (canvasImages.length > 0 ? Math.max(...canvasImages.map(img => img.zIndex)) : -1) + 1,
      isLocked: false, 
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
  }, [uploadedImages, canvasImages]);

  const removeCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== canvasImageId));
    if (selectedCanvasImageId === canvasImageId) {
      setSelectedCanvasImageId(null);
    }
  }, [selectedCanvasImageId]);

  const selectCanvasImage = useCallback((canvasImageId: string | null) => {
    const imageToSelect = canvasImages.find(img => img.id === canvasImageId);
     if (imageToSelect?.isLocked && canvasImageId !== null) { 
        // If it's locked, we still update selectedCanvasImageId for the LayersPanel to highlight,
        // but interactions on the canvas itself are prevented elsewhere.
        // However, the prompt implied not selecting locked items from panel.
        // For consistency with canvas, let's prevent selection if locked.
        // User can unlock from panel first.
        // Update: Let panel selection work, canvas interaction is key.
    }
    setSelectedCanvasImageId(canvasImageId);
  }, [canvasImages]); 

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => {
    setCanvasImages(prevCanvasImages =>
      prevCanvasImages.map(img =>
        img.id === canvasImageId ? { ...img, ...updates } : img
      )
    );
  }, []); 

  const bringLayerForward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const sortedImages = [...prevImages].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndexInSorted = sortedImages.findIndex(img => img.id === canvasImageId);

      if (currentIndexInSorted === -1 || sortedImages[currentIndexInSorted].isLocked) {
        return prevImages;
      }

      const imageToMove = sortedImages[currentIndexInSorted];

      // If it's already the last item in sorted (highest zIndex visual equivalent)
      if (currentIndexInSorted === sortedImages.length - 1) {
        // Check if it's tied with other images at this zIndex. If so, increment its zIndex.
        const maxZ = imageToMove.zIndex;
        const itemsAtMaxZAndDifferentId = prevImages.filter(img => img.zIndex === maxZ && img.id !== imageToMove.id);
        if (itemsAtMaxZAndDifferentId.length > 0) {
          const newZ = imageToMove.zIndex + 1;
          return prevImages.map(img => img.id === imageToMove.id ? { ...img, zIndex: newZ } : img);
        }
        return prevImages; // Already uniquely highest
      }

      const imageToSwapWith = sortedImages[currentIndexInSorted + 1];

      if (imageToMove.zIndex === imageToSwapWith.zIndex) {
        // If zIndices are the same, increment the one being moved "forward"
        const newZIndexForMoved = imageToMove.zIndex + 1;
        return prevImages.map(img => {
          if (img.id === imageToMove.id) {
            return { ...img, zIndex: newZIndexForMoved };
          }
          return img;
        });
      } else {
        // Swap distinct zIndices
        const z1 = imageToMove.zIndex;
        const z2 = imageToSwapWith.zIndex;
        return prevImages.map(img => {
          if (img.id === imageToMove.id) {
            return { ...img, zIndex: z2 };
          }
          if (img.id === imageToSwapWith.id) {
            return { ...img, zIndex: z1 };
          }
          return img;
        });
      }
    });
  }, []);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const sortedImages = [...prevImages].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndexInSorted = sortedImages.findIndex(img => img.id === canvasImageId);

      if (currentIndexInSorted === -1 || sortedImages[currentIndexInSorted].isLocked) {
        return prevImages;
      }

      const imageToMove = sortedImages[currentIndexInSorted];

      // If it's already the first item in sorted (lowest zIndex visual equivalent)
      if (currentIndexInSorted === 0) {
        // Check if it's tied with other images at this zIndex. If so, increment the other's zIndex.
        const minZ = imageToMove.zIndex;
        const itemsAtMinZAndDifferentId = prevImages.filter(img => img.zIndex === minZ && img.id !== imageToMove.id);
        if (itemsAtMinZAndDifferentId.length > 0) {
          // To send imageToMove "backward" when tied, we move one of the "other" items "forward".
          const otherImageToNudgeForward = itemsAtMinZAndDifferentId[0]; // Pick one
          const newZForOther = otherImageToNudgeForward.zIndex + 1;
          return prevImages.map(img => img.id === otherImageToNudgeForward.id ? { ...img, zIndex: newZForOther } : img);
        }
        return prevImages; // Already uniquely lowest
      }

      const imageToSwapWith = sortedImages[currentIndexInSorted - 1];

      if (imageToMove.zIndex === imageToSwapWith.zIndex) {
        // If zIndices are the same, increment the zIndex of the item it's moving "behind" (imageToSwapWith)
        const newZIndexForSwapped = imageToSwapWith.zIndex + 1;
        return prevImages.map(img => {
          if (img.id === imageToSwapWith.id) {
            return { ...img, zIndex: newZIndexForSwapped };
          }
          return img;
        });
      } else {
        // Swap distinct zIndices
        const z1 = imageToMove.zIndex;
        const z2 = imageToSwapWith.zIndex;
        return prevImages.map(img => {
          if (img.id === imageToMove.id) {
            return { ...img, zIndex: z2 };
          }
          if (img.id === imageToSwapWith.id) {
            return { ...img, zIndex: z1 };
          }
          return img;
        });
      }
    });
  }, []);


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;
    // if (originalImage.isLocked) return; // No longer preventing duplication of locked items based on earlier feedback

    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, 
      y: originalImage.y + 2, 
      zIndex: (canvasImages.length > 0 ? Math.max(...canvasImages.map(img => img.zIndex)) : -1) + 1,
      isLocked: false, 
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id); 
  }, [canvasImages]);

  const toggleLockCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages =>
      prevImages.map(img => {
        if (img.id === canvasImageId) {
          const isNowLocked = !img.isLocked;
          if (isNowLocked && selectedCanvasImageId === canvasImageId) {
            // Deselect if locking the currently selected image, so transform handles disappear
            setSelectedCanvasImageId(null); 
          }
          return { ...img, isLocked: isNowLocked };
        }
        return img;
      })
    );
  }, [selectedCanvasImageId, setSelectedCanvasImageId]);


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

