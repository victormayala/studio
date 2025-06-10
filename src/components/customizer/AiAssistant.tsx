"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { suggestDesignElements, type SuggestDesignElementsInput, type SuggestDesignElementsOutput } from '@/ai/flows/suggest-design-elements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiAssistant() {
  const [designComposition, setDesignComposition] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const input: SuggestDesignElementsInput = { designComposition };
      const result: SuggestDesignElementsOutput = await suggestDesignElements(input);
      setSuggestions(result.suggestedElements);
    } catch (err) {
      console.error("AI suggestion error:", err);
      setError("Failed to get suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="designComposition" className="block text-sm font-medium text-foreground mb-1">
            Describe your current design:
          </Label>
          <Textarea
            id="designComposition"
            value={designComposition}
            onChange={(e) => setDesignComposition(e.target.value)}
            placeholder="e.g., A birthday card with a blue background and a cake..."
            rows={3}
            className="bg-background"
          />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Get Suggestions
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-foreground font-headline">Suggested Elements:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
       {!isLoading && suggestions.length === 0 && !error && designComposition && (
        <p className="text-sm text-muted-foreground text-center italic">No suggestions yet. Describe your design and click "Get Suggestions".</p>
      )}
    </div>
  );
}
