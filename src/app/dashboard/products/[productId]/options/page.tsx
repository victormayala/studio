
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlusCircle, Trash2, Image as ImageIcon, Maximize2, Loader2, AlertTriangle, LayersIcon, Shirt, RefreshCcw, Edit3, ExternalLink } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWooCommerceProductById, fetchWooCommerceProductVariations } from '@/app/actions/woocommerceActions';
import type { WCCustomProduct, WCVariation, WCVariationAttribute } from '@/types/woocommerce';
import { Alert as ShadCnAlert, AlertDescription as ShadCnAlertDescription, AlertTitle as ShadCnAlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BoundaryBox {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductView {
  id: string;
  name: string;
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
}

interface ProductOptionsData {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  views: ProductView[];
  selectedVariationIdsForCstmzr: string[];
}

interface LocalStorageData {
  views: ProductView[];
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
const MAX_PRODUCT_VIEWS = 4;

export default function ProductOptionsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [productOptions, setProductOptions] = useState<ProductOptionsData | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variations, setVariations] = useState<WCVariation[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [variationsError, setVariationsError] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [selectedBoundaryBoxId, setSelectedBoundaryBoxId] = useState<string | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const dragUpdateRef = useRef(0);

  const [isDeleteViewDialogOpen, setIsDeleteViewDialogOpen] = useState(false);
  const [viewIdToDelete, setViewIdToDelete] = useState<string | null>(null);

  const fetchAndSetProductData = useCallback(async () => {
    if (!productId || !user?.id) {
      setIsLoading(false);
      setIsRefreshing(false);
      if (!user?.id) setError("User not authenticated. Please sign in.");
      else setError("Product ID is missing.");
      setHasUnsavedChanges(true);
      return;
    }

    setIsLoading(true); setError(null); setVariationsError(null); setVariations([]);

    let userCredentials;
    try {
      const userStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const userConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const userConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);
      if (userStoreUrl && userConsumerKey && userConsumerSecret) {
        userCredentials = { storeUrl: userStoreUrl, consumerKey: userConsumerKey, consumerSecret: userConsumerSecret };
      }
    } catch (e) { console.warn("Error accessing localStorage for WC credentials:", e); }

    const { product: wcProduct, error: fetchError } = await fetchWooCommerceProductById(productId, userCredentials);
    if (fetchError || !wcProduct) {
      setError(fetchError || `Product with ID ${productId} not found.`);
      setProductOptions(null); setIsLoading(false); setIsRefreshing(false);
      toast({ title: "Error Fetching Product", description: fetchError || `Product ${productId} not found.`, variant: "destructive"});
      setHasUnsavedChanges(true);
      return;
    }
    
    if (wcProduct.type === 'variable') {
      setIsLoadingVariations(true);
      const { variations: vars, error: varsError } = await fetchWooCommerceProductVariations(productId, userCredentials);
      if (varsError) setVariationsError(varsError);
      else if (vars) setVariations(vars);
      setIsLoadingVariations(false);
    }

    const defaultImageUrl = wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : 'https://placehold.co/600x600.png';
    const defaultAiHint = wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : 'product image';
    const defaultViews: ProductView[] = [{ id: crypto.randomUUID(), name: "Front", imageUrl: defaultImageUrl, aiHint: defaultAiHint, boundaryBoxes: [] }];
    
    let plainTextDescription = 'No description available.';
    if (typeof window !== 'undefined' && (wcProduct.description || wcProduct.short_description)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = wcProduct.description || wcProduct.short_description || '';
        plainTextDescription = tempDiv.textContent || tempDiv.innerText || '';
    } else if (wcProduct.description || wcProduct.short_description) {
        plainTextDescription = (wcProduct.description || wcProduct.short_description || '').replace(/<[^>]+>/g, '');
    }


    let loadedViews: ProductView[] = [];
    let cstmzrSelectedVariationIds: string[] = [];
    let localDataLoadedSuccessfully = false;
    const localStorageKey = `cstmzr_product_options_${user.id}_${productId}`;
    try {
      const savedOptions = localStorage.getItem(localStorageKey);
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions) as LocalStorageData;
        loadedViews = parsedOptions.views || [];
        cstmzrSelectedVariationIds = parsedOptions.cstmzrSelectedVariationIds || [];
        localDataLoadedSuccessfully = loadedViews.length > 0 || cstmzrSelectedVariationIds.length > 0;
      }
    } catch (e) { console.error("Error parsing local CSTMZR options:", e); }

    const finalViews = loadedViews.length > 0 ? loadedViews : defaultViews;
    
    setProductOptions({
      id: wcProduct.id.toString(), name: wcProduct.name || `Product ${productId}`, description: plainTextDescription,
      price: parseFloat(wcProduct.price) || 0, type: wcProduct.type,
      views: finalViews, selectedVariationIdsForCstmzr: cstmzrSelectedVariationIds,
    });

    setActiveViewId(finalViews[0]?.id || null);
    setSelectedBoundaryBoxId(null);
    setHasUnsavedChanges(!localDataLoadedSuccessfully || isRefreshing);
    setIsLoading(false); setIsRefreshing(false);
    if (isRefreshing) toast({ title: "Product Data Refreshed", description: "Details updated from store."});

  }, [productId, user?.id, toast, isRefreshing]);

  useEffect(() => {
    fetchAndSetProductData();
  }, [fetchAndSetProductData]);

  const handleRefreshData = () => {
    setIsRefreshing(true);
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
    e.preventDefault(); e.stopPropagation();
    if (!productOptions || !activeViewId) return;
    const currentView = productOptions.views.find(v => v.id === activeViewId);
    const currentBox = currentView?.boundaryBoxes.find(b => b.id === boxId);
    if (!currentBox || !imageWrapperRef.current) return;

    setSelectedBoundaryBoxId(boxId);
    const pointerCoords = getPointerCoords(e);
    const containerRect = imageWrapperRef.current.getBoundingClientRect();

    setActiveDrag({
      type, boxId, pointerStartX: pointerCoords.x, pointerStartY: pointerCoords.y,
      initialBoxX: currentBox.x, initialBoxY: currentBox.y,
      initialBoxWidth: currentBox.width, initialBoxHeight: currentBox.height,
      containerWidthPx: containerRect.width, containerHeightPx: containerRect.height,
    });
  }, [productOptions, activeViewId]);

  const handleDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeDrag || !productOptions || !activeViewId || !imageWrapperRef.current) return;
    e.preventDefault();
    cancelAnimationFrame(dragUpdateRef.current);
    dragUpdateRef.current = requestAnimationFrame(() => {
      const pointerCoords = getPointerCoords(e);
      const deltaXpx = pointerCoords.x - activeDrag.pointerStartX;
      const deltaYpx = pointerCoords.y - activeDrag.pointerStartY;
      let deltaXPercent = (deltaXpx / activeDrag.containerWidthPx) * 100;
      let deltaYPercent = (deltaYpx / activeDrag.containerHeightPx) * 100;
      let newX = activeDrag.initialBoxX, newY = activeDrag.initialBoxY;
      let newWidth = activeDrag.initialBoxWidth, newHeight = activeDrag.initialBoxHeight;

      if (activeDrag.type === 'move') { newX += deltaXPercent; newY += deltaYPercent; }
      else {
          const originalProposedWidth = newWidth, originalProposedHeight = newHeight;
          if (activeDrag.type === 'resize_br') { newWidth += deltaXPercent; newHeight += deltaYPercent; }
          else if (activeDrag.type === 'resize_bl') { newX += deltaXPercent; newWidth -= deltaXPercent; newHeight += deltaYPercent; }
          else if (activeDrag.type === 'resize_tr') { newY += deltaYPercent; newWidth += deltaXPercent; newHeight -= deltaYPercent; }
          else if (activeDrag.type === 'resize_tl') { newX += deltaXPercent; newY += deltaYPercent; newWidth -= deltaXPercent; newHeight -= deltaYPercent; }
          newWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth); newHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight);
          if (activeDrag.type === 'resize_tl') { if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth; if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight; }
          else if (activeDrag.type === 'resize_tr') { if (newHeight !== originalProposedHeight) newY = activeDrag.initialBoxY + activeDrag.initialBoxHeight - newHeight; }
          else if (activeDrag.type === 'resize_bl') { if (newWidth !== originalProposedWidth) newX = activeDrag.initialBoxX + activeDrag.initialBoxWidth - newWidth; }
      }
      newX = Math.max(0, Math.min(newX, 100 - MIN_BOX_SIZE_PERCENT)); newWidth = Math.min(newWidth, 100 - newX); newWidth = Math.max(MIN_BOX_SIZE_PERCENT, newWidth); newX = Math.max(0, Math.min(newX, 100 - newWidth));
      newY = Math.max(0, Math.min(newY, 100 - MIN_BOX_SIZE_PERCENT)); newHeight = Math.min(newHeight, 100 - newY); newHeight = Math.max(MIN_BOX_SIZE_PERCENT, newHeight); newY = Math.max(0, Math.min(newY, 100 - newHeight));
      if (isNaN(newX) || isNaN(newY) || isNaN(newWidth) || isNaN(newHeight)) return;

      setProductOptions(prev => prev ? { ...prev, views: prev.views.map(view => view.id === activeViewId ? { ...view, boundaryBoxes: view.boundaryBoxes.map(b => b.id === activeDrag.boxId ? { ...b, x: newX, y: newY, width: newWidth, height: newHeight } : b)} : view)} : null);
      setHasUnsavedChanges(true);
    });
  }, [activeDrag, productOptions, activeViewId, setProductOptions, setHasUnsavedChanges]);

  const handleInteractionEnd = useCallback(() => {
    cancelAnimationFrame(dragUpdateRef.current);
    setActiveDrag(null);
  }, []);

  useEffect(() => {
    if (activeDrag) {
      window.addEventListener('mousemove', handleDragging); window.addEventListener('touchmove', handleDragging, { passive: false });
      window.addEventListener('mouseup', handleInteractionEnd); window.addEventListener('touchend', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragging); window.removeEventListener('touchmove', handleDragging);
      window.removeEventListener('mouseup', handleInteractionEnd); window.removeEventListener('touchend', handleInteractionEnd);
      cancelAnimationFrame(dragUpdateRef.current);
    };
  }, [activeDrag, handleDragging, handleInteractionEnd]);

  const handleSaveChanges = () => {
    if (!productOptions || !user) {
        toast({ title: "Error", description: "Product data or user session is missing.", variant: "destructive"});
        return;
    }
    const localStorageKey = `cstmzr_product_options_${user.id}_${productOptions.id}`;
    const dataToSave: LocalStorageData = {
      views: productOptions.views,
      cstmzrSelectedVariationIds: productOptions.selectedVariationIdsForCstmzr,
    };
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(dataToSave));
      toast({ title: "Saved", description: "Custom views, areas and variation selections saved locally." });
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error("Error saving to localStorage:", e);
      toast({ title: "Save Error", description: "Could not save CSTMZR options.", variant: "destructive"});
    }
  };

  const handleOpenInCustomizer = () => {
    if (!productOptions || hasUnsavedChanges) {
      toast({ title: "Save Changes", description: "Please save your changes before opening in customizer.", variant: "info"});
      return;
    }
    router.push(`/customizer?productId=${productOptions.id}`);
  };

  const handleSelectView = (viewId: string) => {
    setActiveViewId(viewId); setSelectedBoundaryBoxId(null);
    setHasUnsavedChanges(true);
  };

  const handleAddNewView = () => {
    if (!productOptions) return;
    if (productOptions.views.length >= MAX_PRODUCT_VIEWS) {
      toast({ title: "Limit Reached", description: `Max ${MAX_PRODUCT_VIEWS} views per product.`, variant: "info" });
      return;
    }
    const newView: ProductView = {
      id: crypto.randomUUID(), name: `View ${productOptions.views.length + 1}`,
      imageUrl: 'https://placehold.co/600x600/eee/ccc.png?text=New+View', aiHint: 'product view',
      boundaryBoxes: [],
    };
    setProductOptions(prev => prev ? { ...prev, views: [...prev.views, newView] } : null);
    setActiveViewId(newView.id); setSelectedBoundaryBoxId(null); setHasUnsavedChanges(true);
  };

  const handleDeleteView = (viewId: string) => {
    if (!productOptions) return;
    if (productOptions.views.length <= 1) {
      toast({ title: "Cannot Delete", description: "At least one view must remain.", variant: "info" });
      return;
    }
    setViewIdToDelete(viewId);
    setIsDeleteViewDialogOpen(true);
  };

  const confirmDeleteView = () => {
    if (!productOptions || !viewIdToDelete) return;
    const updatedViews = productOptions.views.filter(v => v.id !== viewIdToDelete);
    setProductOptions(prev => prev ? { ...prev, views: updatedViews } : null);
    if (activeViewId === viewIdToDelete) {
      setActiveViewId(updatedViews[0]?.id || null); setSelectedBoundaryBoxId(null);
    }
    setIsDeleteViewDialogOpen(false); setViewIdToDelete(null);
    toast({title: "View Deleted"}); setHasUnsavedChanges(true);
  };

  const handleViewDetailChange = (viewId: string, field: keyof Pick<ProductView, 'name' | 'imageUrl' | 'aiHint'>, value: string) => {
    if (!productOptions) return;
    setProductOptions(prev => prev ? { ...prev, views: prev.views.map(v => v.id === viewId ? { ...v, [field]: value } : v)} : null);
    setHasUnsavedChanges(true);
  };

  const handleAddBoundaryBox = () => {
    if (!productOptions || !activeViewId) return;
    const currentView = productOptions.views.find(v => v.id === activeViewId);
    if (!currentView || currentView.boundaryBoxes.length >= 3) {
      toast({ title: "Limit Reached", description: "Max 3 areas per view.", variant: "destructive" });
      return;
    }
    const newBox: BoundaryBox = {
      id: crypto.randomUUID(), name: `Area ${currentView.boundaryBoxes.length + 1}`,
      x: 10 + currentView.boundaryBoxes.length * 5, y: 10 + currentView.boundaryBoxes.length * 5,
      width: 30, height: 20,
    };
    setProductOptions(prev => prev ? { ...prev, views: prev.views.map(v => v.id === activeViewId ? { ...v, boundaryBoxes: [...v.boundaryBoxes, newBox] } : v)} : null);
    setSelectedBoundaryBoxId(newBox.id); setHasUnsavedChanges(true);
  };

  const handleRemoveBoundaryBox = (boxId: string) => {
    if (!productOptions || !activeViewId) return;
    setProductOptions(prev => prev ? { ...prev, views: prev.views.map(v => v.id === activeViewId ? { ...v, boundaryBoxes: v.boundaryBoxes.filter(b => b.id !== boxId) } : v)} : null);
    if (selectedBoundaryBoxId === boxId) setSelectedBoundaryBoxId(null);
    setHasUnsavedChanges(true);
  };

  const handleBoundaryBoxNameChange = (boxId: string, newName: string) => {
    if (!productOptions || !activeViewId) return;
    setProductOptions(prev => prev ? { ...prev, views: prev.views.map(view => view.id === activeViewId ? { ...view, boundaryBoxes: view.boundaryBoxes.map(box => box.id === boxId ? { ...box, name: newName } : box) } : view)} : null);
    setHasUnsavedChanges(true);
  };

  const handleBoundaryBoxPropertyChange = (boxId: string, property: keyof Pick<BoundaryBox, 'x' | 'y' | 'width' | 'height'>, value: string) => {
    if (!productOptions || !activeViewId) return;
    setProductOptions(prev => {
      if (!prev || !activeViewId) return null;
      return {
        ...prev, views: prev.views.map(view => {
          if (view.id === activeViewId) {
            const newBoxes = view.boundaryBoxes.map(box => {
              if (box.id === boxId) {
                let newBox = { ...box }; const parsedValue = parseFloat(value);
                if (isNaN(parsedValue)) return box;
                if (property === 'x') newBox.x = parsedValue; else if (property === 'y') newBox.y = parsedValue;
                else if (property === 'width') newBox.width = parsedValue; else if (property === 'height') newBox.height = parsedValue;
                let { x: tempX, y: tempY, width: tempW, height: tempH } = newBox;
                tempW = Math.max(MIN_BOX_SIZE_PERCENT, tempW); tempH = Math.max(MIN_BOX_SIZE_PERCENT, tempH);
                tempX = Math.max(0, Math.min(tempX, 100 - tempW)); tempY = Math.max(0, Math.min(tempY, 100 - tempH));
                tempW = Math.min(tempW, 100 - tempX); tempH = Math.min(tempH, 100 - tempY);
                newBox = { ...newBox, x: tempX, y: tempY, width: tempW, height: tempH };
                if (isNaN(newBox.x)) newBox.x = 0; if (isNaN(newBox.y)) newBox.y = 0;
                if (isNaN(newBox.width)) newBox.width = MIN_BOX_SIZE_PERCENT; if (isNaN(newBox.height)) newBox.height = MIN_BOX_SIZE_PERCENT;
                return newBox;
              } return box;
            }); return { ...view, boundaryBoxes: newBoxes };
          } return view;
        })
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleSelectAllVariations = (checked: boolean) => {
    if (!productOptions) return;
    setProductOptions(prev => prev ? { ...prev, selectedVariationIdsForCstmzr: checked ? variations.map(v => v.id.toString()) : [] } : null);
    setHasUnsavedChanges(true);
  };

  const handleVariationSelectionChange = (variationId: string, checked: boolean) => {
    if (!productOptions) return;
    setProductOptions(prev => {
      if (!prev) return null;
      const currentSelected = prev.selectedVariationIdsForCstmzr;
      return { ...prev, selectedVariationIdsForCstmzr: checked ? [...currentSelected, variationId] : currentSelected.filter(id => id !== variationId) };
    });
    setHasUnsavedChanges(true);
  };

  if (isLoading && !isRefreshing) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading...</p></div>;
  if (error && !productOptions) return <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h2 className="text-xl font-semibold text-destructive mb-2">Error</h2><p className="text-muted-foreground text-center mb-6">{error}</p><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button></div>;
  if (!productOptions) return <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4"><ImageIcon className="h-12 w-12 text-muted-foreground mb-4" /><h2 className="text-xl font-semibold text-muted-foreground mb-2">Not Found</h2><p className="text-muted-foreground text-center mb-6">Product could not be loaded.</p><Button variant="outline" asChild><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button></div>;

  const currentView = productOptions.views.find(v => v.id === activeViewId);
  const allVariationsSelected = variations.length > 0 && productOptions.selectedVariationIdsForCstmzr.length === variations.length;
  const someVariationsSelected = productOptions.selectedVariationIdsForCstmzr.length > 0 && productOptions.selectedVariationIdsForCstmzr.length < variations.length;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Link>
        </Button>
        <Button variant="outline" onClick={handleRefreshData} disabled={isRefreshing || isLoading} className="hover:bg-accent hover:text-accent-foreground">
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Refresh Product Data
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline text-foreground">Product Options</h1>
      <p className="text-muted-foreground mb-8">Editing for: <span className="font-semibold text-foreground">{productOptions.name}</span> (ID: {productOptions.id})</p>
      {error && <ShadCnAlert variant="destructive" className="mb-6"><AlertTriangle className="h-4 w-4" /><ShadCnAlertTitle>Product Data Error</ShadCnAlertTitle><ShadCnAlertDescription>{error}</ShadCnAlertDescription></ShadCnAlert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="font-headline text-lg">Base Product Information</CardTitle><CardDescription>From WooCommerce (Read-only).</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="productName">Product Name</Label><Input id="productName" value={productOptions.name} className="mt-1 bg-muted/50" readOnly /></div>
              <div><Label htmlFor="productDescription">Description</Label><Textarea id="productDescription" value={productOptions.description} className="mt-1 bg-muted/50" rows={4} readOnly /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="productPrice">Price ($)</Label><Input id="productPrice" type="number" value={productOptions.price} className="mt-1 bg-muted/50" readOnly /></div>
                <div><Label htmlFor="productType">Type</Label><Input id="productType" value={productOptions.type.charAt(0).toUpperCase() + productOptions.type.slice(1)} className="mt-1 bg-muted/50" readOnly /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader><CardTitle className="font-headline text-lg">Product View & Customization Setup</CardTitle><CardDescription>Configure views and clickable areas for customization.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-6">
                <h4 className="text-base font-semibold text-foreground mb-1">Image for: <span className="text-primary">{currentView?.name || "N/A"}</span></h4>
                <p className="text-xs text-muted-foreground mb-3">Click & drag areas. Use handles to resize. Select a view in the 'Views' tab below to change image.</p>
                <div ref={imageWrapperRef} className="relative w-full aspect-square border rounded-md overflow-hidden group bg-muted/20 select-none mb-4" onMouseDown={(e) => { if (e.target === imageWrapperRef.current) setSelectedBoundaryBoxId(null); }}>
                  {currentView?.imageUrl ? (
                    <NextImage src={currentView.imageUrl} alt={currentView.name || 'Product View'} fill className="object-contain pointer-events-none" data-ai-hint={currentView.aiHint || "product view"} priority />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><ImageIcon className="w-16 h-16 text-muted-foreground" /><p className="text-sm text-muted-foreground mt-2">No image for this view. Set URL below.</p></div>
                  )}
                  {currentView && currentView.boundaryBoxes && currentView.boundaryBoxes.map((box) => (
                    <div key={box.id} className={cn("absolute transition-colors duration-100 ease-in-out group/box", selectedBoundaryBoxId === box.id ? 'border-primary ring-2 ring-primary ring-offset-1 bg-primary/10' : 'border-2 border-dashed border-accent/70 hover:border-primary hover:bg-primary/10', activeDrag?.boxId === box.id && activeDrag.type === 'move' ? 'cursor-grabbing' : 'cursor-grab')} style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%`, zIndex: selectedBoundaryBoxId === box.id ? 10 : 1 }} onMouseDown={(e) => handleInteractionStart(e, box.id, 'move')} onTouchStart={(e) => handleInteractionStart(e, box.id, 'move')}>
                      {selectedBoundaryBoxId === box.id && (<>
                          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-md cursor-nwse-resize hover:opacity-80 active:opacity-100" title="Resize (Top-Left)" onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tl')} onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tl')}><Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100" title="Resize (Top-Right)" onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_tr')} onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_tr')}><Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-md cursor-nesw-resize hover:opacity-80 active:opacity-100" title="Resize (Bottom-Left)" onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_bl')} onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_bl')}><Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-md cursor-nwse-resize hover:opacity-80 active:opacity-100" title="Resize (Bottom-Right)" onMouseDown={(e) => handleInteractionStart(e, box.id, 'resize_br')} onTouchStart={(e) => handleInteractionStart(e, box.id, 'resize_br')}><Maximize2 className="w-2.5 h-2.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                      </>)}
                      <div className={cn("absolute top-0.5 left-0.5 text-[8px] px-1 py-0.5 rounded-br-sm opacity-0 group-hover/box:opacity-100 group-[.is-selected]/box:opacity-100 transition-opacity select-none pointer-events-none", selectedBoundaryBoxId === box.id ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>{box.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Tabs defaultValue="views" className="w-full">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="views">Product Views</TabsTrigger><TabsTrigger value="areas" disabled={!activeViewId}>Customization Areas</TabsTrigger></TabsList>
                <TabsContent value="views" className="mt-4">
                  <div className="mb-4"><h4 className="text-sm font-medium text-muted-foreground mb-2">Select a View:</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {productOptions.views.map(view => (<Button key={view.id} variant={activeViewId === view.id ? "default" : "outline"} onClick={() => handleSelectView(view.id)} size="sm" className="flex-grow sm:flex-grow-0">{view.name}</Button>))}
                    </div>
                  </div><Separator className="my-4"/>
                  <div>
                    <div className="flex justify-between items-center mb-3"><h4 className="text-sm font-medium text-muted-foreground">{currentView ? `Editing View: ` : "Manage Views"}{currentView && <span className="text-primary font-semibold">{currentView.name}</span>}</h4>{productOptions.views.length < MAX_PRODUCT_VIEWS && (<Button onClick={handleAddNewView} variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground"><PlusCircle className="mr-1.5 h-4 w-4" />Add New View</Button>)}</div>
                    {productOptions.views.length >= MAX_PRODUCT_VIEWS && !currentView && (<p className="text-xs text-muted-foreground mb-4 text-center">Maximum ${MAX_PRODUCT_VIEWS} views reached.</p>)}
                    {currentView && (<div className="space-y-3 p-3 border rounded-md bg-muted/20">
                        <div><Label htmlFor={`viewName-${currentView.id}`} className="text-xs mb-1 block">View Name</Label><Input id={`viewName-${currentView.id}`} value={currentView.name} onChange={(e) => handleViewDetailChange(currentView.id, 'name', e.target.value)} className="mt-1 h-8 bg-background"/></div>
                        <div><Label htmlFor={`viewImageUrl-${currentView.id}`} className="text-xs mb-1 block">Image URL</Label><Input id={`viewImageUrl-${currentView.id}`} value={currentView.imageUrl} onChange={(e) => handleViewDetailChange(currentView.id, 'imageUrl', e.target.value)} placeholder="https://placehold.co/600x600.png" className="mt-1 h-8 bg-background"/></div>
                        <div><Label htmlFor={`viewAiHint-${currentView.id}`} className="text-xs mb-1 block">AI Hint</Label><Input id={`viewAiHint-${currentView.id}`} value={currentView.aiHint || ''} onChange={(e) => handleViewDetailChange(currentView.id, 'aiHint', e.target.value)} placeholder="e.g., t-shirt back" className="mt-1 h-8 bg-background"/></div>
                        {productOptions.views.length > 1 && (<Button variant="destructive" onClick={() => handleDeleteView(currentView!.id)} size="sm" className="w-full mt-2"><Trash2 className="mr-2 h-4 w-4" />Delete This View</Button>)}
                    </div>)}
                    {!currentView && productOptions.views.length > 0 && (<p className="text-sm text-muted-foreground text-center py-2">Select a view to edit or add new.</p>)}
                    {!currentView && productOptions.views.length === 0 && (<p className="text-sm text-muted-foreground text-center py-2">No views. Click "Add New View".</p>)}
                  </div>
                </TabsContent>
                <TabsContent value="areas" className="mt-4">
                  {!activeViewId && (<div className="text-center py-6 text-muted-foreground"><LayersIcon className="mx-auto h-10 w-10 mb-2" /><p>Select view to manage areas.</p></div>)}
                  {activeViewId && currentView && (<>
                      <div className="flex justify-between items-center mb-3"><h4 className="text-base font-semibold text-foreground">Areas for: <span className="text-primary">{currentView.name}</span></h4>{currentView.boundaryBoxes.length < 3 ? (<Button onClick={handleAddBoundaryBox} variant="outline" size="sm" className="hover:bg-accent hover:text-accent-foreground" disabled={!activeViewId}><PlusCircle className="mr-1.5 h-4 w-4" />Add Area</Button>) : null}</div>
                      {currentView.boundaryBoxes.length > 0 ? (
                      <div className="space-y-3">
                        {currentView.boundaryBoxes.map((box) => (
                        <div key={box.id} className={cn("p-3 border rounded-md transition-all", selectedBoundaryBoxId === box.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-muted/30 hover:bg-muted/50', "cursor-pointer")} onClick={() => setSelectedBoundaryBoxId(box.id)}>
                          <div className="flex justify-between items-center mb-1.5"><Input value={box.name} onChange={(e) => handleBoundaryBoxNameChange(box.id, e.target.value)} className="text-sm font-semibold text-foreground h-8 flex-grow mr-2 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring p-1" onClick={(e) => e.stopPropagation()} /><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveBoundaryBox(box.id);}} className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7" title="Remove Area"><Trash2 className="h-4 w-4" /></Button></div>
                          {selectedBoundaryBoxId === box.id ? (
                          <div className="mt-3 pt-3 border-t border-border/50"><h4 className="text-xs font-medium mb-1.5 text-muted-foreground">Edit Dimensions (%):</h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                              <div><Label htmlFor={`box-x-${box.id}`} className="text-xs mb-1 block">X</Label><Input type="number" step="0.1" min="0" max="100" id={`box-x-${box.id}`} value={box.x.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'x', e.target.value)} className="h-8 text-xs w-full bg-background" onClick={(e) => e.stopPropagation()} /></div>
                              <div><Label htmlFor={`box-y-${box.id}`} className="text-xs mb-1 block">Y</Label><Input type="number" step="0.1" min="0" max="100" id={`box-y-${box.id}`} value={box.y.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'y', e.target.value)} className="h-8 text-xs w-full bg-background" onClick={(e) => e.stopPropagation()} /></div>
                              <div><Label htmlFor={`box-w-${box.id}`} className="text-xs mb-1 block">Width</Label><Input type="number" step="0.1" min={MIN_BOX_SIZE_PERCENT.toString()} max="100" id={`box-w-${box.id}`} value={box.width.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'width', e.target.value)} className="h-8 text-xs w-full bg-background" onClick={(e) => e.stopPropagation()} /></div>
                              <div><Label htmlFor={`box-h-${box.id}`} className="text-xs mb-1 block">Height</Label><Input type="number" step="0.1" min={MIN_BOX_SIZE_PERCENT.toString()} max="100" id={`box-h-${box.id}`} value={box.height.toFixed(1)} onChange={(e) => handleBoundaryBoxPropertyChange(box.id, 'height', e.target.value)} className="h-8 text-xs w-full bg-background" onClick={(e) => e.stopPropagation()} /></div>
                            </div>
                          </div>) : (<div className="text-xs text-muted-foreground space-y-0.5"><p><strong>X:</strong> {box.x.toFixed(1)}% | <strong>Y:</strong> {box.y.toFixed(1)}%</p><p><strong>W:</strong> {box.width.toFixed(1)}% | <strong>H:</strong> {box.height.toFixed(1)}%</p></div>)}
                        </div>))}
                      </div>) : (<p className="text-sm text-muted-foreground text-center py-2">No areas. Click "Add Area".</p>)}
                      {currentView.boundaryBoxes.length >= 3 && (<p className="text-sm text-muted-foreground text-center py-2">Max 3 areas for this view.</p>)}
                  </>)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {productOptions.type === 'variable' && (
            <Card className="shadow-md">
              <CardHeader><CardTitle className="font-headline text-lg">Product Variations</CardTitle><CardDescription>Select which variations should be available in the customizer.</CardDescription></CardHeader>
              <CardContent>
                {isLoadingVariations || (isRefreshing && isLoading) ? <div className="flex items-center justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading variations...</p></div>
                : variationsError ? <div className="text-center py-6"><AlertTriangle className="mx-auto h-10 w-10 text-destructive" /><p className="mt-3 text-destructive font-semibold">Error loading variations</p><p className="text-sm text-muted-foreground mt-1">{variationsError}</p></div>
                : variations.length > 0 ? (<>
                    <div className="mb-4 flex items-center space-x-2 p-2 border-b">
                      <Checkbox id="selectAllVariations" checked={allVariationsSelected} onCheckedChange={(cs) => handleSelectAllVariations(cs === 'indeterminate' ? true : cs as boolean)} data-state={someVariationsSelected && !allVariationsSelected ? 'indeterminate' : (allVariationsSelected ? 'checked' : 'unchecked')} />
                      <Label htmlFor="selectAllVariations" className="text-sm font-medium">{allVariationsSelected ? "Deselect All" : "Select All"}</Label>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {variations.map((variation) => (
                        <div key={variation.id} className={cn("p-3 border rounded-md flex items-start gap-3 transition-colors", productOptions.selectedVariationIdsForCstmzr.includes(variation.id.toString()) ? "bg-primary/10 border-primary" : "bg-muted/30 hover:bg-muted/50")}>
                          <Checkbox id={`variation-${variation.id}`} checked={productOptions.selectedVariationIdsForCstmzr.includes(variation.id.toString())} onCheckedChange={(c) => handleVariationSelectionChange(variation.id.toString(), c as boolean)} className="mt-1 flex-shrink-0" />
                          <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-card flex-shrink-0"><NextImage src={variation.image?.src || (currentView?.imageUrl) || 'https://placehold.co/100x100.png'} alt={variation.image?.alt || productOptions.name} fill className="object-contain" data-ai-hint={variation.image?.alt ? variation.image.alt.split(" ").slice(0,2).join(" ") : "variation image"}/></div>
                          <div className="flex-grow"><p className="text-sm font-medium text-foreground">{variation.attributes.map(attr => `${attr.name}: ${attr.option}`).join(' / ')}</p><p className="text-xs text-muted-foreground">SKU: {variation.sku || 'N/A'}</p><p className="text-xs text-muted-foreground">Price: ${parseFloat(variation.price).toFixed(2)}</p></div>
                          <Badge variant={variation.stock_status === 'instock' ? 'default' : (variation.stock_status === 'onbackorder' ? 'secondary' : 'destructive')} className={cn("self-start", variation.stock_status === 'instock' && 'bg-green-500/10 text-green-700 border-green-500/30', variation.stock_status === 'onbackorder' && 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30', variation.stock_status === 'outofstock' && 'bg-red-500/10 text-red-700 border-red-500/30')}>{variation.stock_status === 'instock' ? 'In Stock' : variation.stock_status === 'onbackorder' ? 'On Backorder' : 'Out of Stock'}{variation.stock_quantity !== null && ` (${variation.stock_quantity})`}</Badge>
                        </div>))}
                    </div></>
                ) : <div className="text-center py-6"><LayersIcon className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No variations found for this product.</p></div>}
              </CardContent>
            </Card>
          )}
          {productOptions.type !== 'variable' && (
            <Card className="shadow-md"><CardHeader><CardTitle className="font-headline text-lg">Product Variations</CardTitle></CardHeader><CardContent className="text-center py-8 text-muted-foreground"><Shirt className="mx-auto h-10 w-10 mb-2" />This is a simple product and does not have variations.</CardContent></Card>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-md sticky top-8">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Summary & Actions</CardTitle>
              <CardDescription>Review your product setup and save changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Editing for: <span className="font-semibold text-foreground">{productOptions.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total Views: <span className="font-semibold text-foreground">{productOptions.views.length}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Active View: <span className="font-semibold text-foreground">{currentView?.name || "N/A"}</span>
              </p>
              {currentView && (
                <p className="text-sm text-muted-foreground">
                  Areas in <span className="font-semibold text-primary">{currentView.name}</span>: <span className="font-semibold text-foreground">{currentView.boundaryBoxes.length}</span>
                </p>
              )}
              {productOptions.type === 'variable' && (
                <p className="text-sm text-muted-foreground">
                  Variations Selected: <span className="font-semibold text-foreground">{productOptions.selectedVariationIdsForCstmzr.length} of {variations.length}</span>
                </p>
              )}
              {hasUnsavedChanges && (<p className="mt-3 text-sm text-yellow-600 flex items-center"><AlertTriangle className="h-4 w-4 mr-1.5 text-yellow-500" />You have unsaved changes.</p>)}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <Button onClick={handleSaveChanges} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">Save All Configurations</Button>
              <Button variant="outline" size="lg" onClick={handleOpenInCustomizer} disabled={hasUnsavedChanges} className="hover:bg-accent hover:text-accent-foreground"><ExternalLink className="mr-2 h-4 w-4" />Open in Customizer</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDeleteViewDialogOpen} onOpenChange={setIsDeleteViewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this view?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. It will permanently delete the view and its customization areas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setViewIdToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteView} className={cn(buttonVariants({variant: "destructive"}))}>Delete View</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    