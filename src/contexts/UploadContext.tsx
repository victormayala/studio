
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
  duplicateCanvasImage: (canvasImageId: string) => void; // New function
  toggleLockCanvasImage: (canvasImageId: string) => void; // New function
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
      isLocked: false, // Default to not locked
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
    // Prevent selection if the target image is locked
    const imageToSelect = canvasImages.find(img => img.id === canvasImageId);
    if (imageToSelect?.isLocked) {
      setSelectedCanvasImageId(null); // Or just do nothing: return;
      return;
    }
    setSelectedCanvasImageId(canvasImageId);
  }, [canvasImages]);

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => {
    setCanvasImages(prevCanvasImages =>
      prevCanvasImages.map(img =>
        img.id === canvasImageId ? { ...img, ...updates } : img
      )
    );
  }, [setCanvasImages]);

  const bringLayerForward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const sortedImages = [...prevImages].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedImages.findIndex(img => img.id === canvasImageId);

      if (currentIndex === -1 || currentIndex === sortedImages.length - 1) {
        return prevImages; 
      }

      const imageToMove = sortedImages[currentIndex];
      const imageAbove = sortedImages[currentIndex + 1];

      const newZIndexOfImageToMove = imageAbove.zIndex;
      const newZIndexOfImageAbove = imageToMove.zIndex;

      return prevImages.map(img => {
        if (img.id === imageToMove.id) {
          return { ...img, zIndex: newZIndexOfImageToMove };
        }
        if (img.id === imageAbove.id) {
          return { ...img, zIndex: newZIndexOfImageAbove };
        }
        return img;
      });
    });
  }, []);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const sortedImages = [...prevImages].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedImages.findIndex(img => img.id === canvasImageId);

      if (currentIndex === -1 || currentIndex === 0) {
        return prevImages; 
      }

      const imageToMove = sortedImages[currentIndex];
      const imageBelow = sortedImages[currentIndex - 1];
      
      const newZIndexOfImageToMove = imageBelow.zIndex;
      const newZIndexOfImageBelow = imageToMove.zIndex;
      
      return prevImages.map(img => {
        if (img.id === imageToMove.id) {
          return { ...img, zIndex: newZIndexOfImageToMove };
        }
        if (img.id === imageBelow.id) {
          return { ...img, zIndex: newZIndexOfImageBelow };
        }
        return img;
      });
    });
  }, []);

  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;

    const newCanvasImage: CanvasImage = {
      ...originalImage,
      id: crypto.randomUUID(),
      x: originalImage.x + 2, // Offset slightly (percentage)
      y: originalImage.y + 2, // Offset slightly (percentage)
      zIndex: (Math.max(0, ...canvasImages.map(img => img.zIndex), 0) + 1),
      isLocked: false, // New duplicates are unlocked
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id); // Select the new duplicate
  }, [canvasImages]);

  const toggleLockCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages =>
      prevImages.map(img => {
        if (img.id === canvasImageId) {
          const isNowLocked = !img.isLocked;
          // If locking the currently selected image, deselect it
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
