
"use client";

import React from 'react'; // Import React for React.memo
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Grid3X3 } from "lucide-react";

interface GridControlsProps {
  showGrid: boolean;
  toggleGrid: () => void;
}

const GridControlsComponent = ({ showGrid, toggleGrid }: GridControlsProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
        <div className="space-y-0.5">
          <Label htmlFor="grid-toggle" className="text-sm font-medium text-foreground flex items-center">
            <Grid3X3 className="mr-2 h-4 w-4 text-primary" />
            Show Alignment Grid
          </Label>
          <p className="text-xs text-muted-foreground">
            Display a grid inside the boundary box.
          </p>
        </div>
        <Switch
          id="grid-toggle"
          checked={showGrid}
          onCheckedChange={toggleGrid}
          aria-label="Toggle alignment grid"
        />
      </div>
      {/* Add more canvas helper toggles here in the future */}
    </div>
  );
}

const GridControls = React.memo(GridControlsComponent);
GridControls.displayName = 'GridControls';
export default GridControls;
