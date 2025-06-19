
'use server';
/**
 * @fileOverview AI flow to composite multiple images onto a base image.
 *
 * - compositeImagesFlow - Function to call the flow.
 * - CompositeImagesInput - Input Zod schema.
 * - CompositeImagesOutput - Output Zod schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OverlayImageInputSchema = z.object({
  imageDataUri: z.string().url().describe('Data URI of the image to overlay.'),
  x: z.number().describe('X-coordinate percentage (0-100) for the center of the overlay image on the base image.'),
  y: z.number().describe('Y-coordinate percentage (0-100) for the center of the overlay image on the base image.'),
  scale: z.number().describe('Scale factor for the overlay image (e.g., 1.0 for original size).'),
  rotation: z.number().describe('Rotation in degrees for the overlay image.'),
  zIndex: z.number().optional().describe('Stacking order. Higher zIndex is more on top. Handled by order in array for this AI approach.'),
  name: z.string().optional().describe('Optional name/description of the overlay image element for context.'),
});
export type OverlayImageInput = z.infer<typeof OverlayImageInputSchema>;

export const CompositeImagesInputSchema = z.object({
  baseImageDataUri: z.string().url().describe('Data URI of the base image.'),
  overlayImages: z.array(OverlayImageInputSchema).describe('Array of images to overlay, already sorted by desired z-index (lowest first).'),
  outputWidthPx: z.number().optional().describe('Desired output width in pixels for the composite image. Model will approximate.'),
  outputHeightPx: z.number().optional().describe('Desired output height in pixels for the composite image. Model will approximate.'),
});
export type CompositeImagesInput = z.infer<typeof CompositeImagesInputSchema>;

export const CompositeImagesOutputSchema = z.object({
  compositeImageUrl: z.string().url().describe(
    "The data URI of the generated composite image. Expected format: 'data:image/png;base64,<encoded_data>'."
  ),
  description: z.string().optional().describe('A brief description of the composite image generation process or result.'),
});
export type CompositeImagesOutput = z.infer<typeof CompositeImagesOutputSchema>;

export async function compositeImagesFlow(
  input: CompositeImagesInput
): Promise<CompositeImagesOutput> {
  return definedCompositeImagesFlow(input);
}

const model = 'googleai/gemini-2.0-flash-exp'; // Image generation capable model

// Helper function to describe position
function describePosition(x: number, y: number): string {
  let yDesc = y < 33 ? 'top' : y < 66 ? 'middle' : 'bottom';
  let xDesc = x < 33 ? 'left' : x < 66 ? 'center' : 'right';

  if (yDesc === 'middle' && xDesc === 'center') return 'center';
  if (yDesc === 'middle') return `middle ${xDesc}`;
  if (xDesc === 'center') return `${yDesc} center`;
  return `${yDesc}-${xDesc}`;
}

const definedCompositeImagesFlow = ai.defineFlow(
  {
    name: 'compositeImagesFlow',
    inputSchema: CompositeImagesInputSchema,
    outputSchema: CompositeImagesOutputSchema,
  },
  async (input) => {
    const promptParts: any[] = [
      { media: { url: input.baseImageDataUri } },
      { text: `You are an expert image compositor. Your task is to generate a single, high-quality composite image by overlaying several elements onto the provided base image.
The base image is the first image provided.
Each subsequent overlay image should be placed according to its description.
The overlay images are provided in the order they should be stacked (bottom-most first, then next one on top, and so on).
Ensure all overlay images have transparent backgrounds unless their content is inherently opaque.
The final output image should ideally be ${input.outputWidthPx || 'around 500'} pixels wide and ${input.outputHeightPx || 'around 500'} pixels high, maintaining the aspect ratio of the base image if possible.
Let's begin the overlay process:` },
    ];

    input.overlayImages.forEach((overlay, index) => {
      promptParts.push({ media: { url: overlay.imageDataUri } });
      const positionDescription = describePosition(overlay.x, overlay.y);
      const nameHint = overlay.name ? ` (element: ${overlay.name})` : '';
      
      let instructionText = `Overlay Instruction ${index + 1}${nameHint}:
Place the preceding image onto the current composite.
Its center should be positioned at approximately ${positionDescription} of the base canvas (X: ${overlay.x.toFixed(1)}%, Y: ${overlay.y.toFixed(1)}%).
Scale the image by a factor of ${overlay.scale.toFixed(2)}.
Rotate the image by ${overlay.rotation.toFixed(0)} degrees.
This image should appear on top of previously overlaid images.
`;
      promptParts.push({ text: instructionText });
    });

    promptParts.push({ text: "Generate the final composite image based on all prior instructions." });

    try {
      const { text: aiDescription, media } = await ai.generate({
        model: model,
        prompt: promptParts,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // Expecting an image and maybe a text description
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
        const errorMsg = `Image compositing failed. Model did not return an image. AI Text: ${aiDescription}`;
        console.error(errorMsg, { input });
        throw new Error(errorMsg);
      }

      return {
        compositeImageUrl: imageUrl,
        description: aiDescription || "Image composited successfully.",
      };
    } catch (error: any) {
      console.error(`Error in compositeImagesFlow: ${error.message || error}`, { input, error });
      throw new Error(`AI Image Compositing Error: ${error.message || 'An unexpected error occurred.'}`);
    }
  }
);
