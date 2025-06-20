
"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider, useUploads } from "@/contexts/UploadContext";
import { fetchWooCommerceProductById, fetchWooCommerceProductVariations, type WooCommerceCredentials } from '@/app/actions/woocommerceActions';
import type { ProductOptionsFirestoreData } from '@/app/dashboard/products/[productId]/options/page';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage as firebaseStorage } from '@/lib/firebase'; 
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'; 
import { doc, getDoc } from 'firebase/firestore';
import type { UserWooCommerceCredentials } from '@/app/actions/userCredentialsActions';
import {
  Loader2, AlertTriangle, ShoppingCart, UploadCloud, Layers, Type, Shapes as ShapesIconLucide, Smile, Palette, Gem as GemIcon, Settings2 as SettingsIcon,
  PanelLeftClose, PanelRightOpen, PanelRightClose, PanelLeftOpen, Sparkles, Ban, Camera, Eye
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import Link from 'next/link';
import NextImage from 'next/image'; 
import type { WCCustomProduct, WCVariation, WCVariationAttribute } from '@/types/woocommerce';
import { useToast } from '@/hooks/use-toast';
import CustomizerIconNav, { type CustomizerTool } from '@/components/customizer/CustomizerIconNav';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

import UploadArea from '@/components/customizer/UploadArea';
import LayersPanel from '@/components/customizer/LayersPanel';
import TextToolPanel from '@/components/customizer/TextToolPanel';
import ShapesPanel from '@/components/customizer/ShapesPanel';
import ClipartPanel from '@/components/customizer/ClipartPanel';
import FreeDesignsPanel from '@/components/customizer/FreeDesignsPanel';
import PremiumDesignsPanel from '@/components/customizer/PremiumDesignsPanel';
import VariantSelector from '@/components/customizer/VariantSelector';
import AiAssistant from '@/components/customizer/AiAssistant';

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
  price?: number;
}

interface ColorGroupOptionsForCustomizer {
  selectedVariationIds: string[];
  variantViewImages: Record<string, { imageUrl: string; aiHint?: string }>;
}

interface LoadedCustomizerOptions {
  defaultViews: ProductView[];
  optionsByColor: Record<string, ColorGroupOptionsForCustomizer>;
  groupingAttributeName: string | null;
  allowCustomization?: boolean;
}

export interface ProductForCustomizer {
  id: string;
  name: string;
  basePrice: number;
  views: ProductView[];
  type?: 'simple' | 'variable' | 'grouped' | 'external';
  allowCustomization?: boolean;
  meta?: {
    proxyUsed?: boolean;
    configUserIdUsed?: string | null;
  };
}

export interface ConfigurableAttribute {
  name: string;
  options: string[];
}

interface ViewScreenshot {
  viewId: string;
  viewName: string;
  imageDataUrl: string;
}

const defaultFallbackProduct: ProductForCustomizer = {
  id: 'fallback_product',
  name: 'Product Customizer (Default)',
  basePrice: 25.00,
  views: [
    {
      id: 'fallback_view_1',
      name: 'Front View',
      imageUrl: 'https://placehold.co/700x700.png',
      aiHint: 'product mockup',
      boundaryBoxes: [
        { id: 'fallback_area_1', name: 'Default Area', x: 25, y: 25, width: 50, height: 50 },
      ],
      price: 0,
    }
  ],
  type: 'simple',
  allowCustomization: true,
  meta: { proxyUsed: false, configUserIdUsed: null },
};

const toolItems: CustomizerTool[] = [
  { id: "layers", label: "Layers", icon: Layers },
  { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "text", label: "Text", icon: Type },
  { id: "shapes", label: "Shapes", icon: ShapesIconLucide },
  { id: "clipart", label: "Clipart", icon: Smile },
  { id: "free-designs", label: "Free Designs", icon: Palette },
  { id: "premium-designs", label: "Premium Designs", icon: GemIcon },
];

async function loadProductOptionsFromFirestore(
  userIdForOptions: string,
  productId: string
): Promise<{ options?: ProductOptionsFirestoreData; error?: string }> {
  if (!userIdForOptions || !productId || !db) {
    const message = 'User/Config ID, Product ID, or DB service is missing for loading options.';
    console.warn(`loadProductOptionsFromFirestore: ${message}`);
    return { error: message };
  }
  try {
    const docRef = doc(db, 'userProductOptions', userIdForOptions, 'products', productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { options: docSnap.data() as ProductOptionsFirestoreData };
    }
    return { options: undefined };
  } catch (error: any) {
    let detailedError = `Failed to load options from cloud: ${error.message}`;
    if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        detailedError += " This is likely a Firestore security rule issue. Ensure public read access is configured for userProductOptions/{configUserId}/products/{productId} if using configUserId, or that the current user has permission.";
    }
    console.error(`loadProductOptionsFromFirestore: Error loading product options from Firestore for user/config ${userIdForOptions}, product ${productId}:`, detailedError, error);
    return { error: detailedError };
  }
}


function CustomizerLayoutAndLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const viewMode = useMemo(() => searchParams.get('viewMode'), [searchParams]);
  const isEmbedded = useMemo(() => viewMode === 'embedded', [viewMode]);
  const productIdFromUrl = useMemo(() => searchParams.get('productId'), [searchParams]);
  const wpApiBaseUrlFromUrl = useMemo(() => searchParams.get('wpApiBaseUrl'), [searchParams]);
  const configUserIdFromUrl = useMemo(() => searchParams.get('configUserId'), [searchParams]);

  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { canvasImages, canvasTexts, canvasShapes, selectCanvasImage, selectCanvasText, selectCanvasShape } = useUploads();

  const [productDetails, setProductDetails] = useState<ProductForCustomizer | null>(null);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>(toolItems[0]?.id || "layers");
  const [showGrid, setShowGrid] = useState(false);
  const [showBoundaryBoxes, setShowBoundaryBoxes] = useState(true);

  const [isToolPanelOpen, setIsToolPanelOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const [productVariations, setProductVariations] = useState<WCVariation[] | null>(null);
  const [configurableAttributes, setConfigurableAttributes] = useState<ConfigurableAttribute[] | null>(null);
  const [selectedVariationOptions, setSelectedVariationOptions] = useState<Record<string, string>>({});

  const [loadedOptionsByColor, setLoadedOptionsByColor] = useState<Record<string, ColorGroupOptionsForCustomizer> | null>(null);
  const [loadedGroupingAttributeName, setLoadedGroupingAttributeName] = useState<string | null>(null);
  const [viewBaseImages, setViewBaseImages] = useState<Record<string, {url: string, aiHint?: string, price?: number}>>({});
  const [totalCustomizationPrice, setTotalCustomizationPrice] = useState<number>(0);

  const [hasCanvasElements, setHasCanvasElements] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [onConfirmLeaveAction, setOnConfirmLeaveAction] = useState<(() => void) | null>(null);

  const lastLoadedProductIdRef = useRef<string | null | undefined>(undefined);
  const lastLoadedProxyUrlRef = useRef<string | null | undefined>(undefined);
  const lastLoadedConfigUserIdRef = useRef<string | null | undefined>(undefined);
  const originalActiveViewIdBeforePreviewRef = useRef<string | null>(null);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [viewScreenshots, setViewScreenshots] = useState<ViewScreenshot[]>([]);
  const [primaryScreenshotForUpload, setPrimaryScreenshotForUpload] = useState<string | null>(null);


  useEffect(() => {
    const anyElementsExist = canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0;
    setHasCanvasElements(anyElementsExist);
  }, [canvasImages, canvasTexts, canvasShapes]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasCanvasElements && !isEmbedded) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasCanvasElements, isEmbedded]);

  useEffect(() => {
    const handleAttemptClose = () => {
      if (hasCanvasElements && !isEmbedded) {
        setOnConfirmLeaveAction(() => () => {
          if (user) router.push('/dashboard');
          else router.push('/');
        });
        setIsLeaveConfirmOpen(true);
      } else if (!isEmbedded) {
        if (user) router.push('/dashboard');
        else router.push('/');
      }
    };
    const eventListener = () => handleAttemptClose();
    window.addEventListener('attemptCloseCustomizer', eventListener);
    return () => window.removeEventListener('attemptCloseCustomizer', eventListener);
  }, [hasCanvasElements, router, user, isEmbedded]);

  const toggleGrid = useCallback(() => setShowGrid(prev => !prev), []);
  const toggleBoundaryBoxes = useCallback(() => setShowBoundaryBoxes(prev => !prev), []);
  const toggleToolPanel = useCallback(() => setIsToolPanelOpen(prev => !prev), []);
  const toggleRightSidebar = useCallback(() => setIsRightSidebarOpen(prev => !prev), []);

  const handleVariantOptionSelect = useCallback((attributeName: string, optionValue: string) => {
    setSelectedVariationOptions(prev => ({ ...prev, [attributeName]: optionValue }));
  }, []);


  const loadCustomizerData = useCallback(async (productIdToLoad: string | null, wpApiBaseUrlToUse: string | null, configUserIdToUse: string | null) => {
    const currentProductId = productDetails?.id;
    const currentProxyStatus = productDetails?.meta?.proxyUsed ?? false;
    const currentConfigUserIdUsed = productDetails?.meta?.configUserIdUsed ?? null;

    if (currentProductId !== productIdToLoad || currentProxyStatus !== !!wpApiBaseUrlToUse || currentConfigUserIdUsed !== configUserIdToUse) {
        setProductDetails(null);
        setProductVariations(null);
        setConfigurableAttributes(null);
        setSelectedVariationOptions({});
        setViewBaseImages({});
        setLoadedOptionsByColor(null);
        setLoadedGroupingAttributeName(null);
        setTotalCustomizationPrice(0);
        setActiveViewId(null);
    }
    setIsLoading(true);
    setError(null);

    const metaForProduct = { proxyUsed: !!wpApiBaseUrlToUse, configUserIdUsed: configUserIdToUse };

    if (!productIdToLoad && !wpApiBaseUrlToUse) {
      setError("No product ID provided. Displaying default customizer.");
      const defaultViews = defaultFallbackProduct.views;
      const baseImagesMap: Record<string, {url: string, aiHint?: string, price?: number}> = {};
      defaultViews.forEach(view => { baseImagesMap[view.id] = { url: view.imageUrl, aiHint: view.aiHint, price: view.price ?? 0 }; });
      setViewBaseImages(baseImagesMap);
      setProductDetails({...defaultFallbackProduct, meta: metaForProduct});
      setActiveViewId(defaultViews[0]?.id || null);
      setIsLoading(false);
      return;
    }

    if (!productIdToLoad && wpApiBaseUrlToUse) {
      setError("Product ID is missing. Displaying default customizer.");
      const defaultViewsError = defaultFallbackProduct.views;
      const baseImagesMapError: Record<string, {url: string, aiHint?: string, price?: number}> = {};
      defaultViewsError.forEach(view => { baseImagesMapError[view.id] = { url: view.imageUrl, aiHint: view.aiHint, price: view.price ?? 0 }; });
      setViewBaseImages(baseImagesMapError);
      setProductDetails({...defaultFallbackProduct, meta: metaForProduct});
      setActiveViewId(defaultViewsError[0]?.id || null);
      setIsLoading(false);
      return;
    }

    if (!productIdToLoad) {
        setError("Invalid state: Product ID became null unexpectedly. Displaying default.");
        setProductDetails({...defaultFallbackProduct, meta: metaForProduct});
        setActiveViewId(defaultFallbackProduct.views[0]?.id || null);
        setIsLoading(false);
        return;
    }

    if (authLoading && !user?.uid && !wpApiBaseUrlToUse && !configUserIdToUse) {
      setIsLoading(false);
      return;
    }

    let wcProduct: WCCustomProduct | undefined;
    let fetchError: string | undefined;
    let userWCCredentialsToUse: WooCommerceCredentials | undefined;

    const shouldLoadUserDirectCredentials = user?.uid && !wpApiBaseUrlToUse && (!configUserIdToUse || !isEmbedded);

    if (shouldLoadUserDirectCredentials) {
      try {
        const credDocRef = doc(db, 'userWooCommerceCredentials', user.uid!);
        const credDocSnap = await getDoc(credDocRef);
        if (credDocSnap.exists()) {
          const credData = credDocSnap.data() as UserWooCommerceCredentials;
          userWCCredentialsToUse = { storeUrl: credData.storeUrl, consumerKey: credData.consumerKey, consumerSecret: credData.consumerSecret };
        } else if (!isEmbedded) {
          let message = "WooCommerce API credentials are not configured. Please connect your store in the 'Store Integration' section.";
           setError(message + " Using default product view.");
          const defaultViewsError = defaultFallbackProduct.views;
          const baseImagesMapError: Record<string, {url: string, aiHint?: string, price?: number}> = {};
          defaultViewsError.forEach(view => { baseImagesMapError[view.id] = { url: view.imageUrl, aiHint: view.aiHint, price: view.price ?? 0 }; });
          setViewBaseImages(baseImagesMapError);
          setProductDetails({...defaultFallbackProduct, meta: metaForProduct});
          setActiveViewId(defaultViewsError[0]?.id || null);
          setConfigurableAttributes([]); setSelectedVariationOptions({}); setIsLoading(false);
          toast({ title: "WooCommerce Connection Note", description: "No saved WooCommerce credentials for this user.", variant: "default" });
          return;
        }
      } catch (credError: any) {
        if (!isEmbedded) toast({ title: "WooCommerce Connection Error", description: credError.message || "Could not load your WooCommerce store credentials.", variant: "destructive" });
      }
    }

    ({ product: wcProduct, error: fetchError } = await fetchWooCommerceProductById(productIdToLoad, userWCCredentialsToUse, wpApiBaseUrlToUse || undefined));

    if (fetchError || !wcProduct) {
      let displayError = fetchError || `Failed to load product (ID: ${productIdToLoad}).`;
      if (isEmbedded && wpApiBaseUrlToUse && (fetchError?.includes("credentials are not configured") || fetchError?.includes("required."))) {
          displayError = `This product customizer (ID: ${productIdToLoad}) could not load data using the provided proxy. The embedding site might need to configure its connection or API proxy with Customizer Studio. Original error: ${fetchError}`;
      } else if (isEmbedded && wpApiBaseUrlToUse && fetchError) {
          if (fetchError.includes("Status: 403") || fetchError.includes("Invalid Origin")) {
            displayError = `Failed to load product (ID: ${productIdToLoad}) via WordPress proxy. Access was forbidden (403). This often indicates a CORS or plugin configuration issue on your WordPress site. Please ensure the Customizer Studio plugin is configured correctly (Allowed Origins, User ID), and check REST API security and server logs. Original error: ${fetchError}`;
          } else {
            displayError = `Failed to load product (ID: ${productIdToLoad}) via WordPress proxy. Please ensure the Customizer Studio plugin is configured correctly on your WordPress site. Original error: ${fetchError}`;
          }
      } else if (isEmbedded && !wpApiBaseUrlToUse && !configUserIdToUse && (fetchError?.includes("credentials are not configured") || fetchError?.includes("User-specific WooCommerce credentials are required."))) {
          displayError = `This product customizer (ID: ${productIdToLoad}) requires an API proxy from the embedding site, or the site needs user credentials. Original error: ${fetchError}`;
      } else if (user?.uid && !wpApiBaseUrlToUse && !configUserIdToUse && (fetchError?.includes("credentials are not configured") || fetchError?.includes("User-specific WooCommerce credentials are required"))) {
          displayError = `WooCommerce API credentials are not configured for your account. Please connect your store in the Dashboard > 'Store Integration' section.`;
      } else if (!user?.uid && !wpApiBaseUrlToUse && !configUserIdToUse && (fetchError?.includes("credentials are not configured") || fetchError?.includes("User-specific WooCommerce credentials are required"))) {
        displayError = "WooCommerce API credentials missing. Cannot load product details.";
      }


      setError(displayError + " Displaying default customizer view.");
      const defaultViewsError = defaultFallbackProduct.views;
      const baseImagesMapError: Record<string, {url: string, aiHint?: string, price?: number}> = {};
      defaultViewsError.forEach(view => { baseImagesMapError[view.id] = { url: view.imageUrl, aiHint: view.aiHint, price: view.price ?? 0 }; });
      setViewBaseImages(baseImagesMapError);
      setProductDetails({...defaultFallbackProduct, meta: metaForProduct});
      setActiveViewId(defaultViewsError[0]?.id || null);
      setConfigurableAttributes([]); setSelectedVariationOptions({}); setIsLoading(false);
      if (!isEmbedded && user?.uid && !configUserIdToUse && !wpApiBaseUrlToUse) toast({ title: "Product Load Error", description: fetchError || `Product ${productIdToLoad} not found.`, variant: "destructive"});
      return;
    }

    let finalDefaultViews: ProductView[] = [];
    let tempLoadedOptionsByColor: Record<string, ColorGroupOptionsForCustomizer> | null = null;
    let tempLoadedGroupingAttributeName: string | null = null;
    let firestoreOptions: ProductOptionsFirestoreData | undefined;
    let finalAllowCustomization: boolean = true;

    const userIdForFirestoreOptions = configUserIdToUse || user?.uid;

    if (userIdForFirestoreOptions) {
      const { options, error: firestoreLoadError } = await loadProductOptionsFromFirestore(userIdForFirestoreOptions, productIdToLoad);
      if (firestoreLoadError) {
        console.warn(`Customizer: Error loading options from Firestore for user/config ${userIdForFirestoreOptions}:`, firestoreLoadError);
        if (!isEmbedded || (isEmbedded && !configUserIdToUse && user?.uid)) {
            let toastMessage = "Could not load saved Customizer Studio settings. Using product defaults.";
            if (firestoreLoadError.includes("Missing or insufficient permissions") || firestoreLoadError.includes("security rule issue")) {
                toastMessage = "Cannot load saved settings due to permissions. Check Firestore rules. Using product defaults.";
            }
            toast({ title: "Settings Load Issue", description: toastMessage, variant: "default"});
        }
      }
      firestoreOptions = options;
    }

    if (firestoreOptions) {
        if (Array.isArray(firestoreOptions.defaultViews) && firestoreOptions.defaultViews.length > 0) {
            finalDefaultViews = firestoreOptions.defaultViews.map(v => ({...v, price: v.price ?? 0}));
        }
        tempLoadedOptionsByColor = firestoreOptions.optionsByColor || {};
        tempLoadedGroupingAttributeName = firestoreOptions.groupingAttributeName || null;
        finalAllowCustomization = firestoreOptions.allowCustomization !== undefined ? firestoreOptions.allowCustomization : true;
    }

    if (finalDefaultViews.length === 0) {
      finalDefaultViews = [{
        id: `default_view_wc_${wcProduct.id}`, name: "Front View",
        imageUrl: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : defaultFallbackProduct.views[0].imageUrl,
        aiHint: wcProduct.images && wcProduct.images.length > 0 && wcProduct.images[0].alt ? wcProduct.images[0].alt.split(" ").slice(0,2).join(" ") : defaultFallbackProduct.views[0].aiHint,
        boundaryBoxes: defaultFallbackProduct.views[0].boundaryBoxes, price: defaultFallbackProduct.views[0].price ?? 0,
      }];
      tempLoadedOptionsByColor = {};
      tempLoadedGroupingAttributeName = null;
      if (userIdForFirestoreOptions && !firestoreOptions) {
        if ((!isEmbedded && user?.uid) || (isEmbedded && !configUserIdToUse && user?.uid)) {
          toast({ title: "No Saved Settings", description: `No Customizer Studio settings found for this product (ID: ${productIdToLoad}). Using default view.`, variant: "default" });
        } else if (isEmbedded && configUserIdToUse) {
           console.warn(`Customizer: No Firestore settings found for configUserId ${configUserIdToUse} and product ${productIdToLoad}. Using default view.`);
        }
      }
    }

    if (!finalAllowCustomization) {
        setError(`Customization for product "${wcProduct.name}" is currently disabled by the store owner.`);
        setProductDetails({
            id: wcProduct.id.toString(), name: wcProduct.name || `Product ${productIdToLoad}`,
            basePrice: parseFloat(wcProduct.price || wcProduct.regular_price || '0'),
            views: finalDefaultViews, type: wcProduct.type, allowCustomization: false, meta: metaForProduct,
        });
        setActiveViewId(finalDefaultViews[0]?.id || null);
        setIsLoading(false);
        return;
    }

    setLoadedOptionsByColor(tempLoadedOptionsByColor);
    setLoadedGroupingAttributeName(tempLoadedGroupingAttributeName);

    const baseImagesMapFinal: Record<string, {url: string, aiHint?: string, price?:number}> = {};
    finalDefaultViews.forEach(view => { baseImagesMapFinal[view.id] = { url: view.imageUrl, aiHint: view.aiHint, price: view.price ?? 0 }; });
    setViewBaseImages(baseImagesMapFinal);
    const productBasePrice = parseFloat(wcProduct.price || wcProduct.regular_price || '0');

    setProductDetails({
      id: wcProduct.id.toString(), name: wcProduct.name || `Product ${productIdToLoad}`, basePrice: productBasePrice,
      views: finalDefaultViews, type: wcProduct.type, allowCustomization: finalAllowCustomization, meta: metaForProduct,
    });
    setActiveViewId(finalDefaultViews[0]?.id || null);

    if (wcProduct.type === 'variable') {
      const { variations: fetchedVariations, error: variationsError } = await fetchWooCommerceProductVariations(productIdToLoad, userWCCredentialsToUse, wpApiBaseUrlToUse || undefined);
      if (variationsError) {
        if (!isEmbedded || (user?.uid && !wpApiBaseUrlToUse && !configUserIdToUse)) toast({ title: "Variations Load Error", description: variationsError, variant: "destructive" });
        setProductVariations(null); setConfigurableAttributes([]); setSelectedVariationOptions({});
      } else if (fetchedVariations && fetchedVariations.length > 0) {
        setProductVariations(fetchedVariations);
        const attributesMap: Record<string, Set<string>> = {};
        fetchedVariations.forEach(variation => variation.attributes.forEach(attr => {
          if (!attributesMap[attr.name]) attributesMap[attr.name] = new Set();
          attributesMap[attr.name].add(attr.option);
        }));
        const allConfigurableAttributes: ConfigurableAttribute[] = Object.entries(attributesMap).map(([name, optionsSet]) => ({ name, options: Array.from(optionsSet) }));
        setConfigurableAttributes(allConfigurableAttributes);
        if (allConfigurableAttributes.length > 0) {
          const initialSelectedOptions: Record<string, string> = {};
          allConfigurableAttributes.forEach(attr => { if (attr.options.length > 0) initialSelectedOptions[attr.name] = attr.options[0]; });
          setSelectedVariationOptions(initialSelectedOptions);
        } else setSelectedVariationOptions({});
      } else { setProductVariations(null); setConfigurableAttributes([]); setSelectedVariationOptions({}); }
    } else { setProductVariations(null); setConfigurableAttributes([]); setSelectedVariationOptions({}); }
    setIsLoading(false);
  }, [user?.uid, authLoading, toast, isEmbedded, productDetails]);


  useEffect(() => {
    const targetProductId = productIdFromUrl || null;
    const targetProxyUrl = wpApiBaseUrlFromUrl || null;
    const targetConfigUserId = configUserIdFromUrl || null;

    if (authLoading && !user && !targetProxyUrl && !targetConfigUserId) {
        if (lastLoadedProductIdRef.current === undefined) {
            loadCustomizerData(null, null, null);
            lastLoadedProductIdRef.current = null;
            lastLoadedProxyUrlRef.current = null;
            lastLoadedConfigUserIdRef.current = null;
        }
        return;
    }

    if (
        (lastLoadedProductIdRef.current !== targetProductId ||
        lastLoadedProxyUrlRef.current !== targetProxyUrl ||
        lastLoadedConfigUserIdRef.current !== targetConfigUserId) ||
        !productDetails
    ) {
        loadCustomizerData(targetProductId, targetProxyUrl, targetConfigUserId);
        lastLoadedProductIdRef.current = targetProductId;
        lastLoadedProxyUrlRef.current = targetProxyUrl;
        lastLoadedConfigUserIdRef.current = targetConfigUserId;
    }
  }, [
      authLoading,
      user,
      productIdFromUrl,
      wpApiBaseUrlFromUrl,
      configUserIdFromUrl,
      loadCustomizerData,
      productDetails
  ]);


 useEffect(() => {
    setProductDetails(prevProductDetails => {
      if (!prevProductDetails || !viewBaseImages) return prevProductDetails;
      if (prevProductDetails.type === 'variable' && !productVariations && Object.keys(selectedVariationOptions).length > 0) return prevProductDetails;

      const matchingVariation = prevProductDetails.type === 'variable' && productVariations ? productVariations.find(variation => {
        if (Object.keys(selectedVariationOptions).length === 0 && configurableAttributes && configurableAttributes.length > 0) return false;
        return variation.attributes.every(attr => selectedVariationOptions[attr.name] === attr.option);
      }) : null;

      let primaryVariationImageSrc: string | null = null;
      let primaryVariationImageAiHint: string | undefined = undefined;
      if (matchingVariation?.image?.src) {
        primaryVariationImageSrc = matchingVariation.image.src;
        primaryVariationImageAiHint = matchingVariation.image.alt?.split(" ").slice(0, 2).join(" ") || undefined;
      }

      let currentColorKey: string | null = null;
      if (loadedGroupingAttributeName && selectedVariationOptions[loadedGroupingAttributeName]) {
        currentColorKey = selectedVariationOptions[loadedGroupingAttributeName];
      }
      const currentVariantViewImages = currentColorKey && loadedOptionsByColor ? loadedOptionsByColor[currentColorKey]?.variantViewImages : null;

      let viewsContentActuallyChanged = false;
      const updatedViews = prevProductDetails.views.map(view => {
        let finalImageUrl: string | undefined = undefined;
        let finalAiHint: string | undefined = undefined;
        const baseImageInfo = viewBaseImages[view.id];
        const baseImageUrl = baseImageInfo?.url || defaultFallbackProduct.views[0].imageUrl;
        const baseAiHint = baseImageInfo?.aiHint || defaultFallbackProduct.views[0].aiHint;

        if (currentVariantViewImages && currentVariantViewImages[view.id]?.imageUrl) {
          finalImageUrl = currentVariantViewImages[view.id].imageUrl;
          finalAiHint = currentVariantViewImages[view.id].aiHint || baseAiHint;
        } else if (primaryVariationImageSrc && view.id === activeViewId) {
          finalImageUrl = primaryVariationImageSrc;
          finalAiHint = primaryVariationImageAiHint || baseAiHint;
        } else {
          finalImageUrl = baseImageUrl;
          finalAiHint = baseAiHint;
        }

        if (view.imageUrl !== finalImageUrl || view.aiHint !== finalAiHint || (view.price ?? 0) !== (baseImageInfo?.price ?? view.price ?? 0)) {
          viewsContentActuallyChanged = true;
        }
        return { ...view, imageUrl: finalImageUrl!, aiHint: finalAiHint, price: baseImageInfo?.price ?? view.price ?? 0 };
      });

      const basePriceChanged = prevProductDetails.basePrice !== (matchingVariation ? parseFloat(matchingVariation.price || '0') : prevProductDetails.basePrice);

      if (!viewsContentActuallyChanged && !basePriceChanged) {
        return prevProductDetails;
      }
      return { ...prevProductDetails, views: updatedViews, basePrice: matchingVariation ? parseFloat(matchingVariation.price || '0') : prevProductDetails.basePrice };
    });
  }, [
    selectedVariationOptions, productVariations, activeViewId, viewBaseImages,
    loadedOptionsByColor, loadedGroupingAttributeName, configurableAttributes
  ]);

  useEffect(() => {
    const usedViewIdsWithElements = new Set<string>();
    canvasImages.forEach(item => { if (item.viewId) usedViewIdsWithElements.add(item.viewId); });
    canvasTexts.forEach(item => { if (item.viewId) usedViewIdsWithElements.add(item.viewId); });
    canvasShapes.forEach(item => { if (item.viewId) usedViewIdsWithElements.add(item.viewId); });
    const viewsToPrice = new Set<string>(usedViewIdsWithElements);
    if (activeViewId) viewsToPrice.add(activeViewId);

    let viewSurcharges = 0;
    if (productDetails?.views) {
      viewsToPrice.forEach(viewId => {
        const view = productDetails.views.find(v => v.id === viewId);
        viewSurcharges += view?.price ?? 0;
      });
    }
    const basePrice = productDetails?.basePrice ?? 0;
    setTotalCustomizationPrice(basePrice + viewSurcharges);
  }, [canvasImages, canvasTexts, canvasShapes, productDetails?.views, productDetails?.basePrice, activeViewId]);

  const getToolPanelTitle = (toolId: string): string => {
    const tool = toolItems.find(item => item.id === toolId);
    return tool ? tool.label : "Design Tool";
  };

  const renderActiveToolPanelContent = () => {
     if (!activeViewId && (activeTool !== "layers" && activeTool !== "ai-assistant")) {
       return (
         <div className="p-4 text-center text-muted-foreground flex flex-col items-center justify-center">
           <SettingsIcon className="w-12 h-12 mb-4 text-muted-foreground/50" />
           <h3 className="text-lg font-semibold mb-1">Select a View</h3>
           <p className="text-sm">Please select a product view before adding elements.</p>
         </div>
       );
    }
    switch (activeTool) {
      case "layers": return <LayersPanel activeViewId={activeViewId} />;
      case "ai-assistant": return <AiAssistant activeViewId={activeViewId} />;
      case "uploads": return <UploadArea activeViewId={activeViewId} />;
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

  const generatePreviewsAndOpenModal = async () => {
    if (!productDetails) return;
    selectCanvasImage(null); selectCanvasText(null); selectCanvasShape(null);

    setIsGeneratingPreviews(true);
    setIsConfirmationModalOpen(true);
    setViewScreenshots([]); 
    setPrimaryScreenshotForUpload(null);

    const captureTargetElement = document.getElementById('product-image-canvas-area-capture-target');
    const cropToElement = document.getElementById('design-canvas-square-area');
    const currentActiveView = activeViewId;
    originalActiveViewIdBeforePreviewRef.current = currentActiveView;

    if (captureTargetElement && cropToElement && currentActiveView) {
      try {
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

        const cropRect = cropToElement.getBoundingClientRect();
        const targetRect = captureTargetElement.getBoundingClientRect();

        const captureWidth = cropRect.width;
        const captureHeight = cropRect.height;
        const captureX = cropRect.left - targetRect.left;
        const captureY = cropRect.top - targetRect.top;

        const fullCanvas = await html2canvas(captureTargetElement, {
          allowTaint: true, useCORS: true, backgroundColor: null, logging: false,
        });
        
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = captureWidth;
        croppedCanvas.height = captureHeight;
        const ctx = croppedCanvas.getContext('2d');
        
        if (ctx) {
            ctx.drawImage(
                fullCanvas,
                captureX, captureY, captureWidth, captureHeight,
                0, 0, captureWidth, captureHeight
            );
            setPrimaryScreenshotForUpload(croppedCanvas.toDataURL('image/png'));
        } else {
           throw new Error("Could not get 2D context for cropping canvas");
        }
      } catch (error) {
        console.error("Error generating primary screenshot:", error);
        toast({ title: "Screenshot Failed", description: "Could not generate initial preview.", variant: "destructive" });
      }
    }

    const tempScreenshots: ViewScreenshot[] = [];
    for (const view of productDetails.views) {
      const hasCustomizations =
        canvasImages.some(item => item.viewId === view.id) ||
        canvasTexts.some(item => item.viewId === view.id) ||
        canvasShapes.some(item => item.viewId === view.id);

      if (hasCustomizations) {
        setActiveViewId(view.id);
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 200))); 
        
        if (captureTargetElement && cropToElement) {
          try {
            const cropRect = cropToElement.getBoundingClientRect();
            const targetRect = captureTargetElement.getBoundingClientRect();

            const captureWidth = cropRect.width;
            const captureHeight = cropRect.height;
            const captureX = cropRect.left - targetRect.left;
            const captureY = cropRect.top - targetRect.top;

            const fullCanvas = await html2canvas(captureTargetElement, {
                allowTaint: true, useCORS: true, backgroundColor: null, logging: false,
            });

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = captureWidth;
            croppedCanvas.height = captureHeight;
            const ctx = croppedCanvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(fullCanvas, captureX, captureY, captureWidth, captureHeight, 0, 0, captureWidth, captureHeight);
                tempScreenshots.push({
                  viewId: view.id,
                  viewName: view.name,
                  imageDataUrl: croppedCanvas.toDataURL('image/png'),
                });
            } else {
               throw new Error("Could not get 2D context for cropping modal preview canvas");
            }
          } catch (error) {
            console.error(`Error generating screenshot for view ${view.name}:`, error);
            tempScreenshots.push({
              viewId: view.id,
              viewName: view.name,
              imageDataUrl: 'error', 
            });
          }
        }
      }
    }
    setViewScreenshots(tempScreenshots);
    setIsGeneratingPreviews(false);

    if (currentActiveView && activeViewId !== currentActiveView) {
        setActiveViewId(currentActiveView);
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
    }
  };

  const handleConfirmAddToCart = async () => {
    setIsConfirmationModalOpen(false);
    let screenshotStorageUrl: string | null = null;

    if (primaryScreenshotForUpload && user && user.uid && productDetails && productDetails.id && firebaseStorage) {
      toast({ title: "Processing Design...", description: "Uploading your customization preview.", duration: 2000 });
      try {
        const filePath = `user_customizations/${user.uid}/${productDetails.id}/${Date.now()}.png`;
        const fileStorageRef = storageRef(firebaseStorage, filePath);
        await uploadString(fileStorageRef, primaryScreenshotForUpload, 'data_url');
        screenshotStorageUrl = await getDownloadURL(fileStorageRef);
        toast({ title: "Preview Saved", description: "Customization preview uploaded successfully." });
      } catch (uploadError) {
        console.error("Error uploading screenshot to Firebase Storage:", uploadError);
        toast({ title: "Upload Failed", description: "Could not save customization preview.", variant: "destructive" });
      }
    } else if (primaryScreenshotForUpload) {
        toast({ title: "Note", description: "Customization preview generated but not uploaded (user/product/storage issue).", variant: "default" });
    }


    const currentProductIdFromUrlResolved = productIdFromUrl;
    const baseProductPrice = productDetails?.basePrice ?? 0;
    const viewsUsedForSurcharge = new Set<string>();
    canvasImages.forEach(item => { if(item.viewId) viewsUsedForSurcharge.add(item.viewId); });
    canvasTexts.forEach(item => { if(item.viewId) viewsUsedForSurcharge.add(item.viewId); });
    canvasShapes.forEach(item => { if(item.viewId) viewsUsedForSurcharge.add(item.viewId); });

    const activeViewIdForPricing = originalActiveViewIdBeforePreviewRef.current || productDetails?.views[0]?.id;
    if (activeViewIdForPricing && (viewsUsedForSurcharge.has(activeViewIdForPricing) || viewsUsedForSurcharge.size === 0)) {
        viewsUsedForSurcharge.add(activeViewIdForPricing);
    }

    let totalViewSurcharge = 0;
    viewsUsedForSurcharge.forEach(vid => { totalViewSurcharge += productDetails?.views.find(v => v.id === vid)?.price ?? 0; });

    const designData = {
      productId: currentProductIdFromUrlResolved || productDetails?.id,
      variationId: productVariations?.find(v => v.attributes.every(attr => selectedVariationOptions[attr.name] === attr.option))?.id.toString() || null,
      quantity: 1,
      customizationDetails: {
        viewData: productDetails?.views.map(view => ({
            viewId: view.id, viewName: view.name,
            images: canvasImages.filter(item => item.viewId === view.id).map(img => ({ src: img.dataUrl, name: img.name, type: img.type, x: img.x, y: img.y, scale: img.scale, rotation: img.rotation })),
            texts: canvasTexts.filter(item => item.viewId === view.id).map(txt => ({ content: txt.content, fontFamily: txt.fontFamily, fontSize: txt.fontSize, color: txt.color, x: txt.x, y: txt.y, scale: txt.scale, rotation: txt.rotation, outlineColor: txt.outlineColor, outlineWidth: txt.outlineWidth, shadowColor: txt.shadowColor, shadowOffsetX: txt.shadowOffsetX, shadowOffsetY: txt.shadowOffsetY, shadowBlur: txt.shadowBlur, archAmount: txt.archAmount })),
            shapes: canvasShapes.filter(item => item.viewId === view.id).map(shp => ({ type: shp.shapeType, color: shp.color, strokeColor: shp.strokeColor, strokeWidth: shp.strokeWidth, x: shp.x, y: shp.y, scale: shp.scale, rotation: shp.rotation, width: shp.width, height: shp.height })),
        })).filter(view => view.images.length > 0 || view.texts.length > 0 || view.shapes.length > 0),
        selectedOptions: selectedVariationOptions, baseProductPrice: baseProductPrice, totalViewSurcharge: totalViewSurcharge,
        totalCustomizationPrice: totalCustomizationPrice,
        activeViewIdUsed: activeViewIdForPricing,
        screenshotStorageUrl: screenshotStorageUrl, 
      },
      userId: user?.uid || null,
      configUserId: productDetails?.meta?.configUserIdUsed || null,
    };

    let targetOrigin = '*';
    if (window.parent !== window && document.referrer) {
      try { targetOrigin = new URL(document.referrer).origin; }
      catch (e) { console.warn("Could not parse document.referrer for targetOrigin. Defaulting to '*'. Parent site MUST validate event.origin.", e); }
    } else if (window.parent !== window) {
        console.warn("document.referrer is empty, but app is in an iframe. Defaulting to targetOrigin '*' for postMessage. Parent site MUST validate event.origin.");
    }

    if (window.parent !== window) {
      window.parent.postMessage({ customizerStudioDesignData: designData }, targetOrigin);
      toast({ title: "Design Sent!", description: `Your design details have been sent. The embedding site must verify the origin of this message for security.`});
    } else {
       toast({ title: "Add to Cart Clicked (Standalone)", description: "Design data logged to console. Screenshot (if any) " + (screenshotStorageUrl ? `uploaded to: ${screenshotStorageUrl}` : "not uploaded."), variant: "default", duration: 7000});
      console.log("Add to Cart - Design Data:", designData);
    }
    setViewScreenshots([]);
    setPrimaryScreenshotForUpload(null);
    originalActiveViewIdBeforePreviewRef.current = null;
  };

  const handleAddToCartClick = () => {
    if (productDetails && productDetails.allowCustomization === false) {
      toast({ title: "Customization Disabled", description: "This product is not available for customization at this time.", variant: "destructive" });
      return;
    }
    if (!activeViewId && (canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0)){
       toast({ title: "Select a View", description: "Please ensure an active product view is selected before adding to cart if you have customizations.", variant: "default"});
      return;
    }
    if (canvasImages.length === 0 && canvasTexts.length === 0 && canvasShapes.length === 0) {
      toast({ title: "Empty Design", description: "Please add some design elements to the canvas before adding to cart.", variant: "default" });
      return;
    }
    if (!isEmbedded && !user && (canvasImages.length > 0 || canvasTexts.length > 0 || canvasShapes.length > 0)) {
       toast({ title: "Please Sign In", description: "Sign in to save your design and add to cart (if applicable).", variant: "default" });
      return;
    }
    generatePreviewsAndOpenModal();
  };


  if (isLoading || (authLoading && !user && !wpApiBaseUrlFromUrl && !configUserIdFromUrl)) {
    return (
      <div className="flex min-h-svh h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading customizer...</p>
      </div>
    );
  }

  if (productDetails && productDetails.allowCustomization === false) {
    return (
      <div className="flex flex-col min-h-svh h-screen w-full items-center justify-center bg-background p-4">
        {!isEmbedded && <AppHeader />}
        <div className="text-center">
          <Ban className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-destructive mb-3">Customization Disabled</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Product customization for "{productDetails.name}" is currently disabled by the store owner.
          </p>
          {!isEmbedded && user && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/products/${productDetails.id}/options`}>
                <SettingsIcon className="mr-2 h-4 w-4" /> Go to Product Options
              </Link>
            </Button>
          )}
          {!isEmbedded && !user && (
             <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
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
    let finalErrorMessage = error;
     if (isEmbedded && wpApiBaseUrlFromUrl && error.includes("credentials are not configured")) {
        finalErrorMessage = `Failed to load product data. Please ensure the Customizer Studio plugin on your WordPress site is correctly configured and can access WooCommerce products. Original Error: ${error}`;
    } else if (isEmbedded && wpApiBaseUrlFromUrl && error.includes("Failed to fetch product")) {
         finalErrorMessage = `Could not retrieve product information using the WordPress site's proxy. Please check the Customizer Studio plugin settings and your WooCommerce product status. Original Error: ${error}`;
    } else if (isEmbedded && !wpApiBaseUrlFromUrl && error.includes("credentials are not configured")) {
        finalErrorMessage = `This product customizer needs store credentials for direct access. If embedded, the parent site might need to provide a proxy URL or ensure proper configuration. Original Error: ${error}`;
    }
    return (
      <div className="flex flex-col min-h-svh h-screen w-full items-center justify-center bg-background p-4">
        {!isEmbedded && <AppHeader />}
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Customizer Error</h2>
        <p className="text-muted-foreground text-center mb-6 max-w-lg">{finalErrorMessage}</p>
        {!isEmbedded && ( <Button variant="outline" asChild><Link href="/dashboard">Back to Dashboard</Link></Button> )}
      </div>
    );
  }

  return (
      <div className={cn("flex flex-col min-h-svh h-screen w-full", isEmbedded ? "bg-transparent" : "bg-muted/20")}>
        {!isEmbedded && <AppHeader />}
        <div className="relative flex flex-1 overflow-hidden">
          <CustomizerIconNav tools={toolItems} activeTool={activeTool} setActiveTool={setActiveTool} />
          <div id="tool-panel-content" className={cn("border-r bg-card shadow-sm flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out h-full", isToolPanelOpen ? "w-72 md:w-80 opacity-100" : "w-0 opacity-0 pointer-events-none")}>
            <div className="p-4 border-b flex-shrink-0"> <h2 className="font-headline text-lg font-semibold text-foreground">{getToolPanelTitle(activeTool)}</h2> </div>
            <div className={cn("flex-1 h-full overflow-y-auto overflow-x-hidden pb-20 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500", !isToolPanelOpen && "invisible opacity-0")}>
               {renderActiveToolPanelContent()}
            </div>
          </div>
          <Button onClick={toggleToolPanel} variant="outline" size="icon" className={cn("absolute top-1/2 -translate-y-1/2 z-30 h-12 w-8 rounded-l-none border-l-0 shadow-md bg-card hover:bg-accent/20", "transition-all duration-300 ease-in-out", isToolPanelOpen ? "left-[calc(theme(spacing.16)_+_theme(spacing.72))] md:left-[calc(theme(spacing.16)_+_theme(spacing.80))]" : "left-16")} aria-label={isToolPanelOpen ? "Collapse tool panel" : "Expand tool panel"} aria-expanded={isToolPanelOpen} aria-controls="tool-panel-content">
            {isToolPanelOpen ? <PanelLeftClose className="h-5 w-5"/> : <PanelRightOpen className="h-5 w-5"/>}
          </Button>

          <main className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
            {error && productDetails?.id === defaultFallbackProduct.id && ( <div className="w-full max-w-4xl p-3 mb-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm flex-shrink-0"> <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} </div> )}
             {error && productDetails && productDetails.id !== defaultFallbackProduct.id && ( <div className="w-full max-w-4xl p-3 mb-4 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm flex-shrink-0"> <AlertTriangle className="inline h-4 w-4 mr-1" /> {error} </div> )}
             <div className="w-full flex flex-col flex-1 min-h-0 pb-4">
              <DesignCanvas
                key={activeViewId} 
                productImageUrl={currentProductImage}
                productImageAlt={`${currentProductName} - ${currentProductAlt}`}
                productImageAiHint={currentProductAiHint}
                productDefinedBoundaryBoxes={currentBoundaryBoxes}
                activeViewId={activeViewId}
                showGrid={showGrid}
                showBoundaryBoxes={showBoundaryBoxes}
              />
            </div>
          </main>

           <Button onClick={toggleRightSidebar} variant="outline" size="icon" className={cn("absolute top-1/2 -translate-y-1/2 z-30 h-12 w-8 rounded-r-none border-r-0 shadow-md bg-card hover:bg-accent/20", "transition-all duration-300 ease-in-out", isRightSidebarOpen ? "right-[theme(spacing.72)] md:right-[theme(spacing.80)] lg:right-[theme(spacing.96)]" : "right-0")} aria-label={isRightSidebarOpen ? "Collapse right sidebar" : "Expand right sidebar"} aria-expanded={isRightSidebarOpen} aria-controls="right-panel-content">
            {isRightSidebarOpen ? <PanelRightClose className="h-5 w-5"/> : <PanelLeftOpen className="h-5 w-5"/>}
          </Button>
          <RightPanel showGrid={showGrid} toggleGrid={toggleGrid} showBoundaryBoxes={showBoundaryBoxes} toggleBoundaryBoxes={toggleBoundaryBoxes} productDetails={productDetails} activeViewId={activeViewId} setActiveViewId={setActiveViewId} className={cn("transition-all duration-300 ease-in-out flex-shrink-0 h-full", isRightSidebarOpen ? "w-72 md:w-80 lg:w-96 opacity-100" : "w-0 opacity-0 pointer-events-none")} configurableAttributes={configurableAttributes} selectedVariationOptions={selectedVariationOptions} onVariantOptionSelect={handleVariantOptionSelect} productVariations={productVariations} />
        </div>

        <footer className="fixed bottom-0 left-0 right-0 h-16 border-t bg-card shadow-md px-4 py-2 flex items-center justify-between gap-4 z-40">
            <div className="text-md font-medium text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md" title={currentProductName}> {currentProductName} </div>
            <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-foreground">Total: ${totalCustomizationPrice.toFixed(2)}</div>
                <Button size="default" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAddToCartClick} disabled={productDetails?.allowCustomization === false || isGeneratingPreviews}>
                    {isGeneratingPreviews ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (productDetails?.allowCustomization === false ? <Ban className="mr-2 h-5 w-5" /> : <ShoppingCart className="mr-2 h-5 w-5" />) }
                    {isGeneratingPreviews ? "Processing..." : (productDetails?.allowCustomization === false ? "Not Customizable" : "Add to Cart")}
                </Button>
            </div>
        </footer>

        <AlertDialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
            <AlertDialogContent className="max-w-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline text-xl">Confirm Your Customization</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please review the previews of your customized product views below.
                        {isGeneratingPreviews && " Generating previews..."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {isGeneratingPreviews ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Generating previews, please wait...</p>
                    </div>
                ) : viewScreenshots.length > 0 ? (
                    <div className="my-4 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                        {viewScreenshots.map(preview => (
                            <div key={preview.viewId} className="border rounded-md p-2 bg-muted/20">
                                <p className="text-sm font-medium text-center mb-1.5 text-foreground">{preview.viewName}</p>
                                <div className="relative aspect-square w-full rounded overflow-hidden bg-background">
                                    {preview.imageDataUrl === 'error' ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive bg-destructive/10">
                                            <AlertTriangle className="h-8 w-8 mb-1" />
                                            <span className="text-xs">Preview Error</span>
                                        </div>
                                    ) : (
                                        <NextImage src={preview.imageDataUrl} alt={`Preview of ${preview.viewName}`} fill className="object-contain" unoptimized={true} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="my-4 text-center text-muted-foreground">
                        <Eye className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                        No customized views to preview.
                        {primaryScreenshotForUpload && " The current view will be used for the order."}
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            setIsConfirmationModalOpen(false);
                            setViewScreenshots([]);
                            setPrimaryScreenshotForUpload(null);
                            if (originalActiveViewIdBeforePreviewRef.current && activeViewId !== originalActiveViewIdBeforePreviewRef.current) {
                                setActiveViewId(originalActiveViewIdBeforePreviewRef.current);
                            }
                            originalActiveViewIdBeforePreviewRef.current = null;
                        }}
                        disabled={isGeneratingPreviews}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmAddToCart} disabled={isGeneratingPreviews || (!primaryScreenshotForUpload && viewScreenshots.length === 0)}>
                        {isGeneratingPreviews ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm & Add to Cart
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {!isEmbedded && <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader> <AlertDialogTitle>Unsaved Changes</AlertDialogTitle> <AlertDialogDescription> You have unsaved changes on the canvas. Are you sure you want to leave? Your changes will be lost. </AlertDialogDescription> </AlertDialogHeader>
            <AlertDialogFooter> <AlertDialogCancel onClick={() => { setIsLeaveConfirmOpen(false); setOnConfirmLeaveAction(null); }}> Stay </AlertDialogCancel> <AlertDialogAction onClick={() => { if (onConfirmLeaveAction) onConfirmLeaveAction(); setIsLeaveConfirmOpen(false); setOnConfirmLeaveAction(null); }} className={cn(buttonVariants({variant: "destructive"}))}> Leave </AlertDialogAction> </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>}
      </div>
  );
}

export default function CustomizerPage() {
  return (
    <UploadProvider>
      <Suspense fallback={ <div className="flex min-h-svh h-screen w-full items-center justify-center bg-background"> <Loader2 className="h-10 w-10 animate-spin text-primary" /> <p className="ml-3 text-muted-foreground">Loading customizer page...</p> </div> }>
        <CustomizerLayoutAndLogic />
      </Suspense>
    </UploadProvider>
  );
}
    
    

    

    

    



    









