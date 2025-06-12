
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Clipboard, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customizerUrlPath?: string | null; // Changed from productId to customizerUrlPath
}

export function EmbedCodeModal({ isOpen, onOpenChange, customizerUrlPath }: EmbedCodeModalProps) {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [uniqueLink, setUniqueLink] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [appDomain, setAppDomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppDomain(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (customizerUrlPath && appDomain) {
      const link = `${appDomain}${customizerUrlPath.startsWith('/') ? '' : '/'}${customizerUrlPath}`;
      setUniqueLink(link);
      setEmbedCode(`<iframe src="${link}" width="100%" height="800px" frameborder="0" title="Product Customizer"></iframe>`);
    } else if (appDomain) {
      // Fallback for a generic customizer link if no specific path is provided
      const genericLink = `${appDomain}/customizer`;
      setUniqueLink(genericLink);
      setEmbedCode(`<iframe src="${genericLink}" width="100%" height="800px" frameborder="0" title="Product Customizer"></iframe> 
<!-- Note: For a product/user-specific customizer, ensure relevant parameters are in the customizer URL path when generating this code. -->`);
    } else {
      setUniqueLink("Loading link...");
      setEmbedCode("<!-- Loading embed code... -->");
    }
  }, [customizerUrlPath, appDomain]);

  const handleCopy = async (textToCopy: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
      toast({
        title: "Copied to clipboard!",
        description: `The ${type === 'link' ? 'unique link' : 'embed code'} has been copied.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Share & Embed Your Customizer</DialogTitle>
          <DialogDescription>
            {customizerUrlPath?.includes('productId') 
              ? `Use this link or embed code for the specific product customizer.` 
              : "Use this generic link or embed code. For a product-specific view, ensure the URL path includes a productId."}
             {customizerUrlPath?.includes('userId') && " The link also includes a user identifier."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 space-y-6">
          <div>
            <Label htmlFor="uniqueLink" className="text-sm font-medium flex items-center mb-1">
              <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Unique Link
            </Label>
            <div className="flex items-center gap-2">
              <Input id="uniqueLink" value={uniqueLink} readOnly className="bg-muted/50"/>
              <Button onClick={() => handleCopy(uniqueLink, 'link')} variant="outline" size="sm">
                {copiedLink ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                <span className="sr-only">Copy Link</span>
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="embedCodeTextarea" className="text-sm font-medium flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-muted-foreground"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              Embed Code (iframe)
            </Label>
            <div className="flex items-start gap-2">
              <textarea
                id="embedCodeTextarea"
                value={embedCode}
                readOnly
                rows={5}
                className="w-full rounded-md border border-input bg-muted/50 p-2 text-sm font-mono focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <Button onClick={() => handleCopy(embedCode, 'embed')} variant="outline" size="sm" className="mt-px">
                {copiedEmbed ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                <span className="sr-only">Copy Embed Code</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="default">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
