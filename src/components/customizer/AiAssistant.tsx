
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Play, RefreshCcwIcon } from "lucide-react";
import { generateDesignFromPrompt, type GenerateDesignFromPromptInput, type GenerateDesignFromPromptOutput } from '@/ai/flows/generate-design-from-prompt';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUploads } from '@/contexts/UploadContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AiAssistantProps {
  activeViewId: string | null;
}

export default function AiAssistant({ activeViewId }: AiAssistantProps) {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageDataUrl, setGeneratedImageDataUrl] = useState<string | null>(null);
  const [generatedImageDescription, setGeneratedImageDescription] = useState<string | null>(null);
  
  const { addCanvasImageFromUrl } = useUploads();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) {
      setError("Please enter a design idea.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImageDataUrl(null);
    setGeneratedImageDescription(null);

    try {
      const input: GenerateDesignFromPromptInput = { userPrompt: promptText };
      const result: GenerateDesignFromPromptOutput = await generateDesignFromPrompt(input);
      setGeneratedImageDataUrl(result.generatedImageUrl);
      setGeneratedImageDescription(result.generatedImageDescription);
    } catch (err) {
      console.error("AI design generation error:", err);
      let errorMessage = "Failed to generate design. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        title: "Design Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDesign = () => {
    if (!generatedImageDataUrl || !activeViewId) {
      toast({
        title: "Error",
        description: !activeViewId ? "Please select a product view first." : "No generated design to use.",
        variant: "destructive",
      });
      return;
    }
    const imageName = generatedImageDescription || `AI Design: ${promptText.substring(0, 20)}`;
    addCanvasImageFromUrl(imageName, generatedImageDataUrl, 'image/png', activeViewId, `ai_gen_${Date.now()}`);
    toast({
      title: "Design Added",
      description: "The AI generated design has been added to your canvas.",
    });
    // Reset after using
    setGeneratedImageDataUrl(null);
    setGeneratedImageDescription(null);
    setPromptText(''); // Clear the input box
  };

  const handleTryAgain = () => {
    setGeneratedImageDataUrl(null);
    setGeneratedImageDescription(null);
    setError(null); 
    // Keep promptText so user can modify it
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="designIdeaPrompt" className="block text-sm font-medium text-foreground mb-1">
            Enter your design idea:
          </Label>
          <Textarea
            id="designIdeaPrompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="e.g., a cute cat wearing sunglasses, a retro sunset over mountains..."
            rows={3}
            className="bg-background"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !promptText.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Design
        </Button>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center py-4 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating your design... this may take a moment.</p>
        </div>
      )}

      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertTitle>Generation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generatedImageDataUrl && !isLoading && (
        <div className="space-y-3 p-3 border rounded-md bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground">Generated Design Preview:</h3>
           <div className="relative w-full aspect-square rounded-md overflow-hidden border bg-background">
            <Image 
              src={generatedImageDataUrl} 
              alt={generatedImageDescription || "AI Generated Design Preview"} 
              fill 
              className="object-contain"
              data-ai-hint={generatedImageDescription?.split(" ").slice(0,2).join(" ") || "ai generated"}
            />
          </div>
          {generatedImageDescription && (
            <p className="text-xs text-muted-foreground italic">Description: {generatedImageDescription}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Button onClick={handleUseDesign} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <Play className="mr-2 h-4 w-4" /> Use this Design
            </Button>
            <Button onClick={handleTryAgain} variant="outline" className="flex-1">
              <RefreshCcwIcon className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      )}
      
       {!isLoading && !error && !generatedImageDataUrl && (
         <div className={cn("flex flex-col items-center justify-center text-center py-4", promptText ? "hidden": "")}>
            <p className="text-sm text-muted-foreground italic">Enter a prompt above to generate a design.</p>
         </div>
      )}
    </div>
  );
}
