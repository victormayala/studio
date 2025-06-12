
"use client";

// This file is being repurposed as CustomizerIconNav.
// If you need the old LeftPanel functionality, you'll need to revert or manage versions.
// For this change, LeftPanel.tsx is effectively replaced by CustomizerIconNav.tsx
// To avoid breaking imports if something else was somehow still using LeftPanel,
// I'll leave a shell, but the new navigation is in CustomizerIconNav.tsx.

import React from 'react';
import { Settings2 } from 'lucide-react';

export default function LeftPanel() {
  return (
    <div className="p-4 text-muted-foreground">
      <Settings2 className="w-8 h-8 mx-auto mb-2" />
      <p className="text-xs text-center">Icon navigation is now handled by CustomizerIconNav. This LeftPanel is a placeholder.</p>
    </div>
  );
}
