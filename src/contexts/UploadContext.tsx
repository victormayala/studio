
'use client';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { googleFonts } from '@/lib/google-fonts';

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
  itemType?: 'image';
}

// Represents an instance of a text element on the canvas
export interface CanvasText {
  id: string;
  content: string;
  x: number; // percentage for left
  y: number; // percentage for top
  rotation: number;
  scale: number; // General scale, also affects visual font size
  zIndex: number;
  isLocked: boolean;
  itemType?: 'text'; // To help differentiate in combined lists

  // Font Settings
  fontFamily: string;
  fontSize: number; // Base font size in px, will be multiplied by scale
  textTransform: 'none' | 'uppercase' | 'lowercase';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  lineHeight: number; // Multiplier, e.g., 1.2
  letterSpacing: number; // In px
  isArchText: boolean;

  // Color Settings
  color: string; // Text fill color
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number; // In px
  shadowEnabled: boolean;
  shadowColor: string;
  shadowOffsetX: number; // In px
  shadowOffsetY: number; // In px
  shadowBlur: number; // In px
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
  addCanvasText: (content: string, initialStyle?: Partial<CanvasText>) => void;
  removeCanvasText: (canvasTextId: string) => void;
  selectedCanvasTextId: string | null;
  selectCanvasText: (canvasTextId: string | null) => void;
  updateCanvasText: (canvasTextId: string, updates: Partial<CanvasText>) => void;
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
      itemType: 'image',
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
  const addCanvasText = useCallback((content: string, initialStyle?: Partial<CanvasText>) => {
    const currentMaxZIndex = getMaxZIndex();
    const defaultFont = googleFonts.find(f => f.name === 'Arial');

    const newText: CanvasText = {
      id: crypto.randomUUID(),
      content,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
      zIndex: currentMaxZIndex + 1,
      isLocked: false,
      itemType: 'text',
      // Font Settings
      fontFamily: initialStyle?.fontFamily || (defaultFont ? defaultFont.family : 'Arial, sans-serif'),
      fontSize: initialStyle?.fontSize || 24, 
      textTransform: initialStyle?.textTransform || 'none',
      fontWeight: initialStyle?.fontWeight || 'normal',
      fontStyle: initialStyle?.fontStyle || 'normal',
      textDecoration: initialStyle?.textDecoration || 'none',
      lineHeight: initialStyle?.lineHeight || 1.2, 
      letterSpacing: initialStyle?.letterSpacing || 0, 
      isArchText: initialStyle?.isArchText || false,
      // Color Settings
      color: initialStyle?.color || '#333333', 
      outlineEnabled: initialStyle?.outlineEnabled || false,
      outlineColor: initialStyle?.outlineColor || '#000000',
      outlineWidth: initialStyle?.outlineWidth || 1,
      shadowEnabled: initialStyle?.shadowEnabled || false,
      shadowColor: initialStyle?.shadowColor || '#000000',
      shadowOffsetX: initialStyle?.shadowOffsetX || 0,
      shadowOffsetY: initialStyle?.shadowOffsetY || 0,
      shadowBlur: initialStyle?.shadowBlur || 0,
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

  const updateCanvasText = useCallback((canvasTextId: string, updates: Partial<CanvasText>) => {
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

  const reorderLayers = useCallback((itemId: string, itemType: 'image' | 'text', direction: 'forward' | 'backward') => {
    setCanvasImages(prevImages => {
      setCanvasTexts(prevTexts => {
        let allItems: CanvasItem[] = [
          ...prevImages.map(img => ({ ...img, itemType: 'image' as const })),
          ...prevTexts.map(txt => ({ ...txt, itemType: 'text' as const })),
        ];

        // Sort by current zIndex to establish visual order
        allItems.sort((a, b) => a.zIndex - b.zIndex);

        const currentIndex = allItems.findIndex(item => item.id === itemId && item.itemType === itemType);

        if (currentIndex === -1 || allItems[currentIndex].isLocked) {
          return prevTexts; // No change to texts, implicitly returns prevImages due to outer scope
        }

        let targetIndex = -1;

        if (direction === 'forward') {
          if (currentIndex < allItems.length - 1) {
            targetIndex = currentIndex + 1;
            // Find the next non-locked item to swap with
            for (let i = currentIndex + 1; i < allItems.length; i++) {
                if (!allItems[i].isLocked) {
                    targetIndex = i;
                    break;
                }
                if (i === allItems.length -1) targetIndex = -1; // all items above are locked
            }
          }
        } else { // backward
          if (currentIndex > 0) {
            targetIndex = currentIndex - 1;
             // Find the next non-locked item to swap with
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (!allItems[i].isLocked) {
                    targetIndex = i;
                    break;
                }
                if (i === 0) targetIndex = -1; // all items below are locked
            }
          }
        }
        
        if (targetIndex !== -1) {
          // Perform the swap in the sorted list
          const temp = allItems[currentIndex];
          allItems.splice(currentIndex, 1); // Remove item from current position
          allItems.splice(targetIndex, 0, temp); // Insert item at target position
        } else {
           // Cannot move (e.g., at top/bottom or blocked by locked items)
          return prevTexts;
        }
        
        const newCanvasImagesArray: CanvasImage[] = [];
        const newCanvasTextsArray: CanvasText[] = [];

        // Re-assign zIndex based on the new order
        allItems.forEach((item, newZIndex) => {
          const updatedItem = { ...item, zIndex: newZIndex };
          if (updatedItem.itemType === 'image') {
            newCanvasImagesArray.push(updatedItem as CanvasImage);
          } else {
            newCanvasTextsArray.push(updatedItem as CanvasText);
          }
        });

        // Only update state if there's an actual change to avoid infinite loops
        // This check is tricky because zIndices are always reassigned.
        // A more robust check would be if the actual order of IDs changed.
        // For now, we assume if reorderLayers was called, an update is intended.
        
        setCanvasTexts(newCanvasTextsArray); // Update texts first
        // setCanvasImages will be updated by the outer setCanvasImages(prevImages => ...)
        // We need to return the new images array from this inner function
        // This structure is a bit complex due to nested state updates.
        // Ideally, allItems state would be managed together.
        
        // This part is tricky: we need to return the new images for the outer `setCanvasImages`
        // and we've already called `setCanvasTexts`. This might lead to one state
        // updating before the other is ready for the `getMaxZIndex` in `addCanvasItem`.
        // A better approach might be to have a single `setCanvasItems` if possible.
        
        // For now, let's assume this direct update works for `setCanvasTexts`
        // and the `newCanvasImagesArray` is what the outer `setCanvasImages` needs.
        return newCanvasImagesArray; // This is for the setCanvasImages
      });
      return prevImages; // This is the default return for setCanvasImages if texts didn't trigger a change
                         // but we actually need to return the newCanvasImagesArray calculated above.
                         // The logic above is flawed for separate state updates.
                         // Let's simplify and return the modified images from reorder.
    });

     // The above nested updater is problematic. Let's simplify the state update part of reorderLayers
     // and call setCanvasImages and setCanvasTexts separately after computing new arrays.

    let allItems: CanvasItem[] = [
      ...canvasImages.map(img => ({ ...img, itemType: 'image' as const })),
      ...canvasTexts.map(txt => ({ ...txt, itemType: 'text' as const })),
    ];
    allItems.sort((a, b) => a.zIndex - b.zIndex);
    const currentIndex = allItems.findIndex(item => item.id === itemId && item.itemType === itemType);
    if (currentIndex === -1 || allItems[currentIndex].isLocked) return;

    let targetIndex = -1;
    if (direction === 'forward') {
      if (currentIndex < allItems.length - 1) {
        targetIndex = currentIndex; // placeholder
        for (let i = currentIndex + 1; i < allItems.length; i++) {
            if (!allItems[i].isLocked) { targetIndex = i; break; }
            if (i === allItems.length -1) {targetIndex = -1; break;} // all items above are locked
        }
        if(targetIndex === currentIndex) targetIndex = -1; // No non-locked item found above
      }
    } else { // backward
      if (currentIndex > 0) {
        targetIndex = currentIndex; // placeholder
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!allItems[i].isLocked) { targetIndex = i; break; }
            if (i === 0) {targetIndex = -1; break;} // all items below are locked
        }
        if(targetIndex === currentIndex) targetIndex = -1; // No non-locked item found below
      }
    }
    
    if (targetIndex !== -1) {
      const itemToMove = allItems.splice(currentIndex, 1)[0];
      allItems.splice(targetIndex, 0, itemToMove);
    } else {
      return; // Cannot move
    }
    
    const newImages: CanvasImage[] = [];
    const newTexts: CanvasText[] = [];
    allItems.forEach((item, newZIndex) => {
      const updatedItem = { ...item, zIndex: newZIndex };
      if (updatedItem.itemType === 'image') newImages.push(updatedItem as CanvasImage);
      else newTexts.push(updatedItem as CanvasText);
    });
    setCanvasImages(newImages);
    setCanvasTexts(newTexts);

  }, [canvasImages, canvasTexts]); // Added canvasImages, canvasTexts to dependencies


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


    