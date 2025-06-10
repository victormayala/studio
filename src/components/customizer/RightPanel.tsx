"use client";

import AiAssistant from './AiAssistant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RightPanel() {
  return (
    <Card className="w-full md:w-80 lg:w-96 h-full flex-shrink-0 shadow-lg rounded-lg flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-lg text-foreground">AI Design Assistant</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-4">
          <AiAssistant />
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
