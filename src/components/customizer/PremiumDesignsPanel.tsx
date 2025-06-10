
"use client";

import React from 'react';
import { useUploads } from '@/contexts/UploadContext';
import { premiumDesignsData, type PremiumDesignItem } from '@/lib/premium-designs-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Gem, PlusCircle } from 'lucide-react'; // Using Gem icon for "Premium Designs"
import { Button } from '@/components/ui/button'; // For potential future "buy" button, not used for add yet.
import { Badge } from '@/components/ui/badge';

export default function PremiumDesignsPanel() {
  const { addCanvasImageFromUrl } = useUploads();

  const handleDesignClick = (design: PremiumDesignItem) => {
    // For now, directly add to canvas. Future implementation might involve a purchase flow.
    addCanvasImageFromUrl(design.name, design.imageUrl, design.type, design.id);
  };

  return (
    <div className="space-y-4 h-full flex flex-col p-4">
      <h3 className="text-md font-semibold text-foreground mb-0 px-1 font-headline">Premium Designs</h3>
      <p className="text-xs text-muted-foreground px-1">Click a design to add it to the canvas. Costs $1.00 each.</p>

      {premiumDesignsData.length > 0 ? (
        <ScrollArea className="flex-grow border rounded-md bg-background">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-2 gap-3 p-3">
            {premiumDesignsData.map((design) => (
              <div
                key={design.id}
                onClick={() => handleDesignClick(design)}
                className="p-2 border rounded-md cursor-pointer bg-card hover:bg-accent/5 flex flex-col items-center justify-center gap-2 transition-all border-border group relative aspect-video"
                title={`Add "${design.name}" to canvas - $${design.price.toFixed(2)}`}
              >
                <div className="relative w-full h-24">
                  <Image
                    src={design.imageUrl}
                    alt={design.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-contain"
                    data-ai-hint={design.aiHint}
                  />
                </div>
                <span className="text-xs text-center truncate w-full mt-1">{design.name}</span>
                <Badge variant="secondary" className="absolute top-1 left-1 text-xs bg-primary/10 text-primary font-semibold border-primary/20">
                  ${design.price.toFixed(2)}
                </Badge>
                <PlusCircle className="absolute top-2 right-2 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 border border-dashed rounded-md bg-muted/20">
          <Gem className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No premium designs available currently.</p>
        </div>
      )}
    </div>
  );
}
