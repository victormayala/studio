
"use client";

import AiAssistant from './AiAssistant';
import GridControls from './GridControls'; 
import HistoryControls from './HistoryControls'; 

interface RightPanelProps {
  showGrid: boolean;
  toggleGrid: () => void;
}

export default function RightPanel({ showGrid, toggleGrid }: RightPanelProps) {
  return (
    <div className="w-72 md:w-80 lg:w-96 h-full flex-shrink-0 shadow-sm border-l bg-card flex flex-col">
      {/* Scrollable Container for all sections with overall padding and vertical spacing for sections */}
      <div className="flex-1 h-full overflow-y-scroll overflow-x-hidden p-4 space-y-6">
        
        {/* AI Assistant Section */}
        <div> {/* Wrapper for AI Assistant section */}
          <div className="border-b pb-3 mb-3"> {/* Section Header: border, space below text, space after header block */}
            <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
          </div>
          {/* Content for AI Assistant - component directly */}
          <AiAssistant />
        </div>

        {/* History Section */}
        <div> {/* Wrapper for History section */}
          <div className="border-b pb-3 mb-3"> {/* Section Header */}
            <h2 className="font-headline text-lg font-semibold text-foreground">History</h2>
          </div>
          <HistoryControls />
        </div>

        {/* Canvas Helpers Section */}
        <div> {/* Wrapper for Canvas Helpers section */}
          <div className="border-b pb-3 mb-3"> {/* Section Header */}
            <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
          </div>
          <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
        </div>
        
      </div>
    </div>
  );
}
