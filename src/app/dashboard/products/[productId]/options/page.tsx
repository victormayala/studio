
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PlusCircle, Trash2, Image as ImageIcon, Maximize2, Loader2, AlertTriangle, LayersIcon, Shirt, RefreshCcw, CheckSquare, Square as SquareIcon } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWooCommerceProductById, fetchWooCommerceProductVariations } from '@/app/actions/woocommerceActions';
import type { WCCustomProduct, WCVariation } from '@/types/woocommerce';
import { Alert as ShadCnAlert, AlertDescription as ShadCnAlertDescription, AlertTitle as ShadCnAlertTitle } from "@/components/ui/alert";


interface BoundaryBox {
  id: string;
  name: string;
  x: number; 
  y: number; 
  width: number;
  height: number;
}

interface ProductOptionsData {
  id: string;         
  name: string;       
  description: string;
  price: number;      
  type: 'simple' | 'variable' | 'grouped' | 'external'; 
  imageUrl: string;   
  aiHint?: string;     
  boundaryBoxes: BoundaryBox[];
  cstmzrSelectedVariationIds: string[]; 
}

interface LocalStorageOptions {
  boundaryBoxes: BoundaryBox[];
  cstmzrSelectedVariationIds: string[]; 
}


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
}

const MIN_BOX_SIZE_PERCENT = 5; 

export default function ProductOptionsPage() {
  const params = useParams();
  const productId = params.productId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [productOptions, setProductOptions] = useState<ProductOptionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [variations, setVariations] = useState<WCVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [variationsError, setVariationsError] = useState<string | null>(null);

  const [selectedVariationIdsForCstmzr, setSelectedVariationIdsForCstmzr] = useState<string[]>([]);

  const [selectedBoundaryBoxId, setSelectedBoundaryBoxId] = useState<string | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);

  const stripHtml = (html: string): string => {
    if (typeof window === 'undefined') return html; 
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const fetchAndSetProductData = useCallback(async () => {
    if (!productId || !user) {
      setIsLoading(false);
      setIsRefreshing(false);
      if (!user) setError("User not authenticated. Please sign in.");
      else setError("Product ID is missing.");
      return;
    }

    setIsLoading(true); 
    setError(null);
    setVariationsError(null);
    setVariations([]);
    setSelectedVariationIdsForCstmzr([]); 

    let localOptions: LocalStorageOptions | null = null;
    const localStorageKey = `cstmzr_product_options_${user.id}_${productId}`;
    try {
      const savedOptions = localStorage.getItem(localStorageKey);
      if (savedOptions) {
        localOptions = JSON.parse(savedOptions) as LocalStorageOptions;
      }
    } catch (e) {
      console.error("Error parsing local CSTMZR options from localStorage:", e);
      toast({ title: "Error Loading Local Settings", description: "Could not load saved CSTMZR settings. Using defaults.", variant: "destructive"});
    }

    let wcProduct: WCCustomProduct | undefined;
    let fetchError: string | undefined;
    let userCredentials;

    try {
      const userStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const userConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const userConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);
      if (userStoreUrl && userConsumerKey && userConsumerSecret) {
        userCredentials = { storeUrl: userStoreUrl, consumerKey: userConsumerKey, consumerSecret: userConsumerSecret };
      }
    } catch (storageError) {
      console.error("Error accessing localStorage for WC credentials:", storageError);
      toast({
        title: "Local Storage Error",
        description: "Could not access WooCommerce credentials. Using global settings if available.",
        variant: "destructive"
      });
    }
    
    ({ product: wcProduct, error: fetchError } = await fetchWooCommerceProductById(productId, userCredentials));
    
    if (fetchError || !wcProduct) {
      setError(fetchError || `Product with ID ${productId} not found or failed to load.`);
      setIsLoading(false);
      setIsRefreshing(false);
      toast({ title: "Error Fetching Product", description: fetchError || `Product ${productId} not found.`, variant: "destructive"});
      return;
    }

    const defaultImageUrl = 'https://placehold.co/600x600.png';
    const defaultAiHint = 'product image';
    
    const rawDescription = wcProduct.description || wcProduct.short_description || 'No description available.';
    const plainTextDescription = stripHtml(rawDescription);

    setProductOptions({
      id: wcProduct.id.toString(),
      name: wcProduct.name || `Product ${productId}`,
      description: plainTextDescription,
      price: parseFloat(wcProduct.price) || 0,
      type: wcProduct.type,
      imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : defaultImageUrl,
      aiHint: wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : defaultAiHint,
      boundaryBoxes: localOptions?.boundaryBoxes || [],
      cstmzrSelectedVariationIds: localOptions?.cstmzrSelectedVariationIds || [], 
    });
    setSelectedBoundaryBoxId(null); 
    setSelectedVariationIdsForCstmzr(localOptions?.cstmzrSelectedVariationIds || []); 

    if (wcProduct.type === 'variable') {
      setIsLoadingVariations(true);
      const { variations: fetchedVariations, error: variationsFetchError } = await fetchWooCommerceProductVariations(productId, userCredentials);
      if (variationsFetchError) {
        setVariationsError(variationsFetchError);
        toast({ title: "Error Loading Variations", description: variationsFetchError, variant: "destructive"});
      } else if (fetchedVariations) {
        setVariations(fetchedVariations);
        if (isRefreshing) toast({ title: "Variations Refreshed", description: "Product variations updated from store."});
      }
      setIsLoadingVariations(false);
    }
    setIsLoading(false);
    setIsRefreshing(false);
    if (isRefreshing) toast({ title: "Product Data Refreshed", description: "Base product details updated from store."});

  }, [productId, user, toast, isRefreshing]); 

  useEffect(() => {
    fetchAndSetProductData();
  }, [fetchAndSetProductData]); 

  const handleRefreshData = () => {
    setIsRefreshing(true); 
    fetchAndSetProductData();
  };


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

    const currentBox = productOptions?.boundaryBoxes.find(b => b.id === boxId);
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
    setActiveDrag(dragState);
  }, [productOptions?.boundaryBoxes]); 

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !productOptions || !imageWrapperRef.current) return;
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
    } else { 
        const originalProposedWidth = newWidth;
        const originalProposedHeight = newHeight;

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

        let clampedWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth);
        let clampedHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight);
        newWidth = clampedWidth;
        newHeight = clampedHeight;

        if (activeDrag.type === 'resize_tl') {
          if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth;
          if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight;
        } else if (activeDrag.type === 'resize_tr') {
          if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight;
        } else if (activeDrag.type === 'resize_bl') {
          if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth;
        }
    }
    
    newX = Math.max(0, Math.min(newX, 100 - MIN_BOX_SIZE_PERCENT));
    newWidth = Math.min(newWidth, 100 - newX);
    newWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth); 
    newX = Math.max(0, Math.min(newX, 100 - newWidth)); 

    newY = Math.max(0, Math.min(newY, 100 - MIN_BOX_SIZE_PERCENT));
    newHeight = Math.min(newHeight, 100 - newY);
    newHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight); 
    newY = Math.max(0, Math.min(newY, 100 - newHeight)); 
    
    if (isNaN(newX) || isNaN(newY) || isNaN(newWidth) || isNaN(newHeight)) {
        console.warn("NaN detected in boundary box calculation, skipping update");
        return; 
    }

    setProductOptions(prev => prev ? {
      ...prev,
      boundaryBoxes: prev.boundaryBoxes.map(b => 
        b.id === activeDrag.boxId ? { ...b, x: newX, y: newY, width: newWidth, height: newHeight } : b
      )
    } : null);

  }, [activeDrag, productOptions]);

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


  if (isLoading && !isRefreshing) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3">Loading product details...</p>
      </div>
    );
  }

  if (error && !productOptions) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Product</h2>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!productOptions) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-muted-foreground mb-2">Product Not Found</h2>
        <p className="text-muted-foreground text-center mb-6">The requested product could not be loaded.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }
  
  const handleSaveChanges = () => {
    if (!productOptions || !user) {
        toast({ title: "Error", description: "Product data or user session is missing.", variant: "destructive"});
        return;
    }
    const localStorageKey = `cstmzr_product_options_${user.id}_${productOptions.id}`;
    const dataToSave: LocalStorageOptions = {
      boundaryBoxes: productOptions.boundaryBoxes,
      cstmzrSelectedVariationIds: selectedVariationIdsForCstmzr, 
    };

    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
      toast({
        title: "CSTMZR Options Saved",
        description: "Custom areas and variation selections have been saved locally.",
      });
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      toast({ title: "Save Error", description: "Could not save CSTMZR options to local storage.", variant: "destructive"});
    }
  };

  const handleAddBoundaryBox = () => {
    if (!productOptions || productOptions.boundaryBoxes.length >= 3) {
        if (productOptions && productOptions.boundaryBoxes.length >= 3) {
             toast({ title: "Limit Reached", description: "Maximum of 3 customization areas allowed.", variant: "destructive" });
        }
        return;
    }
    const newBox: BoundaryBox = {
      id: crypto.randomUUID(),
      name: `Area ${productOptions.boundaryBoxes.length + 1}`,
      x: 10 + productOptions.boundaryBoxes.length * 5, 
      y: 10 + productOptions.boundaryBoxes.length * 5,
      width: 30,
      height: 20,
    };
    setProductOptions({ ...productOptions, boundaryBoxes: [...productOptions.boundaryBoxes, newBox] });
    setSelectedBoundaryBoxId(newBox.id);
  };

  const handleRemoveBoundaryBox = (boxId: string) => {
    setProductOptions(prev => prev ? { ...prev, boundaryBoxes: prev.boundaryBoxes.filter(b => b.id !== boxId) } : null);
    if (selectedBoundaryBoxId === boxId) {
      setSelectedBoundaryBoxId(null);
    }
  };
  
  const handleWCProductDetailChange = (field: 'name' | 'description' | 'price', value: string | number) => {
    if (productOptions) {
      setProductOptions({ ...productOptions, [field]: value });
    }
  };

  const handleBoundaryBoxNameChange = (boxId: string, newName: string) => {
    if (!productOptions) return;
    const updatedBoxes = productOptions.boundaryBoxes.map(box =>
      box.id === boxId ? { ...box, name: newName } : box
    );
    setProductOptions({ ...productOptions, boundaryBoxes: updatedBoxes });
  };

  const handleBoundaryBoxPropertyChange = (
    boxId: string,
    property: keyof Pick<BoundaryBox, 'x' | 'y' | 'width' | 'height'>,
    value: string
  ) => {
    if (!productOptions) return;

    setProductOptions(prevProductOptions => {
      if (!prevProductOptions) return null;

      const newBoxes = prevProductOptions.boundaryBoxes.map(box => {
        if (box.id === boxId) {
          let newBox = { ...box };
          const parsedValue = parseFloat(value);

          if (isNaN(parsedValue)) return box; 

          if (property === 'x') newBox.x = parsedValue;
          else if (property === 'y') newBox.y = parsedValue;
          else if (property === 'width') newBox.width = parsedValue;
          else if (property === 'height') newBox.height = parsedValue;

          let tempX = newBox.x, tempY = newBox.y, tempW = newBox.width, tempH = newBox.height;

          tempW = Math.max(MIN_BOX_SIZE_PERCENT, tempW);
          tempH = Math.max(MIN_BOX_SIZE_PERCENT, tempH);
          
          tempX = Math.max(0, Math.min(tempX, 100 - tempW));
          tempY = Math.max(0, Math.min(tempY, 100 - tempH));
          
          tempW = Math.min(tempW, 100 - tempX);
          tempH = Math.min(tempH, 100 - tempY);
          tempW = Math.max(MIN_BOX_SIZE_PERCENT, tempW); 
          tempH = Math.max(MIN_BOX_SIZE_PERCENT, tempH); 

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
      return { ...prevProductOptions, boundaryBoxes: newBoxes };
    });
  };

  const handleSelectAllVariations = (checked: boolean) => {
    if (checked) {
      setSelectedVariationIdsForCstmzr(variations.map(v => v.id.toString()));
    } else {
      setSelectedVariationIdsForCstmzr([]);
    }
  };

  const handleVariationSelectionChange = (variationId: string, checked: boolean) => {
    setSelectedVariationIdsForCstmzr(prevSelectedIds => {
      if (checked) {
        return [...prevSelectedIds, variationId];
      } else {
        return prevSelectedIds.filter(id => id !== variationId);
      }
    });
  };

  const allVariationsSelected = variations.length > 0 && selectedVariationIdsForCstmzr.length === variations.length;
  const someVariationsSelected = selectedVariationIdsForCstmzr.length > 0 && selectedVariationIdsForCstmzr.length < variations.length;


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button variant="outline" onClick={handleRefreshData} disabled={isRefreshing || isLoading} className="hover:bg-accent hover:text-accent-foreground">
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          Refresh Product Data
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline text-foreground">
        Product Options
      </h1>
      <p className="text-muted-foreground mb-8">
        Editing options for: <span className="font-semibold text-foreground">{productOptions.name}</span> (ID: {productOptions.id})
      </p>
       {error && productOptions && (
        <ShadCnAlert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <ShadCnAlertTitle>Product Data Error</ShadCnAlertTitle>
          <ShadCnAlertDescription>{error}</ShadCnAlertDescription>
        </ShadCnAlert>
      )}


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
                {productOptions.imageUrl ? (
                  <NextImage
                    src={productOptions.imageUrl}
                    alt={productOptions.name}
                    fill
                    className="object-contain pointer-events-none" 
                    data-ai-hint={productOptions.aiHint || "product image"}
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No image available</p>
                  </div>
                )}

                {productOptions.boundaryBoxes.map((box) => (
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
                        <div
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nwse-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Top-Left)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tl')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tl')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Top-Right)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tr')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tr')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div
                          className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100"
                          title="Resize Area (Bottom-Left)"
                          onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_bl')}
                          onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_bl')}
                        >
                          <Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
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
            </CardHeader>
            <CardContent>
              {productOptions.boundaryBoxes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {productOptions.boundaryBoxes.map((box) => (
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
              {productOptions.boundaryBoxes.length < 3 ? (
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
              <CardTitle className="font-headline text-lg">Base Product Information</CardTitle>
              <CardDescription>Displayed from your WooCommerce store. (Read-only here)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input 
                    id="productName" 
                    value={productOptions.name} 
                    onChange={(e) => handleWCProductDetailChange('name', e.target.value)}
                    className="mt-1 bg-muted/50" 
                    readOnly 
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea 
                    id="productDescription" 
                    value={productOptions.description} 
                    onChange={(e) => handleWCProductDetailChange('description', e.target.value)}
                    className="mt-1 bg-muted/50" 
                    rows={4} 
                    readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productPrice">Product Price ($)</Label>
                  <Input 
                      id="productPrice" 
                      type="number" 
                      value={productOptions.price} 
                      onChange={(e) => handleWCProductDetailChange('price', parseFloat(e.target.value) || 0)}
                      className="mt-1 bg-muted/50" 
                      step="0.01" 
                      readOnly
                  />
                </div>
                <div>
                    <Label htmlFor="productType">Product Type</Label>
                    <Input 
                        id="productType" 
                        value={productOptions.type.charAt(0).toUpperCase() + productOptions.type.slice(1)} 
                        className="mt-1 bg-muted/50" 
                        readOnly 
                    />
                </div>
              </div>
            </CardContent>
          </Card>

          {productOptions.type === 'variable' && (
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-headline text-lg">Product Variations</CardTitle>
                    <CardDescription>
                      {variations.length > 0 ? `Select variations for customization. (Total: ${variations.length})` : 'Available variations from your WooCommerce store.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                 {isLoadingVariations || (isRefreshing && isLoading) ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Loading variations...</p>
                  </div>
                ) : variationsError ? (
                  <div className="text-center py-6">
                    <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
                    <p className="mt-3 text-destructive font-semibold">Error loading variations</p>
                    <p className="text-sm text-muted-foreground mt-1">{variationsError}</p>
                  </div>
                ) : variations.length > 0 ? (
                  <>
                    <div className="mb-4 flex items-center space-x-2 p-2 border-b">
                      <Checkbox
                        id="selectAllVariations"
                        checked={allVariationsSelected}
                        onCheckedChange={(checkedState) => {
                          if (checkedState === 'indeterminate') {
                             handleSelectAllVariations(true); // If indeterminate, next click selects all
                          } else {
                            handleSelectAllVariations(checkedState as boolean);
                          }
                        }}
                        data-state={someVariationsSelected && !allVariationsSelected ? 'indeterminate' : (allVariationsSelected ? 'checked' : 'unchecked')}
                      />
                      <Label htmlFor="selectAllVariations" className="text-sm font-medium">
                        {allVariationsSelected ? "Deselect All" : "Select All Variations for Customizer"}
                      </Label>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {variations.map((variation) => (
                        <div 
                          key={variation.id} 
                          className={cn(
                            "p-3 border rounded-md flex items-start gap-3 transition-colors",
                            selectedVariationIdsForCstmzr.includes(variation.id.toString()) ? "bg-primary/10 border-primary" : "bg-muted/30 hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            id={`variation-${variation.id}`}
                            checked={selectedVariationIdsForCstmzr.includes(variation.id.toString())}
                            onCheckedChange={(checked) => handleVariationSelectionChange(variation.id.toString(), checked as boolean)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-card flex-shrink-0">
                            <NextImage 
                              src={variation.image?.src || productOptions.imageUrl || 'https://placehold.co/100x100.png'} 
                              alt={variation.image?.alt || productOptions.name} 
                              fill 
                              className="object-contain"
                              data-ai-hint={variation.image?.alt ? variation.image.alt.split(" ").slice(0,2).join(" ") : "variation image"}
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium text-foreground">
                              {variation.attributes.map(attr => `${attr.name}: ${attr.option}`).join(' / ')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {variation.sku || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Price: ${parseFloat(variation.price).toFixed(2)}
                            </p>
                          </div>
                          <Badge 
                            variant={variation.stock_status === 'instock' ? 'default' : (variation.stock_status === 'onbackorder' ? 'secondary' : 'destructive')}
                            className={cn(
                              "self-start",
                              variation.stock_status === 'instock' && 'bg-green-500/10 text-green-700 border-green-500/30',
                              variation.stock_status === 'onbackorder' && 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
                              variation.stock_status === 'outofstock' && 'bg-red-500/10 text-red-700 border-red-500/30'
                            )}
                          >
                            {variation.stock_status === 'instock' ? 'In Stock' : variation.stock_status === 'onbackorder' ? 'On Backorder' : 'Out of Stock'}
                            {variation.stock_quantity !== null && ` (${variation.stock_quantity})`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <LayersIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No variations found for this product.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {productOptions.type !== 'variable' && (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Product Variations</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-muted-foreground">
                    <Shirt className="mx-auto h-10 w-10 mb-2" />
                    This is a simple product and does not have variations.
                </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSaveChanges} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save CSTMZR Options
        </Button>
      </div>
    </div>
  );
}
    

    