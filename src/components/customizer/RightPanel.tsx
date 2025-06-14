
"use client";

import AiAssistant from './AiAssistant';
import GridControls from './GridControls'; 
import HistoryControls from './HistoryControls'; 
import ViewSwitcher from './ViewSwitcher';
import type { ProductForCustomizer } from '@/app/customizer/page';
import { cn } from '@/lib/utils'; // Import cn

interface RightPanelProps {
  showGrid: boolean;
  toggleGrid: () => void;
  productDetails: ProductForCustomizer | null;
  activeViewId: string | null;
  setActiveViewId: (id: string) => void;
  className?: string; // Add className prop
}

export default function RightPanel({ 
  showGrid, 
  toggleGrid,
  productDetails,
  activeViewId,
  setActiveViewId,
  className // Destructure className
}: RightPanelProps) {
  return (
  <div 
    id="right-panel-content"
    className={cn(
      "shadow-sm border-l bg-card flex flex-col", // Base classes
      className // Apply passed className for width, transition, opacity etc.
    )}
  >
    <div 
      className={cn(
        "flex-1 h-full overflow-y-auto overflow-x-hidden pb-20",
        "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
      )}
    > {/* Added pb-20 for footer */}
  
      {/* AI Assistant Section */}
      <div>
        <div className="p-4"> 
          <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
        </div>
        <div className="border-b mx-0"></div> 
        <div className="p-4"> 
          <AiAssistant />
        </div>
      </div>

      {/* Product Views Section */}
      <div>
        <div className="p-4 border-t"> 
          <h2 className="font-headline text-lg font-semibold text-foreground">
            Product Views
          </h2>
        </div>
        <div className="p-4"> 
          {productDetails && productDetails.views && productDetails.views.length > 0 ? (
            <ViewSwitcher
              productViews={productDetails.views}
              activeViewId={activeViewId}
              setActiveViewId={setActiveViewId}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center">No views available.</p>
          )}
        </div>
      </div>
      
      {/* Canvas Helpers Section */}
      <div>
        <div className="p-4 border-t"> 
          <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
        </div>
        <div className="px-4 py-4 space-y-4"> 
          <HistoryControls />
          <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
        </div>
      </div>
    </div>
  </div>
  );
}

