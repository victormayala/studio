
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
      zIndex: (Math.max(-1, ...canvasImages.map(img => img.zIndex)) + 1), // Ensure base is at least 0
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
        // No special handling here, selection state managed by caller or this simple set.
        // Deselection is allowed. Direct canvas interaction with locked items is prevented elsewhere.
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
      const images = [...prevImages]; 
      const currentImageIndex = images.findIndex(img => img.id === canvasImageId);
      if (currentImageIndex === -1 || images[currentImageIndex].isLocked) return prevImages;

      const imageToMoveInfo = images[currentImageIndex];
      
      let imageToSwapWithOriginalIndex = -1;
      let closestHigherZIndex = Infinity;

      for (let i = 0; i < images.length; i++) {
        if (i === currentImageIndex) continue;
        if (images[i].zIndex > imageToMoveInfo.zIndex) {
          if (images[i].zIndex < closestHigherZIndex) {
            closestHigherZIndex = images[i].zIndex;
            imageToSwapWithOriginalIndex = i;
          } else if (images[i].zIndex === closestHigherZIndex) {
            // Optional: if multiple images share the same z-index immediately above,
            // this logic picks the first one encountered. Could be refined if specific tie-breaking is needed.
          }
        }
      }
      
      if (imageToSwapWithOriginalIndex !== -1) {
        const tempZ = images[imageToSwapWithOriginalIndex].zIndex;
        images[imageToSwapWithOriginalIndex].zIndex = imageToMoveInfo.zIndex;
        imageToMoveInfo.zIndex = tempZ;
        return images.map(img => ({...img}));
      } else {
        // No image is strictly above it. If it's not already the max, make it max + 1.
        const maxOverallZ = Math.max(-1, ...images.map(i => i.zIndex));
        if (imageToMoveInfo.zIndex <= maxOverallZ) { // Check if it's not already above all others
           // Check if it's tied with maxOverallZ, or actually below it.
           // If it is already maxOverallZ, and there are no others at maxOverallZ, it's already top.
           const isTiedAtMax = imageToMoveInfo.zIndex === maxOverallZ && images.filter(i => i.zIndex === maxOverallZ && i.id !== imageToMoveInfo.id).length > 0;
           if (imageToMoveInfo.zIndex < maxOverallZ || isTiedAtMax) {
                imageToMoveInfo.zIndex = maxOverallZ + 1;
                return images.map(img => ({...img}));
           }
        }
      }
      return prevImages;
    });
  }, []);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const images = [...prevImages];
      const currentImageIndex = images.findIndex(img => img.id === canvasImageId);
      if (currentImageIndex === -1 || images[currentImageIndex].isLocked) return prevImages;

      const imageToMoveInfo = images[currentImageIndex];

      let imageToSwapWithOriginalIndex = -1;
      let closestLowerZIndex = -Infinity;

      for (let i = 0; i < images.length; i++) {
        if (i === currentImageIndex) continue;
        if (images[i].zIndex < imageToMoveInfo.zIndex) {
          if (images[i].zIndex > closestLowerZIndex) {
            closestLowerZIndex = images[i].zIndex;
            imageToSwapWithOriginalIndex = i;
          }
        }
      }

      if (imageToSwapWithOriginalIndex !== -1) {
        const tempZ = images[imageToSwapWithOriginalIndex].zIndex;
        images[imageToSwapWithOriginalIndex].zIndex = imageToMoveInfo.zIndex;
        imageToMoveInfo.zIndex = tempZ;
        return images.map(img => ({...img}));
      } else {
        // No image is strictly below it. If it's not already min, make it min - 1 (careful with 0 or negative).
        const minOverallZ = Math.min(...images.map(i => i.zIndex));
         if (imageToMoveInfo.zIndex >= minOverallZ) {
            const isTiedAtMin = imageToMoveInfo.zIndex === minOverallZ && images.filter(i => i.zIndex === minOverallZ && i.id !== imageToMoveInfo.id).length > 0;
            if (imageToMoveInfo.zIndex > minOverallZ || isTiedAtMin) {
                // Try to find a new unique z-index that is one less than the current minimum of *other* layers,
                // or if multiple items are at current minOverallZ, move below them.
                // This can get complex if we want to avoid negative z-indices or compact them.
                // A simpler approach if no direct swap: if it's tied for lowest, make its z-index slightly lower
                // if new z-index remains >=0.
                // For now, if it can't swap, it means it's effectively lowest or tied for lowest.
                // The logic to push it further down (e.g. minOverallZ -1) can be added if specifically required
                // ensuring that zIndices remain sensible (e.g. >= 0).
            }
        }
      }
      return prevImages; 
    });
  }, []);


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;
    // if (originalImage.isLocked) return; // Optional: prevent duplicating locked items

    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, 
      y: originalImage.y + 2, 
      zIndex: (Math.max(-1, ...canvasImages.map(img => img.zIndex)) + 1),
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
            setSelectedCanvasImageId(null); // Deselect if locking the currently selected image
          }
          return { ...img, isLocked: isNowLocked };
        }
        return img;
      })
    );
  }, [selectedCanvasImageId]);


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

