
"use client"; 

import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider } from "@/contexts/UploadContext";
import { useEffect, useState, useCallback } from 'react';
import { fetchWooCommerceProductById } from '@/app/actions/woocommerceActions';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, ShoppingCart, UploadCloud, Layers, Type, Shapes as ShapesIconLucide, Smile, Palette, Gem as GemIcon, Settings2 as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image';
import Link from 'next/link';
import type { WCCustomProduct } from '@/types/woocommerce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CustomizerIconNav, { type CustomizerTool } from '@/components/customizer/CustomizerIconNav';
import { ScrollArea } from '@/components/ui/scroll-area';

// Panel Content Components
import UploadArea from '@/components/customizer/UploadArea';
import LayersPanel from '@/components/customizer/LayersPanel';
import TextToolPanel from '@/components/customizer/TextToolPanel';
import ShapesPanel from '@/components/customizer/ShapesPanel';
import ClipartPanel from '@/components/customizer/ClipartPanel';
import FreeDesignsPanel from '@/components/customizer/FreeDesignsPanel';
import PremiumDesignsPanel from '@/components/customizer/PremiumDesignsPanel';
import AiAssistant from '@/components/customizer/AiAssistant'; // For RightPanel, but could be a tool too

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

interface ProductForCustomizer {
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
  // { id: "products", label: "Products", icon: PackageIcon }, // Products usually not in customizer tools
  { id: "layers", label: "Layers", icon: Layers },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Shapes", icon: ShapesIconLucide },
  { id: "clipart", label: "Clipart", icon: Smile },
  { id: "free-designs", label: "Free Designs", icon: Palette },
  { id: "premium-designs", label: "Premium Designs", icon: GemIcon },
  // { id: "ai-assistant", label: "AI Assistant", icon: SparklesIcon }, // This is the RightPanel for now
];


export default function CustomizerPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [productDetails, setProductDetails] = useState<ProductForCustomizer | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>(toolItems[0]?.id || "layers");


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
     if (!activeViewId && (activeTool !== "products" && activeTool !== "layers")) {
       return (
         <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center flex-1">
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
      // case "ai-assistant": return <AiAssistant />; // This is the RightPanel
      default:
        return (
          <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center flex-1">
            <SettingsIcon className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-1">{getToolPanelTitle(activeTool)}</h3>
            <p className="text-sm">Tool panel not yet implemented.</p>
          </div>
        );
    }
  };


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
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
      <div className="flex flex-col min-h-svh w-full items-center justify-center bg-background p-4">
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
    <UploadProvider>
      <div className="flex flex-col min-h-svh w-full bg-muted/20">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <CustomizerIconNav 
            tools={toolItems} 
            activeTool={activeTool} 
            setActiveTool={setActiveTool} 
          />

          <div className="w-72 md:w-80 border-r bg-card shadow-sm flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-4 border-b">
              <h2 className="font-headline text-lg font-semibold text-foreground">
                {getToolPanelTitle(activeTool)}
              </h2>
            </div>
            {/* ScrollArea applied here for the content of the active tool panel */}
            <ScrollArea className="flex-grow">
               {renderActiveToolPanelContent()}
            </ScrollArea>
          </div>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center"> 
            {error && productDetails?.id === defaultFallbackProduct.id && ( 
               <div className="w-full max-w-4xl p-3 mb-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm">
                 <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} Using default product view.
               </div>
            )}
            <DesignCanvas 
              productImageUrl={currentProductImage}
              productImageAlt={`${currentProductName} - ${currentProductAlt}`}
              productImageAiHint={currentProductAiHint}
              productDefinedBoundaryBoxes={currentBoundaryBoxes}
              activeViewId={activeViewId}
            />
            {productDetails && productDetails.views && productDetails.views.length > 0 && (
              <div className="mt-6 pt-4 w-full max-w-4xl border-t border-border">
                <h4 className="text-base font-semibold mb-3 text-center text-foreground">
                  {productDetails.views.length > 1 ? "Product Views" : "Current View"}
                </h4>
                <div className="flex justify-center gap-3 flex-wrap">
                  {productDetails.views.map(view => (
                    <button
                      key={view.id}
                      onClick={() => setActiveViewId(view.id)}
                      className={cn(
                        "rounded-lg border-2 p-1.5 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        activeViewId === view.id 
                          ? "border-primary opacity-100 ring-2 ring-primary ring-offset-background shadow-md" 
                          : "border-transparent opacity-70 hover:border-muted-foreground/30 bg-muted/30 hover:bg-muted/50"
                      )}
                      title={`Select ${view.name} view`}
                      aria-pressed={activeViewId === view.id}
                    >
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 bg-background rounded overflow-hidden shadow-sm">
                        <NextImage
                          src={view.imageUrl || 'https://placehold.co/80x80.png'}
                          alt={`Thumbnail for ${view.name}`}
                          fill
                          sizes="(max-width: 640px) 5rem, 4rem"
                          className="object-contain"
                          data-ai-hint={view.aiHint || "product view thumbnail"}
                        />
                      </div>
                      <p className="text-xs mt-1.5 text-center truncate w-16 sm:w-20 text-foreground">{view.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
          <RightPanel /> 
        </div>
        <footer className="h-20 border-t bg-card shadow-md p-4 flex items-center justify-between flex-shrink-0">
            <div className="text-lg font-semibold text-foreground">Total: $0.00</div> {/* Placeholder */}
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
        </footer>
      </div>
    </UploadProvider>
  );
}
