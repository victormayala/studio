
"use client";

import AiAssistant from './AiAssistant';
import GridControls from './GridControls'; 
import HistoryControls from './HistoryControls'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface RightPanelProps {
  showGrid: boolean;
  toggleGrid: () => void;
}

export default function RightPanel({ showGrid, toggleGrid }: RightPanelProps) {
  return (
    <div className="w-72 md:w-80 lg:w-96 h-full flex-shrink-0 shadow-sm border-l bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
      </div>
      <ScrollArea className="flex-grow min-h-0"> {/* ADDED min-h-0 */}
        <div className="p-4"> {/* REMOVED h-full and flex flex-col, AiAssistant handles its own flex growth */}
          <AiAssistant />
        </div>
      </ScrollArea>
      
      <Separator />
      <div className="p-4 border-t">
        <h2 className="font-headline text-md font-semibold text-foreground mb-3">History</h2>
        <HistoryControls />
      </div>

      <Separator />
      <div className="p-4 border-t">
        <h2 className="font-headline text-md font-semibold text-foreground mb-3">Canvas Helpers</h2>
        <GridControls showGrid={showGrid} toggleGrid={toggleGrid} />
      </div>
    </div>
  );
}
