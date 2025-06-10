
'use client';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  type: string; // e.g., 'image/png'
}

interface UploadContextType {
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => Promise<void>;
  activeUploadedImage: UploadedImage | null;
  setActiveUploadedImage: Dispatch<SetStateAction<UploadedImage | null>>;
  clearActiveUploadedImage: () => void;
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

  return (
    <UploadContext.Provider
      value={{
        uploadedImages,
        addUploadedImage,
        activeUploadedImage,
        setActiveUploadedImage,
        clearActiveUploadedImage,
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
