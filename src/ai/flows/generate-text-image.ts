
'use server';
/**
 * @fileOverview Generates an image of text with a transparent background.
 *
 * - generateTextImageFlow - Function to call the flow.
 * - GenerateTextImageInput - Input Zod schema.
 * - GenerateTextImageOutput - Output Zod schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateTextImageInputSchema = z.object({
  content: z.string().describe('The text content to render.'),
  fontFamily: z.string().default('Arial').describe('Approximate font family (e.g., Arial, Times New Roman, Comic Sans MS). Model will try to match style.'),
  fontSize: z.number().default(48).describe('Approximate font size. This influences the general scale.'),
  color: z.string().default('#000000').regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color string").describe('Text color as a hex string (e.g., #FF0000).'),
  fontWeight: z.string().default('normal').describe("Font weight (e.g., 'normal', 'bold')."),
  fontStyle: z.string().default('normal').describe("Font style (e.g., 'normal', 'italic')."),
  textDecoration: z.string().default('none').describe("Text decoration (e.g., 'none', 'underline')."),
  textTransform: z.string().default('none').describe("Text transform (e.g., 'none', 'uppercase', 'lowercase')."),
  // Simplified effects for AI image generation
  outlineEnabled: z.boolean().default(false).describe("Whether the text has an outline."),
  outlineColor: z.string().default('#FFFFFF').regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color string").describe('Outline color if enabled.'),
  outlineWidth: z.number().default(0).describe('Approximate outline width if enabled (relative to font size, e.g. 0.1 for 10% of font size).'),
  shadowEnabled: z.boolean().default(false).describe("Whether the text has a shadow."),
  shadowColor: z.string().default('#000000').regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color string").describe('Shadow color if enabled.'),
  shadowOffsetX: z.number().default(0).describe('Shadow X offset.'),
  shadowOffsetY: z.number().default(0).describe('Shadow Y offset.'),
  shadowBlur: z.number().default(0).describe('Shadow blur radius.'),
  // archAmount: z.number().default(0).describe('Arch effect amount. Positive for upward arch, negative for downward. (Currently hard for AI to render)'),
});
export type GenerateTextImageInput = z.infer<typeof GenerateTextImageInputSchema>;

export const GenerateTextImageOutputSchema = z.object({
  imageDataUri: z.string().url().describe(
    "The data URI of the generated text image with a transparent background. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
  description: z.string().describe('A brief description of the rendered text, e.g., for alt text.'),
});
export type GenerateTextImageOutput = z.infer<typeof GenerateTextImageOutputSchema>;

export async function generateTextImageFlow(
  input: GenerateTextImageInput
): Promise<GenerateTextImageOutput> {
  return definedGenerateTextImageFlow(input);
}

const model = 'googleai/gemini-2.0-flash-exp'; // Image generation capable model

const definedGenerateTextImageFlow = ai.defineFlow(
  {
    name: 'generateTextImageFlow',
    inputSchema: GenerateTextImageInputSchema,
    outputSchema: GenerateTextImageOutputSchema,
  },
  async (input) => {
    let effectsDescription = "";
    if (input.outlineEnabled && input.outlineWidth > 0) {
      effectsDescription += ` It has an outline of color ${input.outlineColor} and approximate thickness relative to font size of ${input.outlineWidth}.`;
    }
    if (input.shadowEnabled && (input.shadowOffsetX !== 0 || input.shadowOffsetY !== 0 || input.shadowBlur !== 0)) {
      effectsDescription += ` It has a shadow of color ${input.shadowColor}, with an offset of (${input.shadowOffsetX}, ${input.shadowOffsetY}) and blur radius ${input.shadowBlur}.`;
    }
    // Arch effect is too complex for reliable AI text rendering for now.
    // if (input.archAmount !== 0) {
    //   effectsDescription += ` The text should be arched ${input.archAmount > 0 ? 'upwards' : 'downwards'} with an intensity of ${Math.abs(input.archAmount)}.`;
    // }

    const promptText = `Generate an image of ONLY the following text: "${input.content}".
The text should have a style similar to the font family "${input.fontFamily}".
The text color should be ${input.color}.
The approximate font size should be large, suitable for an isolated element, reflecting a base size of ${input.fontSize} units.
The text should have font weight "${input.fontWeight}", font style "${input.fontStyle}", text decoration "${input.textDecoration}", and text transform "${input.textTransform}".
${effectsDescription}
The background of the image MUST be transparent (like a PNG with an alpha channel). Do NOT generate any other background color or elements.
Focus on rendering the text clearly and accurately with the specified styles against a transparent background.`;

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
        const errorMsg = `Text-to-image generation failed for: "${input.content}". Model did not return an image. AI Text: ${aiDescription}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      return {
        imageDataUri: imageUrl,
        description: aiDescription || `Rendered text: ${input.content.substring(0,50)}`,
      };
    } catch (error: any) {
      console.error(`Error in generateTextImageFlow for text "${input.content.substring(0,50)}": ${error.message || error}`, error);
      throw new Error(`AI Text-to-Image Generation Error: ${error.message || 'An unexpected error occurred.'}`);
    }
  }
);
