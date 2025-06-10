
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
      zIndex: (Math.max(0, ...canvasImages.map(img => img.zIndex), 0) + 1),
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
    // If trying to select an image that is locked, via canvas click, prevent it.
    // Selection via LayersPanel might still be allowed based on UX decision in LayersPanel.tsx
    const imageToSelect = canvasImages.find(img => img.id === canvasImageId);
    if (imageToSelect?.isLocked && canvasImageId !== null) { // check canvasImageId !== null to allow deselection
        // If the currently selected image is the one we are trying to select (and it's locked)
        // and the call is coming from a direct canvas click (not layers panel),
        // it might be better to just return or ensure it gets deselected if already selected.
        // For now, we allow selection from LayersPanel even if locked, but prevent canvas interaction.
        // If we want to block selection from LayersPanel too, that logic would be in LayersPanel.
        // This function primarily handles selection state.
    }
    setSelectedCanvasImageId(canvasImageId);
  }, [canvasImages]); // Removed imageToSelect from dep array as it caused re-runs

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => {
    setCanvasImages(prevCanvasImages =>
      prevCanvasImages.map(img =>
        img.id === canvasImageId ? { ...img, ...updates } : img
      )
    );
  }, [setCanvasImages]); // setCanvasImages is stable

  const bringLayerForward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const images = [...prevImages];
      const imageToMove = images.find(img => img.id === canvasImageId);
      if (!imageToMove || imageToMove.isLocked) return prevImages;

      const sortedByZIndex = images.filter(img => img.id !== canvasImageId).sort((a, b) => a.zIndex - b.zIndex);
      
      let newZIndex = imageToMove.zIndex;
      let foundHigher = false;
      for (const otherImage of sortedByZIndex) {
        if (otherImage.zIndex > imageToMove.zIndex) {
          newZIndex = otherImage.zIndex;
          otherImage.zIndex = imageToMove.zIndex;
          foundHigher = true;
          break; 
        }
      }
      if(!foundHigher && sortedByZIndex.length > 0) {
         // It's already the highest among others, or only one image. If it needs to go above itself effectively.
         // This case needs careful thought. If it's the highest, it can't go "higher" by swapping.
         // For simplicity, if it's the highest non-locked item, this might not change anything or it might take the zIndex of the next item.
         // A robust way: assign a new highest zIndex if it's not already the absolute highest.
      }
      
      if (foundHigher) {
        imageToMove.zIndex = newZIndex;
      } else {
        // If it didn't swap (e.g. it's already highest or only item), re-evaluate z-indices if needed
        // or ensure its zIndex is correctly set relative to others.
        // For now, if no swap happened, we ensure its zIndex is at least max + 1 if it's not the only one
        const maxZ = Math.max(...images.map(i => i.zIndex), 0);
        if (imageToMove.zIndex <= maxZ && images.length > 1 && imageToMove.zIndex !== maxZ) {
            // This logic is tricky; direct swapping is better.
        }
      }
      // The direct swap logic:
      const currentImageIndex = images.findIndex(img => img.id === canvasImageId);
      if (currentImageIndex === -1) return prevImages;

      // Create a list of (zIndex, originalIndex) for images other than the one being moved
      const otherImagesZIndices = images
        .map((img, idx) => ({ zIndex: img.zIndex, originalIndex: idx, id: img.id }))
        .filter(imgInfo => imgInfo.id !== canvasImageId)
        .sort((a,b) => a.zIndex - b.zIndex);

      const imageToMoveInfo = images[currentImageIndex];
      let targetSwapIndex = -1;

      for(let i = 0; i < otherImagesZIndices.length; i++) {
        if (otherImagesZIndices[i].zIndex > imageToMoveInfo.zIndex) {
            targetSwapIndex = otherImagesZIndices[i].originalIndex;
            break;
        }
      }
      
      if (targetSwapIndex !== -1) {
        const tempZ = images[targetSwapIndex].zIndex;
        images[targetSwapIndex].zIndex = imageToMoveInfo.zIndex;
        imageToMoveInfo.zIndex = tempZ;
        return images.map(img => ({...img})); // new array of new objects
      } else {
        // If no image is strictly above it, it might be the highest or tied.
        // To ensure it moves "forward", if it's not already the max, give it max+1
        const maxZ = Math.max(...images.map(i => i.zIndex));
        if (imageToMoveInfo.zIndex < maxZ || images.filter(i => i.zIndex === maxZ).length > 1) {
            imageToMoveInfo.zIndex = maxZ + 1;
             return images.map(img => ({...img}));
        }
      }


      return prevImages; // Return original if no change
    });
  }, []);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const images = [...prevImages];
      const imageToMove = images.find(img => img.id === canvasImageId);
      if (!imageToMove || imageToMove.isLocked) return prevImages;

      const currentImageIndex = images.findIndex(img => img.id === canvasImageId);
      if (currentImageIndex === -1) return prevImages;
      
      const otherImagesZIndices = images
        .map((img, idx) => ({ zIndex: img.zIndex, originalIndex: idx, id: img.id }))
        .filter(imgInfo => imgInfo.id !== canvasImageId)
        .sort((a,b) => b.zIndex - a.zIndex); // sort descending for finding one below

      const imageToMoveInfo = images[currentImageIndex];
      let targetSwapIndex = -1;

      for(let i = 0; i < otherImagesZIndices.length; i++) {
        if (otherImagesZIndices[i].zIndex < imageToMoveInfo.zIndex) {
            targetSwapIndex = otherImagesZIndices[i].originalIndex;
            break;
        }
      }

      if (targetSwapIndex !== -1) {
        const tempZ = images[targetSwapIndex].zIndex;
        images[targetSwapIndex].zIndex = imageToMoveInfo.zIndex;
        imageToMoveInfo.zIndex = tempZ;
        return images.map(img => ({...img}));
      } else {
        // If no image is strictly below it, it might be the lowest or tied.
        // To ensure it moves "backward", if it's not already min, give it min-1 (if positive)
        const minZ = Math.min(...images.map(i => i.zIndex));
         if (imageToMoveInfo.zIndex > minZ || images.filter(i => i.zIndex === minZ).length > 1) {
            // This needs careful handling if zIndices can be anything.
            // A simpler model might be to just re-assign zIndices 0 to N-1 after sorting.
            // For now, if it didn't swap, we ensure its zIndex is correctly relative.
            // If layers are dense (1,2,3,4), this swap works. If sparse (1, 5, 10), it also works.
        }
      }
      return prevImages; // Return original if no change
    });
  }, []);


  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    // Do not duplicate if original is locked, or handle as per UX decision
    // if (originalImage?.isLocked) return; 
    if (!originalImage) return;


    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, 
      y: originalImage.y + 2, 
      zIndex: (Math.max(0, ...canvasImages.map(img => img.zIndex), 0) + 1),
      isLocked: false, // New duplicates are unlocked
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
            setSelectedCanvasImageId(null);
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

