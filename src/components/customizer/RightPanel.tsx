
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
      {/* Scrollable Container for all sections */}
      <div className="flex-1 h-full overflow-y-scroll overflow-x-hidden">
        
        {/* AI Assistant Section */}
        <div>
          <div className="p-4 border-b flex-shrink-0"> {/* Section Header */}
            <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
          </div>
          <div className="p-4"> {/* Section Content */}
            <AiAssistant />
          </div>
        </div>

        {/* History Section */}
        <div>
          <div className="p-4 border-b flex-shrink-0"> {/* Section Header */}
            <h2 className="font-headline text-lg font-semibold text-foreground">History</h2>
          </div>
          <div className="p-4"> {/* Section Content for HistoryControls */}
            <HistoryControls />
          </div>
        </div>

        {/* Canvas Helpers Section */}
        <div>
          <div className="p-4 border-b flex-shrink-0"> {/* Section Header */}
            <h2 className="font-headline text-lg font-semibold text-foreground">Canvas Helpers</h2>
          </div>
          <div className="p-4"> {/* Section Content for GridControls */}
            <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
