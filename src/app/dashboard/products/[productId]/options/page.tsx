
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// import { Switch } from '@/components/ui/switch'; // Removed Switch import
import { ArrowLeft, PlusCircle, Trash2, Image as ImageIcon, Maximize2 } from 'lucide-react'; // Removed Lock import
import { cn } from '@/lib/utils';

interface BoundaryBox {
  id: string;
  name: string;
  x: number; // percentage from left (top-left corner)
  y: number; // percentage from top (top-left corner)
  width: number; // percentage width
  height: number; // percentage height
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: string[];
  sizes: string[];
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
}

const mockProductDetails: ProductDetails = {
  id: 'prod_1',
  name: 'Classic T-Shirt',
  description: 'A high-quality cotton t-shirt, perfect for customization.',
  price: 19.99,
  colors: ['#FFFFFF', '#000000', '#FF0000'],
  sizes: ['S', 'M', 'L', 'XL'],
  imageUrl: 'https://placehold.co/600x600.png',
  aiHint: 't-shirt mockup',
  boundaryBoxes: [],
};

interface ActiveDragState {
  type: 'move' | 'resize_br' | 'resize_bl' | 'resize_tr' | 'resize_tl';
  boxId: string;
  pointerStartX: number;
  pointerStartY: number;
  initialBoxX: number;
  initialBoxY: number;
  initialBoxWidth: number;
  initialBoxHeight: number;
  containerWidthPx: number;
  containerHeightPx: number;
  // initialAspectRatio?: number; // Removed for aspect ratio lock
}

const MIN_BOX_SIZE_PERCENT = 5; 

export default function ProductOptionsPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  
  const [newColorHex, setNewColorHex] = useState<string>('#CCCCCC');
  const [newColorSwatch, setNewColorSwatch] = useState<string>('#CCCCCC');
  const [newSize, setNewSize] = useState<string>('');
  const [selectedBoundaryBoxId, setSelectedBoundaryBoxId] = useState<string | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  // const [isAspectRatioLocked, setIsAspectRatioLocked] = useState<boolean>(false); // Removed aspect ratio lock state


  useEffect(() => {
    if (productId) {
      const foundProduct = mockProductDetails.id === productId ? mockProductDetails : { 
            ...mockProductDetails, 
            id: productId, 
            name: `Product ${productId}`, 
            imageUrl: `https://placehold.co/600x600.png`,
            aiHint: 'product image', 
            boundaryBoxes: [], 
          };
      setProduct(foundProduct);
      setSelectedBoundaryBoxId(null);
    }
  }, [productId]);

  const getPointerCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleInteractionStart = useCallback((
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    boxId: string,
    type: ActiveDragState['type']
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentBox = product?.boundaryBoxes.find(b => b.id === boxId);
    if (!currentBox || !imageWrapperRef.current) return;

    setSelectedBoundaryBoxId(boxId);
    const pointerCoords = getPointerCoords(e);
    const containerRect = imageWrapperRef.current.getBoundingClientRect();

    let dragState: ActiveDragState = {
      type,
      boxId,
      pointerStartX: pointerCoords.x,
      pointerStartY: pointerCoords.y,
      initialBoxX: currentBox.x,
      initialBoxY: currentBox.y,
      initialBoxWidth: currentBox.width,
      initialBoxHeight: currentBox.height,
      containerWidthPx: containerRect.width,
      containerHeightPx: containerRect.height,
    };

    // Removed aspect ratio lock logic
    // if (type.startsWith('resize_') && isAspectRatioLocked && currentBox.width > 0 && currentBox.height > 0) {
    //   dragState.initialAspectRatio = currentBox.width / currentBox.height;
    // }

    setActiveDrag(dragState);
  }, [product?.boundaryBoxes]); // Removed isAspectRatioLocked from dependencies

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !product || !imageWrapperRef.current) return;
    e.preventDefault();

    const pointerCoords = getPointerCoords(e);
    const deltaXpx = pointerCoords.x - activeDrag.pointerStartX;
    const deltaYpx = pointerCoords.y - activeDrag.pointerStartY;

    let deltaXPercent = (deltaXpx / activeDrag.containerWidthPx) * 100;
    let deltaYPercent = (deltaYpx / activeDrag.containerHeightPx) * 100;

    let newX = activeDrag.initialBoxX;
    let newY = activeDrag.initialBoxY;
    let newWidth = activeDrag.initialBoxWidth;
    let newHeight = activeDrag.initialBoxHeight;

    if (activeDrag.type === 'move') {
      newX = activeDrag.initialBoxX + deltaXPercent;
      newY = activeDrag.initialBoxY + deltaYPercent;
    } else { // Resize operations
        // Removed aspect ratio locked resizing logic
        // Original Unlocked Resizing Logic remains
        if (activeDrag.type === 'resize_br') {
          newWidth = activeDrag.initialBoxWidth + deltaXPercent;
          newHeight = activeDrag.initialBoxHeight + deltaYPercent;
        } else if (activeDrag.type === 'resize_bl') {
          newX = activeDrag.initialBoxX + deltaXPercent;
          newWidth = activeDrag.initialBoxWidth - deltaXPercent;
          newHeight = activeDrag.initialBoxHeight + deltaYPercent;
        } else if (activeDrag.type === 'resize_tr') {
          newY = activeDrag.initialBoxY + deltaYPercent;
          newWidth = activeDrag.initialBoxWidth + deltaXPercent;
          newHeight = activeDrag.initialBoxHeight - deltaYPercent;
        } else if (activeDrag.type === 'resize_tl') {
          newX = activeDrag.initialBoxX + deltaXPercent;
          newY = activeDrag.initialBoxY + deltaYPercent;
          newWidth = activeDrag.initialBoxWidth - deltaXPercent;
          newHeight = activeDrag.initialBoxHeight - deltaYPercent;
        }
    }

    // Apply MIN_BOX_SIZE_PERCENT constraint
    const originalProposedWidth = newWidth;
    const originalProposedHeight = newHeight;

    let clampedWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth);
    let clampedHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight);

    // Removed aspect ratio re-application logic after min size clamp
    // if (activeDrag.initialAspectRatio && activeDrag.type.startsWith('resize_')) { ... }

    newWidth = clampedWidth;
    newHeight = clampedHeight;

    // Adjust X or Y if width/height was clamped by MIN_BOX_SIZE_PERCENT
    if (activeDrag.type === 'resize_tl') {
      if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth;
      if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight;
    } else if (activeDrag.type === 'resize_tr') {
      if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight;
      // X doesn't change if width was primary from BR/TR logic, only Y 
    } else if (activeDrag.type === 'resize_bl') {
      if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth;
      // Y doesn't change
    }
    
    // Clamp X and then Width
    newX = Math.max(0, Math.min(newX, 100 - MIN_BOX_SIZE_PERCENT));
    newWidth = Math.min(newWidth, 100 - newX);
    newWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth); // Ensure min width after boundary clamp
    newX = Math.max(0, Math.min(newX, 100 - newWidth)); // Re-clamp X based on final width

    // Clamp Y and then Height
    newY = Math.max(0, Math.min(newY, 100 - MIN_BOX_SIZE_PERCENT));
    newHeight = Math.min(newHeight, 100 - newY);
    newHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight); // Ensure min height after boundary clamp
    newY = Math.max(0, Math.min(newY, 100 - newHeight)); // Re-clamp Y based on final height
    
    // Removed final aspect ratio pass
    // if (activeDrag.initialAspectRatio && activeDrag.type.startsWith('resize_')) { ... }

    if (isNaN(newX) || isNaN(newY) || isNaN(newWidth) || isNaN(newHeight)) {
        console.warn("NaN detected in boundary box calculation, skipping update");
        return; 
    }

    setProduct(prev => prev ? {
      ...prev,
      boundaryBoxes: prev.boundaryBoxes.map(b => 
        b.id === activeDrag.boxId ? { ...b, x: newX, y: newY, width: newWidth, height: newHeight } : b
      )
    } : null);

  }, [activeDrag, product]);

  const handleInteractionEnd = useCallback(() => {
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleDragging);
      window.addEventListener('touchmove', handleDragging, { passive: false });
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchend', handleInteractionEnd);
    } else {
      window.removeEventListener('mousemove', handleDragging);
      window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragging);
      window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [activeDrag, handleDragging, handleInteractionEnd]);


  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading product details...</p>
      </div>
    );
  }

  const handleAddColor = () => {
    if (!product) return;
    const updatedProduct = { ...product, colors: [...product.colors, newColorHex] };
    setProduct(updatedProduct);
    setNewColorHex('#CCCCCC'); 
    setNewColorSwatch('#CCCCCC');
  };

  const handleRemoveColor = (colorToRemove: string) => {
    if (!product) return;
    const updatedProduct = { ...product, colors: product.colors.filter(c => c !== colorToRemove) };
    setProduct(updatedProduct);
  };

  const handleAddSize = () => {
    if (!product || !newSize.trim()) return;
    const updatedProduct = { ...product, sizes: [...product.sizes, newSize.trim()] };
    setProduct(updatedProduct);
    setNewSize('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
     if (!product) return;
    const updatedProduct = { ...product, sizes: product.sizes.filter(s => s !== sizeToRemove) };
    setProduct(updatedProduct);
  };
  
  const handleSaveChanges = () => {
    alert("Saving changes... (functionality not implemented)");
  };

  const handleAddBoundaryBox = () => {
    if (!product || product.boundaryBoxes.length >= 3) return;
    const newBox: BoundaryBox = {
      id: crypto.randomUUID(),
      name: `Area ${product.boundaryBoxes.length + 1}`,
      x: 10 + product.boundaryBoxes.length * 5, 
      y: 10 + product.boundaryBoxes.length * 5,
      width: 30,
      height: 20,
    };
    const updatedProduct = { ...product, boundaryBoxes: [...product.boundaryBoxes, newBox] };
    setProduct(updatedProduct);
    setSelectedBoundaryBoxId(newBox.id);
  };

  const handleRemoveBoundaryBox = (boxId: string) => {
    setProduct(prev => prev ? { ...prev, boundaryBoxes: prev.boundaryBoxes.filter(b => b.id !== boxId) } : null);
    if (selectedBoundaryBoxId === boxId) {
      setSelectedBoundaryBoxId(null);
    }
  };
  
  const handleProductDetailChange = (field: keyof ProductDetails, value: any) => {
    if (product) {
      setProduct({ ...product, [field]: value });
    }
  };

  const handleBoundaryBoxNameChange = (boxId: string, newName: string) => {
    if (!product) return;
    const updatedBoxes = product.boundaryBoxes.map(box =>
      box.id === boxId ? { ...box, name: newName } : box
    );
    setProduct({ ...product, boundaryBoxes: updatedBoxes });
  };

  const handleBoundaryBoxPropertyChange = (
    boxId: string,
    property: keyof Pick<BoundaryBox, 'x' | 'y' | 'width' | 'height'>,
    value: string
  ) => {
    if (!product) return;

    setProduct(prevProduct => {
      if (!prevProduct) return null;

      const newBoxes = prevProduct.boundaryBoxes.map(box => {
        if (box.id === boxId) {
          let newBox = { ...box };
          const parsedValue = parseFloat(value);

          if (isNaN(parsedValue)) return box; 

          if (property === 'x') newBox.x = parsedValue;
          else if (property === 'y') newBox.y = parsedValue;
          else if (property === 'width') newBox.width = parsedValue;
          else if (property === 'height') newBox.height = parsedValue;

          // Basic validation for individual property change
          if (property === 'width' || property === 'height') {
              newBox[property] = Math.max(MIN_BOX_SIZE_PERCENT, newBox[property]);
          }
          
          // Apply boundary constraints and min size collectively
          let tempX = newBox.x, tempY = newBox.y, tempW = newBox.width, tempH = newBox.height;

          tempW = Math.max(MIN_BOX_SIZE_PERCENT, tempW);
          tempH = Math.max(MIN_BOX_SIZE_PERCENT, tempH);
          
          tempX = Math.max(0, Math.min(tempX, 100 - tempW));
          tempY = Math.max(0, Math.min(tempY, 100 - tempH));
          
          // Re-check width/height based on clamped position
          tempW = Math.min(tempW, 100 - tempX);
          tempH = Math.min(tempH, 100 - tempY);
          tempW = Math.max(MIN_BOX_SIZE_PERCENT, tempW); // Final min check
          tempH = Math.max(MIN_BOX_SIZE_PERCENT, tempH); // Final min check

          newBox.x = tempX;
          newBox.y = tempY;
          newBox.width = tempW;
          newBox.height = tempH;
          
          if (isNaN(newBox.x)) newBox.x = 0;
          if (isNaN(newBox.y)) newBox.y = 0;
          if (isNaN(newBox.width)) newBox.width = MIN_BOX_SIZE_PERCENT;
          if (isNaN(newBox.height)) newBox.height = MIN_BOX_SIZE_PERCENT;

          return newBox;
        }
        return box;
      });
      return { ...prevProduct, boundaryBoxes: newBoxes };
    });
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="mb-6">
        <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline text-foreground">
        Product Options
      </h1>
      <p className="text-muted-foreground mb-8">
        Editing options for: <span className="font-semibold text-foreground">{product.name}</span> (ID: {product.id})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
           <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Image & Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={imageWrapperRef} 
                className="relative w-full aspect-square border rounded-md overflow-hidden group bg-muted/20 select-none"
                onMouseDown={(e) => { 
                  if (e.target === imageWrapperRef.current) {
                    setSelectedBoundaryBoxId(null);
                  }
                }}
              >
                {product.imageUrl ? (
                  <NextImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain pointer-events-none" 
                    data-ai-hint={product.aiHint || "product image"}
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No image available</p>
                  </div>
                )}

                {product.boundaryBoxes.map((box) => (
                  <div
                    key={box.id}
                    className={cn(
                      "absolute transition-colors duration-100 ease-in-out group/box", 
                      selectedBoundaryBoxId === box.id 
                        ? 'border-primary ring-2 ring-primary ring-offset-1 bg-primary/10' 
                        : 'border-dashed border-muted-foreground/50 hover:border-primary/70 hover:bg-primary/5',
                      activeDrag?.boxId === box.id && activeDrag.type === 'move' ? 'cursor-grabbing' : 'cursor-grab'
                    )}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      zIndex: selectedBoundaryBoxId === box.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleInteractionStart(e, box.id, 'move')}
                    onTouchStart={(e) => handleInteractionStart(e, box.id, 'move')}
                  >
                    {selectedBoundaryBoxId === box.id && (
                      <>
                        {/* Top-Left Resize Handle */}
                        <div
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nwse-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Top-Left)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tl')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tl')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        {/* Top-Right Resize Handle */}
                        <div
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Top-Right)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tr')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tr')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        {/* Bottom-Left Resize Handle */}
                        <div
                          className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Bottom-Left)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_bl')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_bl')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        {/* Bottom-Right Resize Handle */}
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nwse-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Bottom-Right)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_br')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_br')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                      </>
                    )}
                    <div className="absolute top-0.5 left-0.5 text-[8px] text-primary-foreground bg-primary/70 px-1 py-0.5 rounded-br-sm opacity-0 group-hover/box:opacity-100 group-[.is-selected]/box:opacity-100 transition-opacity select-none pointer-events-none">
                        {box.name}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click & drag to move areas. Use corner handles to resize.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="font-headline text-lg">Customization Areas</CardTitle>
                <CardDescription>Define printable/customizable regions. (Max 3)</CardDescription>
              </div>
              {/* Removed Aspect Ratio Lock Switch and Label */}
            </CardHeader>
            <CardContent>
              {product.boundaryBoxes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {product.boundaryBoxes.map((box) => (
                    <div 
                      key={box.id} 
                      className={cn(
                        "p-3 border rounded-md transition-all",
                        selectedBoundaryBoxId === box.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-muted/30 hover:bg-muted/50',
                        "cursor-pointer"
                      )}
                      onClick={() => setSelectedBoundaryBoxId(box.id)}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <Input
                          value={box.name}
                          onChange={(e) => handleBoundaryBoxNameChange(box.id, e.target.value)}
                          className="text-sm font-semibold text-foreground h-8 flex-grow mr-2 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring p-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); handleRemoveBoundaryBox(box.id);}} 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                            title="Remove Area"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {selectedBoundaryBoxId === box.id ? (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <h4 className="text-xs font-medium mb-1.5 text-muted-foreground">Edit Dimensions (%):</h4>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            <div>
                              <Label htmlFor={`box-x-${box.id}`} className="text-xs">X</Label>
                              <Input type="number" step="0.1" min="0" max="100" id={`box-x-${box.id}`} value={box.x.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'x', e.target.value)} className="h-8 text-xs w-full" onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div>
                              <Label htmlFor={`box-y-${box.id}`} className="text-xs">Y</Label>
                              <Input type="number" step="0.1" min="0" max="100" id={`box-y-${box.id}`} value={box.y.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'y', e.target.value)} className="h-8 text-xs w-full" onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div>
                              <Label htmlFor={`box-w-${box.id}`} className="text-xs">Width</Label>
                              <Input type="number" step="0.1" min={MIN_BOX_SIZE_PERCENT.toString()} max="100" id={`box-w-${box.id}`} value={box.width.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'width', e.target.value)} className="h-8 text-xs w-full" onClick={(e) => e.stopPropagation()} />
                            </div>
                            <div>
                              <Label htmlFor={`box-h-${box.id}`} className="text-xs">Height</Label>
                              <Input type="number" step="0.1" min={MIN_BOX_SIZE_PERCENT.toString()} max="100" id={`box-h-${box.id}`} value={box.height.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'height', e.target.value)} className="h-8 text-xs w-full" onClick={(e) => e.stopPropagation()} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p><strong>X:</strong> {box.x.toFixed(1)}% | <strong>Y:</strong> {box.y.toFixed(1)}%</p>
                          <p><strong>W:</strong> {box.width.toFixed(1)}% | <strong>H:</strong> {box.height.toFixed(1)}%</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {product.boundaryBoxes.length < 3 ? (
                <Button onClick={handleAddBoundaryBox} variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Customization Area
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Maximum of 3 customization areas reached.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input 
                    id="productName" 
                    value={product.name} 
                    onChange={(e) => handleProductDetailChange('name', e.target.value)}
                    className="mt-1" 
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea 
                    id="productDescription" 
                    value={product.description} 
                    onChange={(e) => handleProductDetailChange('description', e.target.value)}
                    className="mt-1" 
                    rows={4} 
                />
              </div>
              <div>
                <Label htmlFor="productPrice">Product Price ($)</Label>
                <Input 
                    id="productPrice" 
                    type="number" 
                    value={product.price} 
                    onChange={(e) => handleProductDetailChange('price', parseFloat(e.target.value) || 0)}
                    className="mt-1" 
                    step="0.01" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Colors</CardTitle>
              <CardDescription>Manage available color options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Current Colors:</Label>
                {product.colors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <Badge key={index} variant="secondary" className="relative group pr-7">
                        <span className="inline-block w-3 h-3 rounded-full mr-1.5 border" style={{ backgroundColor: color }}></span>
                        {color.toUpperCase()}
                        <button 
                            onClick={() => handleRemoveColor(color)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Remove color"
                        >
                           <Trash2 className="w-3 h-3"/>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No colors added yet.</p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label htmlFor="newColorHex">Add New Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="newColorSwatch"
                    value={newColorSwatch}
                    onChange={(e) => { setNewColorSwatch(e.target.value); setNewColorHex(e.target.value);}}
                    className="p-0.5 h-10 w-12 border-input rounded-md"
                  />
                  <Input
                    id="newColorHex"
                    placeholder="#RRGGBB"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                    onBlur={(e) => setNewColorSwatch(e.target.value)} 
                    maxLength={7}
                    className="flex-grow"
                  />
                  <Button onClick={handleAddColor} variant="outline" size="icon" className="shrink-0 hover:bg-accent hover:text-accent-foreground">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Add Color</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Sizes</CardTitle>
              <CardDescription>Manage available size options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Current Sizes:</Label>
                {product.sizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                       <Badge key={index} variant="secondary" className="relative group pr-7">
                        {size}
                         <button 
                            onClick={() => handleRemoveSize(size)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Remove size"
                        >
                           <Trash2 className="w-3 h-3"/>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sizes added yet.</p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label htmlFor="newSize">Add New Size</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="newSize"
                    placeholder="e.g., XL, 12oz"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                     className="flex-grow"
                  />
                  <Button onClick={handleAddSize} variant="outline" size="icon" className="shrink-0 hover:bg-accent hover:text-accent-foreground">
                    <PlusCircle className="h-5 w-5" />
                     <span className="sr-only">Add Size</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSaveChanges} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save Product Options
        </Button>
      </div>
    </div>
  );
}


      