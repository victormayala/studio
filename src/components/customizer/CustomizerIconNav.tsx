
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface CustomizerTool {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface CustomizerIconNavProps {
  tools: CustomizerTool[];
  activeTool: string;
  setActiveTool: (toolId: string) => void;
}

export default function CustomizerIconNav({ tools, activeTool, setActiveTool }: CustomizerIconNavProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <nav className="w-16 bg-card border-r flex flex-col items-center py-4 space-y-1 flex-shrink-0 shadow-sm">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-lg flex flex-col items-center justify-center group", 
                  activeTool === tool.id 
                    ? "bg-accent/20 text-accent" // Active state: light accent bg, accent icon
                    : "text-muted-foreground hover:bg-accent hover:text-primary-foreground" // Inactive state: default muted icon, on hover: accent bg, white icon
                )}
                onClick={() => setActiveTool(tool.id)}
                aria-label={tool.label}
              >
                <tool.icon className="h-6 w-6 transition-colors" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              <div className="flex items-center space-x-2">
                <p>{tool.label}</p>
                {tool.id === 'ai-assistant' && (
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs h-fit">Beta</Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  );
}
