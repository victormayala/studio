
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
import Link from 'next/link';
import type { WCCustomProduct } from '@/types/woocommerce';
import { useToast } from '@/hooks/use-toast';

// Interface for boundary boxes (consistent with options page)
interface BoundaryBox {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Interface for options loaded from localStorage (consistent with options page)
interface LocalStorageCustomizerOptions {
  boundaryBoxes: BoundaryBox[];
  cstmzrSelectedVariationIds: string[]; // We'll load this, though not actively used in canvas yet
}

// Combined product data structure for the customizer
interface ProductForCustomizer {
  id: string;
  name: string;
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
  // Add other relevant fields if needed, e.g., selectedVariationIds
}

const defaultFallbackProduct: ProductForCustomizer = {
  id: 'fallback_product',
  name: 'Product Customizer (Default)',
  imageUrl: 'https://placehold.co/700x700.png',
  aiHint: 'product mockup',
  boundaryBoxes: [
    { id: 'fallback_area_1', name: 'Default Area', x: 25, y: 25, width: 50, height: 50 },
  ],
};

export default function CustomizerPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [productDetails, setProductDetails] = useState<ProductForCustomizer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stripHtml = (html: string): string => {
    if (typeof window === 'undefined') return html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const loadCustomizerData = useCallback(async () => {
    if (!productId) {
      setError("No product ID provided. Displaying default customizer.");
      setProductDetails(defaultFallbackProduct);
      setIsLoading(false);
      return;
    }

    if (authLoading) {
      // Wait for auth state to resolve if productId is present
      return;
    }

    setIsLoading(true);
    setError(null);

    let wcProduct: WCCustomProduct | undefined;
    let fetchError: string | undefined;
    let userCredentials;

    // Attempt to get user-specific WooCommerce credentials from localStorage
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
        // Proceed without user credentials, will fallback to global
      }
    }
    
    ({ product: wcProduct, error: fetchError } = await fetchWooCommerceProductById(productId, userCredentials));

    if (fetchError || !wcProduct) {
      setError(fetchError || `Failed to load product (ID: ${productId}). Displaying default.`);
      setProductDetails(defaultFallbackProduct);
      setIsLoading(false);
      toast({ title: "Product Load Error", description: fetchError || `Product ${productId} not found.`, variant: "destructive"});
      return;
    }

    let loadedBoundaryBoxes: BoundaryBox[] = [];
    // let loadedSelectedVariationIds: string[] = []; // For future use

    if (user) {
      const localStorageKey = `cstmzr_product_options_${user.id}_${productId}`;
      try {
        const savedOptions = localStorage.getItem(localStorageKey);
        if (savedOptions) {
          const parsedOptions = JSON.parse(savedOptions) as LocalStorageCustomizerOptions;
          loadedBoundaryBoxes = parsedOptions.boundaryBoxes || [];
          // loadedSelectedVariationIds = parsedOptions.cstmzrSelectedVariationIds || [];
        }
      } catch (e) {
        console.warn("Customizer: Error parsing CSTMZR options from localStorage:", e);
        toast({ title: "Local Settings Error", description: "Could not load saved CSTMZR settings for this product. Using defaults.", variant: "info"});
      }
    } else {
        // If no user is logged into CSTMZR, we might not load any specific boundary boxes
        // or we could define a default set if that's desired for guest users.
        // For now, it will default to empty if no user.
        console.info("Customizer: No CSTMZR user logged in. Boundary boxes will default to empty unless globally defined for product.");
    }

    const plainTextDescription = stripHtml(wcProduct.description || wcProduct.short_description || '');

    setProductDetails({
      id: wcProduct.id.toString(),
      name: wcProduct.name || `Product ${productId}`,
      imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : 'https://placehold.co/700x700.png',
      aiHint: wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : 'product image',
      boundaryBoxes: loadedBoundaryBoxes.length > 0 ? loadedBoundaryBoxes : defaultFallbackProduct.boundaryBoxes, // Fallback boundary if none loaded
      // description: plainTextDescription, // Could be added if needed by customizer UI
    });

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

  const currentProduct = productDetails || defaultFallbackProduct;

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
              <main className="flex-1 overflow-y-auto"> 
                {error && productDetails === defaultFallbackProduct && ( // Show non-blocking error as toast or small message
                   <div className="p-4 m-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm">
                     <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} Using default product view.
                   </div>
                )}
                <DesignCanvas 
                  productImageUrl={currentProduct.imageUrl}
                  productImageAlt={currentProduct.name}
                  productImageAiHint={currentProduct.aiHint}
                  productDefinedBoundaryBoxes={currentProduct.boundaryBoxes}
                />
              </main>
              <RightPanel /> 
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UploadProvider>
  );
}

