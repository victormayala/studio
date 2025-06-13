
"use client";

import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import type { ProductView } from '@/app/customizer/page';

interface ViewSwitcherProps {
  productViews: ProductView[];
  activeViewId: string | null;
  setActiveViewId: (id: string) => void;
}

export default function ViewSwitcher({ productViews, activeViewId, setActiveViewId }: ViewSwitcherProps) {
  if (!productViews || productViews.length === 0) {
    return <p className="text-sm text-muted-foreground text-center">No product views to display.</p>;
  }

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3 text-center text-foreground">
        {productViews.length > 1 ? "Select View" : "Current View"}
      </h4>
      <div className="flex flex-wrap justify-center gap-2">
        {productViews.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveViewId(view.id)}
            className={cn(
              "rounded-md border-2 p-1 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
              activeViewId === view.id
                ? "border-primary opacity-100 ring-1 ring-primary ring-offset-background shadow-sm"
                : "border-transparent opacity-70 hover:border-muted-foreground/30 bg-muted/30 hover:bg-muted/50"
            )}
            title={`Select ${view.name} view`}
            aria-pressed={activeViewId === view.id}
          >
            <div className="relative h-12 w-12 bg-background rounded-sm overflow-hidden shadow-sm">
              <NextImage
                src={view.imageUrl || 'https://placehold.co/60x60.png'}
                alt={`Thumbnail for ${view.name}`}
                fill
                sizes="(max-width: 768px) 4rem, 3rem"
                className="object-contain"
                data-ai-hint={view.aiHint || "product view thumbnail"}
              />
            </div>
            <p className="text-xs mt-1 text-center truncate w-12 text-foreground">{view.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
