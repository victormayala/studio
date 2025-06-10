
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

const bringLayerForward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
        const imagesCopy = [...prevImages].map(img => ({ ...img })); // Create shallow copies
        const sortedImages = [...imagesCopy].sort((a, b) => a.zIndex - b.zIndex);
        const imageIndex = sortedImages.findIndex(img => img.id === canvasImageId);

        if (imageIndex === -1 || sortedImages[imageIndex].isLocked) return prevImages; // Original array if not found or locked

        if (imageIndex === sortedImages.length - 1) { // Already at the top visually
            const topZ = sortedImages[imageIndex].zIndex;
            const isTiedAtTop = sortedImages.some((img, idx) => idx !== imageIndex && img.zIndex === topZ);
            if (isTiedAtTop) { // If tied, increment this one's zIndex
                const newImages = prevImages.map(img => 
                    img.id === canvasImageId ? { ...img, zIndex: topZ + 1 } : img
                );
                return newImages;
            }
            return prevImages; // No change if uniquely at the top
        }

        const currentImage = sortedImages[imageIndex];
        const nextImageInVisualOrder = sortedImages[imageIndex + 1];
        
        // Find the original objects in imagesCopy to swap zIndex
        const originalCurrentImage = imagesCopy.find(img => img.id === currentImage.id)!;
        const originalNextImage = imagesCopy.find(img => img.id === nextImageInVisualOrder.id)!;

        const currentImageOriginalZ = originalCurrentImage.zIndex;
        const nextImageOriginalZ = originalNextImage.zIndex;

        originalCurrentImage.zIndex = nextImageOriginalZ;
        originalNextImage.zIndex = currentImageOriginalZ;

        // If they had the same zIndex initially, ensure the moved image is now higher
        if (currentImageOriginalZ === nextImageOriginalZ) {
            originalCurrentImage.zIndex = currentImageOriginalZ + 1;
        }
        
        return imagesCopy; // Return the modified copy
    });
}, []);

const sendLayerBackward = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages => {
        const imagesCopy = [...prevImages].map(img => ({ ...img })); // Create shallow copies
        const sortedImages = [...imagesCopy].sort((a, b) => a.zIndex - b.zIndex);
        const imageIndex = sortedImages.findIndex(img => img.id === canvasImageId);

        if (imageIndex === -1 || sortedImages[imageIndex].isLocked) return prevImages;
        if (imageIndex === 0) { // Already at the bottom visually
            const bottomZ = sortedImages[imageIndex].zIndex;
            const isTiedAtBottom = sortedImages.some((img, idx) => idx !== imageIndex && img.zIndex === bottomZ);
            if (isTiedAtBottom && bottomZ > 0) {
                 const newImages = prevImages.map(img => 
                    img.id === canvasImageId ? { ...img, zIndex: Math.max(0, bottomZ - 1) } : img
                 );
                 return newImages;
            }
            return prevImages; // No change if uniquely at bottom or zIndex 0
        }

        const currentImage = sortedImages[imageIndex];
        const prevImageInVisualOrder = sortedImages[imageIndex - 1];

        const originalCurrentImage = imagesCopy.find(img => img.id === currentImage.id)!;
        const originalPrevImage = imagesCopy.find(img => img.id === prevImageInVisualOrder.id)!;

        const currentImageOriginalZ = originalCurrentImage.zIndex;
        const prevImageOriginalZ = originalPrevImage.zIndex;

        originalCurrentImage.zIndex = prevImageOriginalZ;
        originalPrevImage.zIndex = currentImageOriginalZ;
        
        if (currentImageOriginalZ === prevImageOriginalZ && currentImageOriginalZ > 0) {
            originalPrevImage.zIndex = currentImageOriginalZ + 1; // The one "behind" which it moved gets higher zIndex
        }
        return imagesCopy;
    });
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

  const bringTextLayerForward = useCallback((canvasTextId: string) => {
    setCanvasTexts(prevTexts => {
        const textsCopy = [...prevTexts].map(txt => ({ ...txt }));
        const sortedTexts = [...textsCopy].sort((a, b) => a.zIndex - b.zIndex);
        const textIndex = sortedTexts.findIndex(txt => txt.id === canvasTextId);

        if (textIndex === -1 || sortedTexts[textIndex].isLocked) return prevTexts;

        if (textIndex === sortedTexts.length - 1) {
            const topZ = sortedTexts[textIndex].zIndex;
            const isTiedAtTop = sortedTexts.some((txt, idx) => idx !== textIndex && txt.zIndex === topZ);
            if (isTiedAtTop) {
                return prevTexts.map(txt => txt.id === canvasTextId ? { ...txt, zIndex: topZ + 1 } : txt);
            }
            return prevTexts;
        }

        const currentText = sortedTexts[textIndex];
        const nextTextInVisualOrder = sortedTexts[textIndex + 1];
        
        const originalCurrentText = textsCopy.find(txt => txt.id === currentText.id)!;
        const originalNextText = textsCopy.find(txt => txt.id === nextTextInVisualOrder.id)!;

        const currentTextOriginalZ = originalCurrentText.zIndex;
        const nextTextOriginalZ = originalNextText.zIndex;

        originalCurrentText.zIndex = nextTextOriginalZ;
        originalNextText.zIndex = currentTextOriginalZ;

        if (currentTextOriginalZ === nextTextOriginalZ) {
            originalCurrentText.zIndex = currentTextOriginalZ + 1;
        }
        return textsCopy;
    });
  }, []);

  const sendTextLayerBackward = useCallback((canvasTextId: string) => {
    setCanvasTexts(prevTexts => {
        const textsCopy = [...prevTexts].map(txt => ({ ...txt }));
        const sortedTexts = [...textsCopy].sort((a, b) => a.zIndex - b.zIndex);
        const textIndex = sortedTexts.findIndex(txt => txt.id === canvasTextId);

        if (textIndex === -1 || sortedTexts[textIndex].isLocked) return prevTexts;
        if (textIndex === 0) {
            const bottomZ = sortedTexts[textIndex].zIndex;
            const isTiedAtBottom = sortedTexts.some((txt, idx) => idx !== textIndex && txt.zIndex === bottomZ);
            if (isTiedAtBottom && bottomZ > 0) {
                 return prevTexts.map(txt => txt.id === canvasTextId ? { ...txt, zIndex: Math.max(0, bottomZ - 1) } : txt);
            }
            return prevTexts;
        }

        const currentText = sortedTexts[textIndex];
        const prevTextInVisualOrder = sortedTexts[textIndex - 1];

        const originalCurrentText = textsCopy.find(txt => txt.id === currentText.id)!;
        const originalPrevText = textsCopy.find(txt => txt.id === prevTextInVisualOrder.id)!;
        
        const currentTextOriginalZ = originalCurrentText.zIndex;
        const prevTextOriginalZ = originalPrevText.zIndex;

        originalCurrentText.zIndex = prevTextOriginalZ;
        originalPrevText.zIndex = currentTextOriginalZ;
        
        if (currentTextOriginalZ === prevTextOriginalZ && currentTextOriginalZ > 0) {
            originalPrevText.zIndex = currentTextOriginalZ + 1;
        }
        return textsCopy;
    });
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
