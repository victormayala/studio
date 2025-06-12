
"use client";

import { Button } from "@/components/ui/button";
import { useUploads } from "@/contexts/UploadContext";
import { Undo2, Redo2 } from "lucide-react";

export default function HistoryControls() {
  const { undo, redo, canUndo, canRedo } = useUploads();

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3 shadow-sm bg-muted/20">
      <Button
        onClick={undo}
        disabled={!canUndo}
        variant="outline"
        size="sm"
        className="flex-1 hover:bg-accent hover:text-accent-foreground"
        title="Undo last action"
      >
        <Undo2 className="mr-2 h-4 w-4" />
        Undo
      </Button>
      <Button
        onClick={redo}
        disabled={!canRedo}
        variant="outline"
        size="sm"
        className="flex-1 hover:bg-accent hover:text-accent-foreground"
        title="Redo last action"
      >
        <Redo2 className="mr-2 h-4 w-4" />
        Redo
      </Button>
    </div>
  );
}
