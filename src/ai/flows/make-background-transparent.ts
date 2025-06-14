
'use server';
/**
 * @fileOverview An AI flow to attempt to make the background of an image transparent.
 *
 * - makeBackgroundTransparent - Takes an image data URI and tries to return a new one with a transparent background.
 * - MakeBackgroundTransparentInput - Input schema type.
 * - MakeBackgroundTransparentOutput - Output schema type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schema is defined locally, not exported as a const.
const MakeBackgroundTransparentInputSchema = z.object({
  imageDataUri: z
    .string()
    .url()
    .describe(
      "The image data URI (e.g., 'data:image/png;base64,...') to process."
    ),
});
export type MakeBackgroundTransparentInput = z.infer<typeof MakeBackgroundTransparentInputSchema>;

// Schema is defined locally, not exported as a const.
const MakeBackgroundTransparentOutputSchema = z.object({
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
    inputSchema: MakeBackgroundTransparentInputSchema, // Uses local schema
    outputSchema: MakeBackgroundTransparentOutputSchema, // Uses local schema
  },
  async (input) => {
    const { text, media } = await ai.generate({
      model: model,
      prompt: [
        { media: { url: input.imageDataUri } },
        { text: "Analyze the provided image. Identify the main subject(s). Generate a new image that is a PNG with an alpha channel. In this new image, the main subject(s) from the original image must be accurately preserved, and the background surrounding the subject(s) must be made transparent. Do not add a solid color background; the area around the subject should be fully transparent (alpha channel)." }
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

