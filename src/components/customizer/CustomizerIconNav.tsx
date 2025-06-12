
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
                  activeTool === tool.id ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
                )}
                onClick={() => setActiveTool(tool.id)}
                aria-label={tool.label}
              >
                <tool.icon className="h-6 w-6 transition-colors group-hover:text-secondary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  );
}
