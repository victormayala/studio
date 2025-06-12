
"use client";

import AiAssistant from './AiAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RightPanel() {
  return (
    <div className="w-72 md:w-80 lg:w-96 h-full flex-shrink-0 shadow-sm border-l bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold text-foreground">AI Design Assistant</h2>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 h-full flex flex-col"> {/* Added h-full and flex flex-col */}
          <AiAssistant />
        </div>
      </ScrollArea>
    </div>
  );
}
