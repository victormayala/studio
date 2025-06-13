
"use client";

import AiAssistant from './AiAssistant';
import GridControls from './GridControls'; 
import HistoryControls from './HistoryControls'; 
import ViewSwitcher from './ViewSwitcher';
import type { ProductForCustomizer, ProductView } from '@/app/customizer/page';

interface RightPanelProps {
  showGrid: boolean;
  toggleGrid: () => void;
  productDetails: ProductForCustomizer | null;
  activeViewId: string | null;
  setActiveViewId: (id: string) => void;
}

export default function RightPanel({ 
  showGrid, 
  toggleGrid,
  productDetails,
  activeViewId,
  setActiveViewId
}: RightPanelProps) {
  return (
  <div className="w-72 md:w-80 lg:w-96 flex-shrink-0 shadow-sm border-l bg-card flex flex-col">
    <div className="flex-1 h-full overflow-y-scroll overflow-x-hidden">
  
      {/* AI Assistant Section */}
      <div>
        <div className="p-4">
          <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
        </div>
        <div className="border-b mx-0"></div> {/* Full width separator for AI */}
        <div className="p-4">
          <AiAssistant />
        </div>
      </div>

      {/* Product Views Section */}
      <div>
        <div className="p-4 border-b">
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
      
      {/* History Section */}
      <div>
        <div className="p-4 border-b">
          <h2 className="font-headline text-lg font-semibold text-foreground">History</h2>
        </div>
        <div className="p-4">
          <HistoryControls />
        </div>
      </div>
      
      {/* Canvas Helpers Section */}
      <div>
        <div className="p-4 border-b">
          <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
        </div>
        <div className="p-4">
          <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
        </div>
      </div>

    </div>
  </div>
  );
}
