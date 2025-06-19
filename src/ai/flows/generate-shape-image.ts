
'use server';
/**
 * @fileOverview Generates an image of a shape with a transparent background.
 *
 * - generateShapeImageFlow - Function to call the flow.
 * - GenerateShapeImageInput - Input Zod schema.
 * - GenerateShapeImageOutput - Output Zod schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateShapeImageInputSchema = z.object({
  shapeType: z.enum(['rectangle', 'circle' /*, 'triangle', 'star' */]).describe('The type of shape to render.'),
  color: z.string().default('#CCCCCC').regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color string").describe('Fill color of the shape as a hex string.'),
  strokeColor: z.string().default('#000000').regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color string").describe('Stroke color of the shape as a hex string.'),
  strokeWidth: z.number().default(0).min(0).max(20).describe('Stroke width in pixels (0 for no stroke).'),
  width: z.number().default(100).min(10).describe('Base width of the shape in pixels for aspect ratio purposes.'),
  height: z.number().default(100).min(10).describe('Base height of the shape in pixels for aspect ratio purposes.'),
});
export type GenerateShapeImageInput = z.infer<typeof GenerateShapeImageInputSchema>;

export const GenerateShapeImageOutputSchema = z.object({
  imageDataUri: z.string().url().describe(
    "The data URI of the generated shape image with a transparent background. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
  description: z.string().describe('A brief description of the rendered shape, e.g., for alt text.'),
});
export type GenerateShapeImageOutput = z.infer<typeof GenerateShapeImageOutputSchema>;

export async function generateShapeImageFlow(
  input: GenerateShapeImageInput
): Promise<GenerateShapeImageOutput> {
  return definedGenerateShapeImageFlow(input);
}

const model = 'googleai/gemini-2.0-flash-exp'; // Image generation capable model

const definedGenerateShapeImageFlow = ai.defineFlow(
  {
    name: 'generateShapeImageFlow',
    inputSchema: GenerateShapeImageInputSchema,
    outputSchema: GenerateShapeImageOutputSchema,
  },
  async (input) => {
    let strokeDescription = "";
    if (input.strokeWidth > 0) {
      strokeDescription = ` It should have a stroke (outline) of color ${input.strokeColor} with a thickness of ${input.strokeWidth} pixels.`;
    }
    const aspectRatioDescription = input.width === input.height && input.shapeType !== 'circle' ? 
                                   'The shape should be perfectly square.' : 
                                   `The shape should have an aspect ratio of approximately ${input.width} width to ${input.height} height.`;


    const promptText = `Generate an image of ONLY a single, centered ${input.shapeType}.
The ${input.shapeType} should be filled with the color ${input.color}.
${strokeDescription}
${input.shapeType !== 'circle' ? aspectRatioDescription : 'The circle should be perfectly round.'}
The background of the image MUST be transparent (like a PNG with an alpha channel). Do NOT generate any other background color or elements.
Focus on rendering the shape clearly and accurately with the specified styles against a transparent background. The shape should be relatively large within the image frame.`;

    try {
      const { text: aiDescription, media } = await ai.generate({
        model: model,
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
           safetySettings: [ // Standard safety settings
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      const imageUrl = media?.url;
      if (!imageUrl) {
        const errorMsg = `Shape-to-image generation failed for: ${input.shapeType}. Model did not return an image. AI Text: ${aiDescription}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return {
        imageDataUri: imageUrl,
        description: aiDescription || `Rendered ${input.shapeType} shape.`,
      };
    } catch (error: any) {
      console.error(`Error in generateShapeImageFlow for shape "${input.shapeType}": ${error.message || error}`, error);
      throw new Error(`AI Shape-to-Image Generation Error: ${error.message || 'An unexpected error occurred.'}`);
    }
  }
);
