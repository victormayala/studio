// src/ai/flows/suggest-design-elements.ts
'use server';

/**
 * @fileOverview AI-powered design element suggestion flow.
 *
 * This file defines a Genkit flow that analyzes the current design composition on the canvas
 * and suggests relevant design elements (clipart, shapes, free designs, etc.) to enhance the design.
 *
 * @param {SuggestDesignElementsInput} input - The input data containing the current design composition.
 * @returns {Promise<SuggestDesignElementsOutput>} - A promise that resolves with the AI's design element suggestions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const SuggestDesignElementsInputSchema = z.object({
  designComposition: z
    .string()
    .describe('A description of the current design composition on the canvas.'),
});

export type SuggestDesignElementsInput = z.infer<typeof SuggestDesignElementsInputSchema>;

// Define the output schema
const SuggestDesignElementsOutputSchema = z.object({
  suggestedElements: z
    .array(z.string())
    .describe('An array of suggested design elements based on the composition.'),
});

export type SuggestDesignElementsOutput = z.infer<typeof SuggestDesignElementsOutputSchema>;

// Exported function to call the flow
export async function suggestDesignElements(
  input: SuggestDesignElementsInput
): Promise<SuggestDesignElementsOutput> {
  return suggestDesignElementsFlow(input);
}

// Define the prompt
const suggestDesignElementsPrompt = ai.definePrompt({
  name: 'suggestDesignElementsPrompt',
  input: {schema: SuggestDesignElementsInputSchema},
  output: {schema: SuggestDesignElementsOutputSchema},
  prompt: `You are an AI design assistant. Analyze the current design composition described below and suggest relevant design elements (clipart, shapes, free designs, etc.) that the user can add to enhance their design.

Design Composition: {{{designComposition}}}

Suggestions:`, // Prompt to guide the AI
});

// Define the flow
const suggestDesignElementsFlow = ai.defineFlow(
  {
    name: 'suggestDesignElementsFlow',
    inputSchema: SuggestDesignElementsInputSchema,
    outputSchema: SuggestDesignElementsOutputSchema,
  },
  async input => {
    const {output} = await suggestDesignElementsPrompt(input);
    return output!;
  }
);
