
"use client";

import React from 'react'; // Import React for React.memo
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BoxSelect } from "lucide-react";

interface BoundaryBoxControlsProps {
  showBoundaryBoxes: boolean;
  toggleBoundaryBoxes: () => void;
}

const BoundaryBoxControlsComponent = ({ showBoundaryBoxes, toggleBoundaryBoxes }: BoundaryBoxControlsProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
        <div className="space-y-0.5">
          <Label htmlFor="boundarybox-toggle" className="text-sm font-medium text-foreground flex items-center">
            <BoxSelect className="mr-2 h-4 w-4 text-primary" />
            Show Customization Areas
          </Label>
          <p className="text-xs text-muted-foreground">
            Display the product's defined design areas.
          </p>
        </div>
        <Switch
          id="boundarybox-toggle"
          checked={showBoundaryBoxes}
          onCheckedChange={toggleBoundaryBoxes}
          aria-label="Toggle customization area visibility"
        />
      </div>
    </div>
  );
}

const BoundaryBoxControls = React.memo(BoundaryBoxControlsComponent);
BoundaryBoxControls.displayName = 'BoundaryBoxControls';
export default BoundaryBoxControls;
