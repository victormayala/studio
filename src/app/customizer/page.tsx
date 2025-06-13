
"use client"; 

import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider, useUploads } from "@/contexts/UploadContext"; 
import { useEffect, useState, useCallback } from 'react';
import { fetchWooCommerceProductById } from '@/app/actions/woocommerceActions';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Loader2, AlertTriangle, ShoppingCart, UploadCloud, Layers, Type, Shapes as ShapesIconLucide, Smile, Palette, Gem as GemIcon, Settings2 as SettingsIcon,
  PanelLeftClose, PanelRightOpen, PanelRightClose, PanelLeftOpen 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { WCCustomProduct } from '@/types/woocommerce';
import { useToast } from '@/hooks/use-toast';
import CustomizerIconNav, { type CustomizerTool } from '@/components/customizer/CustomizerIconNav';
import { cn } from '@/lib/utils'; 

// Panel Content Components
import UploadArea from '@/components/customizer/UploadArea';
import LayersPanel from '@/components/customizer/LayersPanel';
import TextToolPanel from '@/components/customizer/TextToolPanel';
import ShapesPanel from '@/components/customizer/ShapesPanel';
import ClipartPanel from '@/components/customizer/ClipartPanel';
import FreeDesignsPanel from '@/components/customizer/FreeDesignsPanel';
import PremiumDesignsPanel from '@/components/customizer/PremiumDesignsPanel';

interface BoundaryBox {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProductView { 
  id: string;
  name: string;
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
}

interface LocalStorageCustomizerOptions {
  views: ProductView[];
  cstmzrSelectedVariationIds: string[];
}

export interface ProductForCustomizer {
  id: string;
  name: string;
  views: ProductView[];
}

const defaultFallbackProduct: ProductForCustomizer = {
  id: 'fallback_product',
  name: 'Product Customizer (Default)',
  views: [
    {
      id: 'fallback_view_1',
      name: 'Front View',
      imageUrl: 'https://placehold.co/700x700.png',
      aiHint: 'product mockup',
      boundaryBoxes: [
        { id: 'fallback_area_1', name: 'Default Area', x: 25, y: 25, width: 50, height: 50 },
      ],
    }
  ]
};

const toolItems: CustomizerTool[] = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Shapes", icon: ShapesIconLucide },
  { id: "clipart", label: "Clipart", icon: Smile },
  { id: "free-designs", label: "Free Designs", icon: Palette },
  { id: "premium-designs", label: "Premium Designs", icon: GemIcon },
];

// Inner component that uses the context
function CustomizerLayoutAndLogic() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { canvasImages, canvasTexts, canvasShapes } = useUploads(); 

  const [productDetails, setProductDetails] = useState<ProductForCustomizer | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>(toolItems[0]?.id || "layers");
  const [showGrid, setShowGrid] = useState(false);

  const [isToolPanelOpen, setIsToolPanelOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const toggleGrid = () => setShowGrid(prev => !prev);
  const toggleToolPanel = () => setIsToolPanelOpen(prev => !prev);
  const toggleRightSidebar = () => setIsRightSidebarOpen(prev => !prev);


  const loadCustomizerData = useCallback(async () => {
    setIsLoading(true); 
    setError(null);
    
    if (!productId) {
      setError("No product ID provided. Displaying default customizer.");
      setProductDetails(defaultFallbackProduct);
      setActiveViewId(defaultFallbackProduct.views[0]?.id || null);
      setIsLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }
    
    let wcProduct: WCCustomProduct | undefined;
    let fetchError: string | undefined;
    let userCredentials;

    if (user) {
      try {
        const userStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
        const userConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
        const userConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);
        if (userStoreUrl && userConsumerKey && userConsumerSecret) {
          userCredentials = { storeUrl: userStoreUrl, consumerKey: userConsumerKey, consumerSecret: userConsumerSecret };
        }
      } catch (storageError) {
        console.warn("Customizer: Could not access localStorage for WC credentials:", storageError);
      }
    }
    
    ({ product: wcProduct, error: fetchError } = await fetchWooCommerceProductById(productId, userCredentials));

    if (fetchError || !wcProduct) {
      setError(fetchError || `Failed to load product (ID: ${productId}). Displaying default.`);
      setProductDetails(defaultFallbackProduct);
      setActiveViewId(defaultFallbackProduct.views[0]?.id || null);
      setIsLoading(false);
      toast({ title: "Product Load Error", description: fetchError || `Product ${productId} not found.`, variant: "destructive"});
      return;
    }

    let loadedViews: ProductView[] = [];

    if (user) {
      const localStorageKey = `cstmzr_product_options_${user.id}_${productId}`;
      try {
        const savedOptions = localStorage.getItem(localStorageKey);
        if (savedOptions) {
          const parsedOptions = JSON.parse(savedOptions) as LocalStorageCustomizerOptions;
          loadedViews = parsedOptions.views || [];
        }
      } catch (e) {
        console.warn("Customizer: Error parsing CSTMZR options from localStorage:", e);
        toast({ title: "Local Settings Error", description: "Could not load saved CSTMZR settings. Using defaults.", variant: "info"});
      }
    } else {
        console.info("Customizer: No CSTMZR user logged in. Views will default.");
    }

    const finalViews = loadedViews.length > 0 ? loadedViews : [
      { 
        id: `default_view_wc_${wcProduct.id}`,
        name: "Front View",
        imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : defaultFallbackProduct.views[0].imageUrl,
        aiHint: wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : defaultFallbackProduct.views[0].aiHint,
        boundaryBoxes: defaultFallbackProduct.views[0].boundaryBoxes,
      }
    ];
    
    setProductDetails({
      id: wcProduct.id.toString(),
      name: wcProduct.name || `Product ${productId}`,
      views: finalViews,
    });

    setActiveViewId(finalViews[0]?.id || null);
    setIsLoading(false);
  }, [productId, user, authLoading, toast]);

  useEffect(() => {
    loadCustomizerData();
  }, [loadCustomizerData]);

  const getToolPanelTitle = (toolId: string): string => {
    const tool = toolItems.find(item => item.id === toolId);
    return tool ? tool.label : "Design Tool";
  };

  const renderActiveToolPanelContent = () => {
     if (!activeViewId && (activeTool !== "layers")) {
       return (
         <div className="p-4 text-center text-muted-foreground flex flex-col items-center justify-center">
           <SettingsIcon className="w-12 h-12 mb-4 text-muted-foreground/50" />
           <h3 className="text-lg font-semibold mb-1">Select a View</h3>
           <p className="text-sm">Please select a product view before adding elements.</p>
         </div>
       );
    }
    switch (activeTool) {
      case "uploads": return <UploadArea activeViewId={activeViewId} />;
      case "layers": return <LayersPanel activeViewId={activeViewId} />;
      case "text": return <TextToolPanel activeViewId={activeViewId} />;
      case "shapes": return <ShapesPanel activeViewId={activeViewId} />;
      case "clipart": return <ClipartPanel activeViewId={activeViewId} />;
      case "free-designs": return <FreeDesignsPanel activeViewId={activeViewId} />;
      case "premium-designs": return <PremiumDesignsPanel activeViewId={activeViewId} />;
      default:
        return (
          <div className="p-4 text-center text-muted-foreground flex flex-col items-center justify-center">
            <SettingsIcon className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-1">{getToolPanelTitle(activeTool)}</h3>
            <p className="text-sm">Tool panel not yet implemented.</p>
          </div>
        );
    }
  };

  const handleAddToCart = () => {
    if (!user && (canvasImages.length === 0 && canvasTexts.length === 0 && canvasShapes.length === 0)) {
      toast({
        title: "Cannot Add to Cart",
        description: "Please add some design elements or sign in.",
        variant: "info",
      });
      return;
    }
    
    if (!user && (canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0)) {
       toast({
        title: "Please Sign In",
        description: "Sign in to save your design and add to cart.",
        variant: "info",
      });
      return;
    }

    const currentProductIdFromParams = searchParams.get('productId'); 

    const designData = {
      images: canvasImages.filter(item => item.viewId === activeViewId), 
      texts: canvasTexts.filter(item => item.viewId === activeViewId),
      shapes: canvasShapes.filter(item => item.viewId === activeViewId),
      productId: currentProductIdFromParams, 
      userId: user?.id, 
      activeViewId: activeViewId, 
    };

    let targetOrigin = '*'; 
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_WORDPRESS_SITE_ORIGIN) {
        targetOrigin = process.env.NEXT_PUBLIC_WORDPRESS_SITE_ORIGIN;
    }
    
    if (window.parent !== window) {
      window.parent.postMessage({ cstmzrDesignData: designData }, targetOrigin);
      toast({
        title: "Design Sent!",
        description: "Your design details have been sent to the store.",
      });
    } else {
       toast({
        title: "Add to Cart Clicked (Standalone)",
        description: "This action would normally send data to an embedded store. Design data logged to console.",
        variant: "info"
      });
      console.log("Add to Cart - Design Data:", designData);
    }
  };


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-svh h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading customizer...</p>
      </div>
    );
  }
  
  const activeViewData = productDetails?.views.find(v => v.id === activeViewId);
  
  const currentProductImage = activeViewData?.imageUrl || defaultFallbackProduct.views[0].imageUrl;
  const currentProductAlt = activeViewData?.name || defaultFallbackProduct.views[0].name;
  const currentProductAiHint = activeViewData?.aiHint || defaultFallbackProduct.views[0].aiHint;
  const currentBoundaryBoxes = activeViewData?.boundaryBoxes || defaultFallbackProduct.views[0].boundaryBoxes;
  const currentProductName = productDetails?.name || defaultFallbackProduct.name;


  if (error && !productDetails) { 
    return (
      <div className="flex flex-col min-h-svh h-w-full items-center justify-center bg-background p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Customizer Error</h2>
        <p className="text-muted-foreground text-center mb-6">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
      <div className="flex flex-col min-h-svh w-full bg-muted/20">
        <AppHeader />
        <div className="relative flex flex-1 overflow-hidden"> 
          <CustomizerIconNav
            tools={toolItems} 
            activeTool={activeTool} 
            setActiveTool={setActiveTool} 
          />

          {/* Tool Panel Content (Old Left Panel area) */}
          <div
            id="tool-panel-content"
            className={cn(
              "border-r bg-card shadow-sm flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out h-full",
              isToolPanelOpen ? "w-72 md:w-80 opacity-100" : "w-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="font-headline text-lg font-semibold text-foreground">
                {getToolPanelTitle(activeTool)}
              </h2>
            </div>
            <div className={cn(
              "flex-1 h-full overflow-y-auto overflow-x-hidden pb-20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500",
              !isToolPanelOpen && "invisible opacity-0"
            )}>
               {renderActiveToolPanelContent()}
            </div>
          </div>
          
          {/* Tool Panel Trigger Button */}
          <Button
            onClick={toggleToolPanel}
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-30 h-12 w-8 rounded-l-none border-l-0 shadow-md bg-card hover:bg-accent/20",
              "transition-all duration-300 ease-in-out",
              isToolPanelOpen ? "left-[calc(theme(spacing.16)_+_theme(spacing.72))] md:left-[calc(theme(spacing.16)_+_theme(spacing.80))]" : "left-16"
            )}
            aria-label={isToolPanelOpen ? "Collapse tool panel" : "Expand tool panel"}
            aria-expanded={isToolPanelOpen}
            aria-controls="tool-panel-content"
          >
            {isToolPanelOpen ? <PanelLeftClose className="h-5 w-5"/> : <PanelRightOpen className="h-5 w-5"/>}
          </Button>
          
          <main className="flex-1 p-4 md:p-6 flex flex-col min-h-0"> 
            {error && productDetails?.id === defaultFallbackProduct.id && ( 
               <div className="w-full max-w-4xl p-3 mb-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm flex-shrink-0">
                 <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} Using default product view.
               </div>
            )}
            
             <div className="w-full flex flex-col flex-1 min-h-0 pb-20">
              <DesignCanvas 
                productImageUrl={currentProductImage}
                productImageAlt={`${currentProductName} - ${currentProductAlt}`}
                productImageAiHint={currentProductAiHint}
                productDefinedBoundaryBoxes={currentBoundaryBoxes}
                activeViewId={activeViewId}
                showGrid={showGrid}
              />
            </div>
          </main>

          {/* Right Sidebar Trigger Button */}
           <Button
            onClick={toggleRightSidebar}
            variant="outline"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-30 h-12 w-8 rounded-r-none border-r-0 shadow-md bg-card hover:bg-accent/20",
              "transition-all duration-300 ease-in-out",
              isRightSidebarOpen ? "right-[theme(spacing.72)] md:right-[theme(spacing.80)] lg:right-[theme(spacing.96)]" : "right-0"
            )}
            aria-label={isRightSidebarOpen ? "Collapse right sidebar" : "Expand right sidebar"}
            aria-expanded={isRightSidebarOpen}
            aria-controls="right-panel-content"
          >
            {isRightSidebarOpen ? <PanelRightClose className="h-5 w-5"/> : <PanelLeftOpen className="h-5 w-5"/>}
          </Button>
          
          <RightPanel 
            showGrid={showGrid} 
            toggleGrid={toggleGrid} 
            productDetails={productDetails}
            activeViewId={activeViewId}
            setActiveViewId={setActiveViewId}
            className={cn(
              "transition-all duration-300 ease-in-out flex-shrink-0 h-full",
              isRightSidebarOpen ? "w-72 md:w-80 lg:w-96 opacity-100" : "w-0 opacity-0 pointer-events-none"
            )}
          /> 
        </div>
        
        <footer className="fixed bottom-0 left-0 right-0 h-20 border-t bg-card shadow-md p-4 flex items-center justify-end gap-4 z-40">
            <div className="text-lg font-semibold text-foreground">Total: $0.00</div>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
        </footer>
      </div>
  );
}

// Main page component that provides the context
export default function CustomizerPage() {
  return (
    <UploadProvider>
      <CustomizerLayoutAndLogic />
    </UploadProvider>
  );
}

