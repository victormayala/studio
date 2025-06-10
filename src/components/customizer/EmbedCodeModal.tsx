"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Clipboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EmbedCodeModal({ isOpen, onOpenChange }: EmbedCodeModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://cstmzr.com/embed.js?id=YOUR_UNIQUE_ID" async defer></script>
<div id="embedz-customizer-container"></div>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The embed code has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Embed Your Customizer</DialogTitle>
          <DialogDescription>
            Copy and paste this code into your website where you want the customizer to appear.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            <code className="font-code text-sm text-muted-foreground">
              {embedCode}
            </code>
          </pre>
        </div>
        <DialogFooter>
          <Button onClick={handleCopy} variant="outline">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Code"}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="default">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
