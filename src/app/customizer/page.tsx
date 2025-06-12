
"use client"; 

import { useSearchParams } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppHeader from '@/components/layout/AppHeader';
import LeftPanel from '@/components/customizer/LeftPanel';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider } from "@/contexts/UploadContext";
import { useEffect, useState, useCallback } from 'react';
import { fetchWooCommerceProductById } from '@/app/actions/woocommerceActions';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NextImage from 'next/image'; // Added for thumbnails
import Link from 'next/link';
import type { WCCustomProduct } from '@/types/woocommerce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; // Added for thumbnail styling

// Interface for boundary boxes (consistent with options page)
interface BoundaryBox {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Interface for a single product view
interface ProductView {
  id: string;
  name: string;
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
}

// Interface for options loaded from localStorage
interface LocalStorageCustomizerOptions {
  views: ProductView[]; // Updated from boundaryBoxes
  cstmzrSelectedVariationIds: string[];
}

// Combined product data structure for the customizer
interface ProductForCustomizer {
  id: string; // Product ID from WC
  name: string; // Product Name from WC
  views: ProductView[]; // Array of views
  // No top-level imageUrl, aiHint, or boundaryBoxes anymore
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

export default function CustomizerPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [productDetails, setProductDetails] = useState<ProductForCustomizer | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stripHtml = (html: string): string => {
    if (typeof window === 'undefined') return html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const loadCustomizerData = useCallback(async () => {
    setIsLoading(true); // Set loading true at the start of data fetching
    setError(null);
    
    if (!productId) {
      setError("No product ID provided. Displaying default customizer.");
      setProductDetails(defaultFallbackProduct);
      setActiveViewId(defaultFallbackProduct.views[0]?.id || null);
      setIsLoading(false);
      return;
    }

    if (authLoading) {
      // Wait for auth state to resolve if productId is present
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
    // let loadedSelectedVariationIds: string[] = []; // For future use

    if (user) {
      const localStorageKey = `cstmzr_product_options_${user.id}_${productId}`;
      try {
        const savedOptions = localStorage.getItem(localStorageKey);
        if (savedOptions) {
          const parsedOptions = JSON.parse(savedOptions) as LocalStorageCustomizerOptions;
          loadedViews = parsedOptions.views || [];
          // loadedSelectedVariationIds = parsedOptions.cstmzrSelectedVariationIds || [];
        }
      } catch (e) {
        console.warn("Customizer: Error parsing CSTMZR options from localStorage:", e);
        toast({ title: "Local Settings Error", description: "Could not load saved CSTMZR settings for this product. Using defaults.", variant: "info"});
      }
    } else {
        console.info("Customizer: No CSTMZR user logged in. Views will default.");
    }

    const finalViews = loadedViews.length > 0 ? loadedViews : [
      { // Default view if none saved for this product from Product Options page
        id: `default_view_wc_${wcProduct.id}`,
        name: "Front View",
        imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : defaultFallbackProduct.views[0].imageUrl,
        aiHint: wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : defaultFallbackProduct.views[0].aiHint,
        boundaryBoxes: defaultFallbackProduct.views[0].boundaryBoxes, // Default boundary boxes for the default view
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


  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading customizer...</p>
      </div>
    );
  }
  
  const activeViewData = productDetails?.views.find(v => v.id === activeViewId);
  
  // Determine current product/view details for DesignCanvas, falling back to defaultFallbackProduct if needed
  const currentProductImage = activeViewData?.imageUrl || defaultFallbackProduct.views[0].imageUrl;
  const currentProductAlt = activeViewData?.name || defaultFallbackProduct.views[0].name;
  const currentProductAiHint = activeViewData?.aiHint || defaultFallbackProduct.views[0].aiHint;
  const currentBoundaryBoxes = activeViewData?.boundaryBoxes || defaultFallbackProduct.views[0].boundaryBoxes;
  const currentProductName = productDetails?.name || defaultFallbackProduct.name;


  if (error && !productDetails) { // Show specific error page if product load fails critically
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
      <SidebarProvider defaultOpen>
        <div className="flex min-h-svh w-full">
          <Sidebar className="h-full shadow-md">
            <LeftPanel />
          </Sidebar>
          
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <AppHeader />
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center"> 
                {error && productDetails?.id === defaultFallbackProduct.id && ( // Show non-blocking error as toast or small message
                   <div className="w-full max-w-4xl p-3 mb-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm">
                     <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} Using default product view.
                   </div>
                )}
                <DesignCanvas 
                  productImageUrl={currentProductImage}
                  productImageAlt={`${currentProductName} - ${currentProductAlt}`}
                  productImageAiHint={currentProductAiHint}
                  productDefinedBoundaryBoxes={currentBoundaryBoxes}
                />
                {/* View Thumbnails Section */}
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
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UploadProvider>
  );
}

