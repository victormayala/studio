
'use server';

/**
 * @fileOverview A design idea generator AI agent.
 *
 * - generateDesignIdeas - A function that generates design ideas based on a text prompt.
 * - GenerateDesignIdeasInput - The input type for the generateDesignIdeas function.
 * - GenerateDesignIdeasOutput - The return type for the generateDesignIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDesignIdeasInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired design.'),
});
export type GenerateDesignIdeasInput = z.infer<typeof GenerateDesignIdeasInputSchema>;

const GenerateDesignIdeasOutputSchema = z.object({
  designIdea: z.string().describe('A textual description of a design idea.'),
});
export type GenerateDesignIdeasOutput = z.infer<typeof GenerateDesignIdeasOutputSchema>;

export async function generateDesignIdeas(input: GenerateDesignIdeasInput): Promise<GenerateDesignIdeasOutput> {
  return generateDesignIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDesignIdeasPrompt',
  input: {schema: GenerateDesignIdeasInputSchema},
  output: {schema: GenerateDesignIdeasOutputSchema},
  prompt: `You are a design assistant that helps users to generate design ideas.
  Based on the prompt from the user, create a design idea, and describe it with text. 

  Prompt: {{{prompt}}} `,
});

const generateDesignIdeasFlow = ai.defineFlow(
  {
    name: 'generateDesignIdeasFlow',
    inputSchema: GenerateDesignIdeasInputSchema,
    outputSchema: GenerateDesignIdeasOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        const errMessage = 'AI model did not return the expected output for design ideas. Check server logs for prompt details and model response.';
        console.error(errMessage, { input });
        throw new Error(errMessage);
      }
      return output;
    } catch (error: any) {
      console.error(`Error in generateDesignIdeasFlow for prompt "${input.prompt}":`, error);
      throw new Error(`AI Design Idea Generation Error: ${error.message || 'An unexpected error occurred. Check server logs for more details.'}`);
    }
  }
);
