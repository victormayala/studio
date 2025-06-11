
"use client"; 

import { useSearchParams } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppHeader from '@/components/layout/AppHeader';
import LeftPanel from '@/components/customizer/LeftPanel';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider } from "@/contexts/UploadContext";
import type { ReactNode } from 'react'; // Added for UploadProvider children
import { useEffect, useState } from 'react';

// Copied from options/page.tsx for this step - ideally, this would be shared or from an API
interface BoundaryBox {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProductDetailsForCustomizer {
  id: string;
  name: string;
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[];
}

const mockProductForCustomizer: ProductDetailsForCustomizer = {
  id: 'prod_1', // Default product ID if none is found via URL
  name: 'Classic T-Shirt (Default)',
  imageUrl: 'https://placehold.co/700x700.png',
  aiHint: 't-shirt mockup',
  boundaryBoxes: [
    { id: 'area1_default', name: 'Front Chest', x: 30, y: 20, width: 40, height: 30 },
  ],
};

// Simplified mock data source for customizer page
const productDatabase: ProductDetailsForCustomizer[] = [
  { 
    id: 'prod_1', 
    name: 'Classic T-Shirt', 
    imageUrl: 'https://placehold.co/700x700/f0f0f0/ccc.png?text=Shirt+View', 
    aiHint: 't-shirt product',
    boundaryBoxes: [
      { id: 'area1_prod_1', name: 'Chest Area', x: 25, y: 15, width: 50, height: 30 },
      { id: 'area2_prod_1', name: 'Sleeve Logo', x: 70, y: 25, width: 15, height: 10 },
    ]
  },
  { 
    id: 'prod_2', 
    name: 'Coffee Mug', 
    imageUrl: 'https://placehold.co/700x700/ffffff/aaa.png?text=Mug+View', 
    aiHint: 'coffee mug',
    boundaryBoxes: [
      { id: 'area1_prod_2', name: 'Full Wrap', x: 10, y: 10, width: 80, height: 80 },
    ]
  },
  // Add more mock products as needed
];


export default function CustomizerPage() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const [selectedProduct, setSelectedProduct] = useState<ProductDetailsForCustomizer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (productId) {
      const foundProduct = productDatabase.find(p => p.id === productId);
      setSelectedProduct(foundProduct || null); // Set to null if not found to explicitly handle
    } else {
      setSelectedProduct(null); // No productId, so no specific product loaded initially
    }
    setLoading(false);
  }, [productId]);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <p>Loading customizer...</p>
      </div>
    );
  }

  const productToDisplay = selectedProduct || mockProductForCustomizer; // Fallback to default mock if no product or not found

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
                <DesignCanvas 
                  productImageUrl={productToDisplay.imageUrl}
                  productImageAlt={productToDisplay.name}
                  productImageAiHint={productToDisplay.aiHint}
                  productDefinedBoundaryBoxes={productToDisplay.boundaryBoxes}
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
