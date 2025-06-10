
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
}

interface UploadContextType {
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => Promise<void>;
  canvasImages: CanvasImage[];
  addCanvasImage: (sourceImageId: string) => void;
  removeCanvasImage: (canvasImageId: string) => void;
  selectedCanvasImageId: string | null;
  selectCanvasImage: (canvasImageId: string | null) => void;
  updateCanvasImage: (canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex'>>) => void;
  bringLayerForward: (canvasImageId: string) => void;
  sendLayerBackward: (canvasImageId: string) => void;
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
      id: crypto.randomUUID(), // Unique ID for the canvas instance
      sourceImageId: sourceImage.id,
      name: sourceImage.name,
      dataUrl: sourceImage.dataUrl,
      type: sourceImage.type,
      scale: 1,
      rotation: 0,
      x: 50, // Default to center (percentage)
      y: 50, // Default to center (percentage)
      zIndex: (Math.max(0, ...canvasImages.map(img => img.zIndex)) + 1), // New images on top
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
  }, [uploadedImages, canvasImages, setCanvasImages, setSelectedCanvasImageId]);

  const removeCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== canvasImageId));
    if (selectedCanvasImageId === canvasImageId) {
      setSelectedCanvasImageId(null);
    }
  }, [selectedCanvasImageId, setCanvasImages, setSelectedCanvasImageId]);

  const selectCanvasImage = useCallback((canvasImageId: string | null) => {
    setSelectedCanvasImageId(canvasImageId);
  }, [setSelectedCanvasImageId]);

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex'>>) => {
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
        return prevImages; // Not found or already at the top
      }

      const imageToMove = sortedImages[currentIndex];
      const imageAbove = sortedImages[currentIndex + 1];

      // Swap zIndex
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
  }, [setCanvasImages]);

  const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
      const sortedImages = [...prevImages].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedImages.findIndex(img => img.id === canvasImageId);

      if (currentIndex === -1 || currentIndex === 0) {
        return prevImages; // Not found or already at the bottom
      }

      const imageToMove = sortedImages[currentIndex];
      const imageBelow = sortedImages[currentIndex - 1];

      // Swap zIndex
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
  }, [setCanvasImages]);


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
