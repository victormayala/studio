
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
  <div className="w-72 md:w-80 lg:w-96 flex-shrink-0 shadow-sm border-l bg-card flex flex-col">
    {/* Scrollable Container for all sections. No overall padding here. */}
    <div className="flex-1 h-full overflow-y-scroll overflow-x-hidden">
  
      {/* AI Assistant Section - Full-width separator */}
      <div> {/* Vertical spacing for the section */}
        {/* Header text with padding */}
        <div className="p-4">
          <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
        </div>
        {/* Full-width border, placed after the padded header */}
        <div className="border-b mx-0"></div> {/* Ensures full width as its parent (scrollable div) has no horizontal
        padding */}
      </div>
      {/* Content with padding */}
      <div className="p-4">
          <div>
            <AiAssistant />
          </div>
        {/* History Section - Inset separator (mimicking left panel title) */}
        <div className="mb-6"> {/* Vertical spacing for the section */}
          {/* Header with padding and bottom border (inset) */}
          <div className="mt-6 mb-3">
            <h2 className="font-headline text-lg font-semibold text-foreground">History</h2>
          </div>
          {/* Content with padding */}
          <div>
            <div>
              <HistoryControls />
            </div>
            <div className="mt-6 mb-3">
              <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
            </div>
            <div>
              <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
  }
