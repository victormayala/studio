'use server';
/**
 * @fileOverview An AI flow to attempt to make the background of an image transparent.
 *
 * - makeBackgroundTransparent - Takes an image data URI and tries to return a new one with a transparent background.
 * - MakeBackgroundTransparentInput - Input schema.
 * - MakeBackgroundTransparentOutput - Output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const MakeBackgroundTransparentInputSchema = z.object({
  imageDataUri: z
    .string()
    .url()
    .describe(
      "The image data URI (e.g., 'data:image/png;base64,...') to process."
    ),
});
export type MakeBackgroundTransparentInput = z.infer<typeof MakeBackgroundTransparentInputSchema>;

export const MakeBackgroundTransparentOutputSchema = z.object({
  processedImageUrl: z.string().url().describe(
    "The data URI of the processed image, hopefully with a transparent background. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
  feedbackText: z.string().optional().describe("Feedback or status from the model about the operation.")
});
export type MakeBackgroundTransparentOutput = z.infer<typeof MakeBackgroundTransparentOutputSchema>;

export async function makeBackgroundTransparent(
  input: MakeBackgroundTransparentInput
): Promise<MakeBackgroundTransparentOutput> {
  return makeBackgroundTransparentFlow(input);
}

const model = 'googleai/gemini-2.0-flash-exp';

const makeBackgroundTransparentFlow = ai.defineFlow(
  {
    name: 'makeBackgroundTransparentFlow',
    inputSchema: MakeBackgroundTransparentInputSchema,
    outputSchema: MakeBackgroundTransparentOutputSchema,
  },
  async (input) => {
    const { text, media } = await ai.generate({
      model: model,
      prompt: [
        { media: { url: input.imageDataUri } },
        { text: `Analyze the provided image. Your primary task is to make the background of this image transparent, creating a PNG with an alpha channel. The main subject(s) of the image should be preserved accurately.

IMPORTANT:
- Do NOT add a solid white or any other color background as a substitute for true transparency.
- Focus on achieving a clean cutout of the main subject with a transparent background.
- If you are confident you have successfully made the background transparent, provide the modified image.
- If you cannot make the background transparent or are unsure, you should ideally return the original image data and clearly state in the text output that you could not perform the background removal or that the result might not be as requested.` }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
    });

    const imageUrl = media?.url;

    if (!imageUrl) {
      console.error('Background transparency processing failed or did not return an image. Text response:', text);
      throw new Error('Background transparency processing failed. The model might have refused the prompt or encountered an issue.');
    }

    return {
      processedImageUrl: imageUrl,
      feedbackText: text || "Background processing attempted."
    };
  }
);
