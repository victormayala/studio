
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
  sourceImageId: string; // ID of the original UploadedImage or a clipart ID
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

// Represents an instance of a shape on the canvas
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'star'; // Add more as needed

export interface CanvasShape {
  id: string;
  shapeType: ShapeType;
  x: number; // percentage for left (center of shape)
  y: number; // percentage for top (center of shape)
  width: number; // base width in px
  height: number; // base height in px
  rotation: number;
  scale: number;
  color: string; // fill color
  strokeColor: string;
  strokeWidth: number;
  zIndex: number;
  isLocked: boolean;
  itemType?: 'shape';
}


// Helper type for combined operations
type CanvasItem = (CanvasImage & { itemType: 'image' }) | (CanvasText & { itemType: 'text' }) | (CanvasShape & { itemType: 'shape' });


interface UploadContextType {
  uploadedImages: UploadedImage[];
  addUploadedImage: (file: File) => Promise<void>;
  
  canvasImages: CanvasImage[];
  addCanvasImage: (sourceImageId: string) => void;
  addCanvasImageFromUrl: (name: string, dataUrl: string, type: string, sourceId?: string) => void; // Added sourceId
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

  canvasShapes: CanvasShape[];
  addCanvasShape: (shapeType: ShapeType, initialProps?: Partial<CanvasShape>) => void;
  removeCanvasShape: (shapeId: string) => void;
  selectedCanvasShapeId: string | null;
  selectCanvasShape: (shapeId: string | null) => void;
  updateCanvasShape: (shapeId: string, updates: Partial<CanvasShape>) => void;
  bringShapeLayerForward: (shapeId: string) => void;
  sendShapeLayerBackward: (shapeId: string) => void;
  duplicateCanvasShape: (shapeId: string) => void;
  toggleLockCanvasShape: (shapeId: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [selectedCanvasImageId, setSelectedCanvasImageId] = useState<string | null>(null);

  const [canvasTexts, setCanvasTexts] = useState<CanvasText[]>([]);
  const [selectedCanvasTextId, setSelectedCanvasTextId] = useState<string | null>(null);
  
  const [canvasShapes, setCanvasShapes] = useState<CanvasShape[]>([]);
  const [selectedCanvasShapeId, setSelectedCanvasShapeId] = useState<string | null>(null);

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
    const shapeZIndexes = canvasShapes.map(shp => shp.zIndex);
    return Math.max(-1, ...imageZIndexes, ...textZIndexes, ...shapeZIndexes);
  }, [canvasImages, canvasTexts, canvasShapes]);

  // Image Functions
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
      scale: 1, rotation: 0, x: 50, y: 50, 
      zIndex: currentMaxZIndex + 1, isLocked: false, itemType: 'image',
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
    setSelectedCanvasTextId(null);
    setSelectedCanvasShapeId(null);
  }, [uploadedImages, getMaxZIndex]);

  const addCanvasImageFromUrl = useCallback((name: string, dataUrl: string, type: string, sourceId?: string) => {
    const currentMaxZIndex = getMaxZIndex();
    const newCanvasImage: CanvasImage = {
      id: crypto.randomUUID(),
      sourceImageId: sourceId || `url-${crypto.randomUUID()}`, // Use provided sourceId or generate one for URL-based images
      name: name,
      dataUrl: dataUrl,
      type: type,
      scale: 1, rotation: 0, x: 50, y: 50, 
      zIndex: currentMaxZIndex + 1, isLocked: false, itemType: 'image',
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id);
    setSelectedCanvasTextId(null);
    setSelectedCanvasShapeId(null);
  }, [getMaxZIndex]);


  const removeCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== canvasImageId));
    if (selectedCanvasImageId === canvasImageId) setSelectedCanvasImageId(null);
  }, [selectedCanvasImageId]);

  const selectCanvasImage = useCallback((canvasImageId: string | null) => {
    setSelectedCanvasImageId(canvasImageId);
    if (canvasImageId !== null) {
      setSelectedCanvasTextId(null);
      setSelectedCanvasShapeId(null);
    }
  }, []); 

  const updateCanvasImage = useCallback((canvasImageId: string, updates: Partial<Pick<CanvasImage, 'scale' | 'rotation' | 'x' | 'y' | 'zIndex' | 'isLocked'>>) => {
    setCanvasImages(prev => prev.map(img => img.id === canvasImageId ? { ...img, ...updates } : img));
  }, []); 

  const duplicateCanvasImage = useCallback((canvasImageId: string) => {
    const originalImage = canvasImages.find(img => img.id === canvasImageId);
    if (!originalImage) return;
    const currentMaxZIndex = getMaxZIndex();
    const newCanvasImage: CanvasImage = {
      ...originalImage, id: crypto.randomUUID(), x: originalImage.x + 2, y: originalImage.y + 2, 
      zIndex: currentMaxZIndex + 1, isLocked: false,
    };
    setCanvasImages(prev => [...prev, newCanvasImage]);
    setSelectedCanvasImageId(newCanvasImage.id); 
    setSelectedCanvasTextId(null);
    setSelectedCanvasShapeId(null);
  }, [canvasImages, getMaxZIndex]);

  const toggleLockCanvasImage = useCallback((canvasImageId: string) => {
    setCanvasImages(prevImages =>
      prevImages.map(img => {
        if (img.id === canvasImageId) {
          const isNowLocked = !img.isLocked;
          if (isNowLocked && selectedCanvasImageId === canvasImageId) setSelectedCanvasImageId(null);
          return { ...img, isLocked: isNowLocked };
        }
        return img;
      })
    );
  }, [selectedCanvasImageId]);

  // Text Functions
  const addCanvasText = useCallback((content: string, initialStyle?: Partial<CanvasText>) => {
    const currentMaxZIndex = getMaxZIndex();
    const defaultFont = googleFonts.find(f => f.name === 'Arial');
    const newText: CanvasText = {
      id: crypto.randomUUID(), content, x: 50, y: 50, rotation: 0, scale: 1, 
      zIndex: currentMaxZIndex + 1, isLocked: false, itemType: 'text',
      fontFamily: initialStyle?.fontFamily || (defaultFont ? defaultFont.family : 'Arial, sans-serif'),
      fontSize: initialStyle?.fontSize || 24, textTransform: initialStyle?.textTransform || 'none',
      fontWeight: initialStyle?.fontWeight || 'normal', fontStyle: initialStyle?.fontStyle || 'normal',
      textDecoration: initialStyle?.textDecoration || 'none', lineHeight: initialStyle?.lineHeight || 1.2, 
      letterSpacing: initialStyle?.letterSpacing || 0, isArchText: initialStyle?.isArchText || false,
      color: initialStyle?.color || '#333333', outlineEnabled: initialStyle?.outlineEnabled || false,
      outlineColor: initialStyle?.outlineColor || '#000000', outlineWidth: initialStyle?.outlineWidth || 1,
      shadowEnabled: initialStyle?.shadowEnabled || false, shadowColor: initialStyle?.shadowColor || '#000000',
      shadowOffsetX: initialStyle?.shadowOffsetX || 0, shadowOffsetY: initialStyle?.shadowOffsetY || 0,
      shadowBlur: initialStyle?.shadowBlur || 0,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null);
    setSelectedCanvasShapeId(null);
  }, [getMaxZIndex]);

  const removeCanvasText = useCallback((canvasTextId: string) => {
    setCanvasTexts(prev => prev.filter(txt => txt.id !== canvasTextId));
    if (selectedCanvasTextId === canvasTextId) setSelectedCanvasTextId(null);
  }, [selectedCanvasTextId]);

  const selectCanvasText = useCallback((canvasTextId: string | null) => {
    setSelectedCanvasTextId(canvasTextId);
    if (canvasTextId !== null) {
      setSelectedCanvasImageId(null);
      setSelectedCanvasShapeId(null);
    }
  }, []);

  const updateCanvasText = useCallback((canvasTextId: string, updates: Partial<CanvasText>) => {
    setCanvasTexts(prev => prev.map(txt => txt.id === canvasTextId ? { ...txt, ...updates } : txt));
  }, []);

  const duplicateCanvasText = useCallback((canvasTextId: string) => {
    const originalText = canvasTexts.find(txt => txt.id === canvasTextId);
    if (!originalText) return;
    const currentMaxZIndex = getMaxZIndex();
    const newText: CanvasText = {
      ...originalText, id: crypto.randomUUID(), x: originalText.x + 2, y: originalText.y + 2,
      zIndex: currentMaxZIndex + 1, isLocked: false,
    };
    setCanvasTexts(prev => [...prev, newText]);
    setSelectedCanvasTextId(newText.id);
    setSelectedCanvasImageId(null);
    setSelectedCanvasShapeId(null);
  }, [canvasTexts, getMaxZIndex]);

  const toggleLockCanvasText = useCallback((canvasTextId: string) => {
    setCanvasTexts(prevTexts =>
      prevTexts.map(txt => {
        if (txt.id === canvasTextId) {
          const isNowLocked = !txt.isLocked;
          if (isNowLocked && selectedCanvasTextId === canvasTextId) setSelectedCanvasTextId(null);
          return { ...txt, isLocked: isNowLocked };
        }
        return txt;
      })
    );
  }, [selectedCanvasTextId]);

  // Shape Functions
  const addCanvasShape = useCallback((shapeType: ShapeType, initialProps?: Partial<CanvasShape>) => {
    const currentMaxZIndex = getMaxZIndex();
    const defaultProps: CanvasShape = {
      id: crypto.randomUUID(),
      shapeType,
      x: 50, y: 50,
      width: 100, height: 100, // Default size
      rotation: 0, scale: 1,
      color: initialProps?.color || '#468189', // Primary color
      strokeColor: initialProps?.strokeColor || '#000000',
      strokeWidth: initialProps?.strokeWidth || 0,
      zIndex: currentMaxZIndex + 1,
      isLocked: false,
      itemType: 'shape',
      ...initialProps,
    };
    if (shapeType === 'circle') {
      defaultProps.height = defaultProps.width; // Ensure circle is a circle
    }

    setCanvasShapes(prev => [...prev, defaultProps]);
    setSelectedCanvasShapeId(defaultProps.id);
    setSelectedCanvasImageId(null);
    setSelectedCanvasTextId(null);
  }, [getMaxZIndex]);

  const removeCanvasShape = useCallback((shapeId: string) => {
    setCanvasShapes(prev => prev.filter(shp => shp.id !== shapeId));
    if (selectedCanvasShapeId === shapeId) setSelectedCanvasShapeId(null);
  }, [selectedCanvasShapeId]);

  const selectCanvasShape = useCallback((shapeId: string | null) => {
    setSelectedCanvasShapeId(shapeId);
    if (shapeId !== null) {
      setSelectedCanvasImageId(null);
      setSelectedCanvasTextId(null);
    }
  }, []);

  const updateCanvasShape = useCallback((shapeId: string, updates: Partial<CanvasShape>) => {
    setCanvasShapes(prev => prev.map(shp => shp.id === shapeId ? { ...shp, ...updates } : shp));
  }, []);

  const duplicateCanvasShape = useCallback((shapeId: string) => {
    const originalShape = canvasShapes.find(shp => shp.id === shapeId);
    if (!originalShape) return;
    const currentMaxZIndex = getMaxZIndex();
    const newShape: CanvasShape = {
      ...originalShape, id: crypto.randomUUID(), x: originalShape.x + 2, y: originalShape.y + 2,
      zIndex: currentMaxZIndex + 1, isLocked: false,
    };
    setCanvasShapes(prev => [...prev, newShape]);
    setSelectedCanvasShapeId(newShape.id);
    setSelectedCanvasImageId(null);
    setSelectedCanvasTextId(null);
  }, [canvasShapes, getMaxZIndex]);

  const toggleLockCanvasShape = useCallback((shapeId: string) => {
    setCanvasShapes(prevShapes =>
      prevShapes.map(shp => {
        if (shp.id === shapeId) {
          const isNowLocked = !shp.isLocked;
          if (isNowLocked && selectedCanvasShapeId === shapeId) setSelectedCanvasShapeId(null);
          return { ...shp, isLocked: isNowLocked };
        }
        return shp;
      })
    );
  }, [selectedCanvasShapeId]);

  // Generic Layer Reordering
  const reorderLayers = useCallback((itemId: string, itemType: 'image' | 'text' | 'shape', direction: 'forward' | 'backward') => {
    let allItems: CanvasItem[] = [
      ...canvasImages.map(img => ({ ...img, itemType: 'image' as const })),
      ...canvasTexts.map(txt => ({ ...txt, itemType: 'text' as const })),
      ...canvasShapes.map(shp => ({ ...shp, itemType: 'shape' as const })),
    ];
    allItems.sort((a, b) => a.zIndex - b.zIndex);

    const currentIndex = allItems.findIndex(item => item.id === itemId && item.itemType === itemType);
    if (currentIndex === -1 || allItems[currentIndex].isLocked) return;

    let targetIndex = -1;
    if (direction === 'forward') {
      if (currentIndex < allItems.length - 1) {
        for (let i = currentIndex + 1; i < allItems.length; i++) {
            if (!allItems[i].isLocked) { targetIndex = i; break; }
        }
        if (targetIndex === -1 && currentIndex + 1 < allItems.length && !allItems[currentIndex + 1].isLocked) { 
             targetIndex = currentIndex + 1;
        } else if (targetIndex === -1) return; 
      } else return;
    } else { 
      if (currentIndex > 0) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!allItems[i].isLocked) { targetIndex = i; break; }
        }
         if (targetIndex === -1 && currentIndex -1  >= 0 && !allItems[currentIndex -1].isLocked) { 
             targetIndex = currentIndex -1;
        } else if (targetIndex === -1) return;
      } else return;
    }
    
    const itemToMove = allItems.splice(currentIndex, 1)[0];
    allItems.splice(targetIndex, 0, itemToMove);
    
    const newImages: CanvasImage[] = [];
    const newTexts: CanvasText[] = [];
    const newShapes: CanvasShape[] = [];

    allItems.forEach((item, newZIndex) => {
      const updatedItem = { ...item, zIndex: newZIndex };
      if (updatedItem.itemType === 'image') newImages.push(updatedItem as CanvasImage);
      else if (updatedItem.itemType === 'text') newTexts.push(updatedItem as CanvasText);
      else if (updatedItem.itemType === 'shape') newShapes.push(updatedItem as CanvasShape);
    });
    setCanvasImages(newImages);
    setCanvasTexts(newTexts);
    setCanvasShapes(newShapes);

  }, [canvasImages, canvasTexts, canvasShapes]);

  const bringLayerForward = useCallback((id: string) => reorderLayers(id, 'image', 'forward'), [reorderLayers]);
  const sendLayerBackward = useCallback((id: string) => reorderLayers(id, 'image', 'backward'), [reorderLayers]);
  const bringTextLayerForward = useCallback((id: string) => reorderLayers(id, 'text', 'forward'), [reorderLayers]);
  const sendTextLayerBackward = useCallback((id: string) => reorderLayers(id, 'text', 'backward'), [reorderLayers]);
  const bringShapeLayerForward = useCallback((id: string) => reorderLayers(id, 'shape', 'forward'), [reorderLayers]);
  const sendShapeLayerBackward = useCallback((id: string) => reorderLayers(id, 'shape', 'backward'), [reorderLayers]);

  return (
    <UploadContext.Provider
      value={{
        uploadedImages, addUploadedImage,
        canvasImages, addCanvasImage, addCanvasImageFromUrl, removeCanvasImage, selectedCanvasImageId, selectCanvasImage, updateCanvasImage,
        bringLayerForward, sendLayerBackward, duplicateCanvasImage, toggleLockCanvasImage,
        canvasTexts, addCanvasText, removeCanvasText, selectedCanvasTextId, selectCanvasText, updateCanvasText,
        bringTextLayerForward, sendTextLayerBackward, duplicateCanvasText, toggleLockCanvasText,
        canvasShapes, addCanvasShape, removeCanvasShape, selectedCanvasShapeId, selectCanvasShape, updateCanvasShape,
        bringShapeLayerForward, sendShapeLayerBackward, duplicateCanvasShape, toggleLockCanvasShape,
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
