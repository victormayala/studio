
"use client";

import AiAssistant from './AiAssistant';
import GridControls from './GridControls'; 
import HistoryControls from './HistoryControls'; 
import ViewSwitcher from './ViewSwitcher';
import type { ProductForCustomizer } from '@/app/customizer/page';

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
        <div className="p-4"> {/* Header title for AI */}
          <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
        </div>
        <div className="border-b mx-0"></div> {/* Full-width separator for AI */}
        <div className="p-4"> {/* Content area for AI */}
          <AiAssistant />
        </div>
      </div>

      {/* Product Views Section */}
      <div>
        <div className="p-4 border-b"> {/* Header title for Product Views */}
          <h2 className="font-headline text-lg font-semibold text-foreground">
            Product Views
          </h2>
        </div>
        <div className="p-4"> {/* Content area for Product Views */}
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
        <div className="p-4 border-b"> {/* Header title for Canvas Helpers */}
          <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
        </div>
        <div className="px-4 py-4 space-y-4"> {/* Changed p-4 to px-4 py-4 for explicit confirmation of right padding */}
          <HistoryControls />
          <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
        </div>
      </div>
    </div>
  </div>
  );
}
