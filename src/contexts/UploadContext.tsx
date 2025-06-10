
'use client';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  type: string; // e.g., 'image/png'
  scale: number;
  rotation: number;
}

interface UploadContextType {
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => Promise<void>;
  activeUploadedImage: UploadedImage | null;
  setActiveUploadedImage: Dispatch<SetStateAction<UploadedImage | null>>;
  clearActiveUploadedImage: () => void;
  updateActiveImageTransform: (transform: Partial<{ scale: number; rotation: number }>) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [activeUploadedImage, setActiveUploadedImage] = useState<UploadedImage | null>(null);

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
          scale: 1,
          rotation: 0,
        };
        setUploadedImages((prev) => [...prev, newImage]);
        // Optionally, set the newly uploaded image as active immediately
        // setActiveUploadedImage(newImage);
      }
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      // TODO: Implement user-facing error handling, e.g., using a toast notification
    };
    reader.readAsDataURL(file);
  }, []);

  const clearActiveUploadedImage = useCallback(() => {
    setActiveUploadedImage(null);
  }, []);

  const updateActiveImageTransform = useCallback((transform: Partial<{ scale: number; rotation: number }>) => {
    setActiveUploadedImage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...transform,
      };
    });
    // Also update the image in the main list if you want transforms to be persistent
    // when switching between images. For now, this only affects the active one.
    // If persistence is needed:
    setUploadedImages(prevImages => 
      prevImages.map(img => 
        img.id === activeUploadedImage?.id ? { ...img, ...transform } : img
      )
    );

  }, [activeUploadedImage?.id]);

  return (
    <UploadContext.Provider
      value={{
        uploadedImages,
        addUploadedImage,
        activeUploadedImage,
        setActiveUploadedImage,
        clearActiveUploadedImage,
        updateActiveImageTransform,
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
