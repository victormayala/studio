
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateTextImageFlow,
  type GenerateTextImageInput,
} from '@/ai/flows/generate-text-image';
import {
  generateShapeImageFlow,
  type GenerateShapeImageInput,
} from '@/ai/flows/generate-shape-image';
import {
  compositeImagesFlow,
  type CompositeImagesInput,
  type OverlayImageInput,
} from '@/ai/flows/composite-images';

const ElementSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'text', 'shape']),
  // Image specific
  imageDataUri: z.string().url().optional(),
  // Text specific
  content: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(), // Also for shape fill
  fontWeight: z.string().optional(),
  fontStyle: z.string().optional(),
  textDecoration: z.string().optional(),
  textTransform: z.string().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  outlineEnabled: z.boolean().optional(),
  outlineColor: z.string().optional(), // Also for shape stroke
  outlineWidth: z.number().optional(), // Also for shape stroke
  shadowEnabled: z.boolean().optional(),
  shadowColor: z.string().optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  shadowBlur: z.number().optional(),
  archAmount: z.number().optional(),
  // Shape specific
  shapeType: z.string().optional(), // Using string for flexibility with ShapeType type
  width: z.number().optional(), // Base width for shapes
  height: z.number().optional(), // Base height for shapes
  // Common transform
  x: z.number(), // percentage
  y: z.number(), // percentage
  scale: z.number(),
  rotation: z.number(),
  zIndex: z.number(),
});
type ElementData = z.infer<typeof ElementSchema>;

const PreviewRequestSchema = z.object({
  baseImageDataUri: z.string().url().describe('Data URI of the base product image.'),
  elements: z.array(ElementSchema).describe('Array of customization elements to overlay.'),
  widthPx: z.number().optional().describe('Optional: The width of the canvas in pixels where percentages for x,y were calculated. Defaults to 500 if not provided.'),
  heightPx: z.number().optional().describe('Optional: The height of the canvas in pixels where percentages for x,y were calculated. Defaults to 500 if not provided.'),
});
type PreviewRequest = z.infer<typeof PreviewRequestSchema>;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = PreviewRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('Invalid preview request body:', validationResult.error.flatten());
      return NextResponse.json(
        { error: 'Invalid request body.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { baseImageDataUri, elements, widthPx = 500, heightPx = 500 } = validationResult.data;
    const overlayImages: OverlayImageInput[] = [];

    // Process elements: generate images for text and shapes
    const elementProcessingPromises = elements.map(async (element) => {
      let elementImageDataUri = '';
      let elementName = `element-${element.id}`;

      if (element.type === 'image' && element.imageDataUri) {
        elementImageDataUri = element.imageDataUri;
        elementName = `custom-image-${element.id}`;
      } else if (element.type === 'text') {
        const textInput: GenerateTextImageInput = {
          content: element.content || 'Text',
          fontFamily: element.fontFamily || 'Arial',
          fontSize: element.fontSize || 24,
          color: element.color || '#000000',
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          textDecoration: element.textDecoration || 'none',
          textTransform: element.textTransform || 'none',
          outlineEnabled: element.outlineEnabled || false,
          outlineColor: element.outlineColor || '#FFFFFF',
          outlineWidth: element.outlineWidth || 0,
          shadowEnabled: element.shadowEnabled || false,
          shadowColor: element.shadowColor || '#000000',
          shadowOffsetX: element.shadowOffsetX || 0,
          shadowOffsetY: element.shadowOffsetY || 0,
          shadowBlur: element.shadowBlur || 0,
          // archAmount: element.archAmount || 0, // Arch effect is very hard for current genAI models
        };
        try {
          const result = await generateTextImageFlow(textInput);
          elementImageDataUri = result.imageDataUri;
          elementName = `text-${element.id}`;
        } catch (e: any) {
          console.error(`Failed to generate image for text element ${element.id}: ${e.message}`);
          // Skip this element or use a placeholder? For now, skip.
          return null;
        }
      } else if (element.type === 'shape' && element.shapeType) {
        const shapeInput: GenerateShapeImageInput = {
          shapeType: element.shapeType as 'rectangle' | 'circle', // Cast for now
          color: element.color || '#CCCCCC',
          strokeColor: element.outlineColor || '#000000',
          strokeWidth: element.outlineWidth || 0,
          width: element.width || 100, // provide base dimensions for shape generation
          height: element.height || 100,
        };
         try {
          const result = await generateShapeImageFlow(shapeInput);
          elementImageDataUri = result.imageDataUri;
          elementName = `shape-${element.id}`;
        } catch (e: any) {
          console.error(`Failed to generate image for shape element ${element.id}: ${e.message}`);
          // Skip this element
          return null;
        }
      }

      if (elementImageDataUri) {
        return {
          imageDataUri: elementImageDataUri,
          x: element.x,
          y: element.y,
          scale: element.scale,
          rotation: element.rotation,
          zIndex: element.zIndex,
          name: elementName,
        };
      }
      return null;
    });

    const processedElements = (await Promise.all(elementProcessingPromises)).filter(
      (el): el is OverlayImageInput => el !== null
    );
    
    // Sort by zIndex before passing to composite flow
    processedElements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));


    const compositeInput: CompositeImagesInput = {
      baseImageDataUri,
      overlayImages: processedElements,
      outputWidthPx: widthPx,
      outputHeightPx: heightPx,
    };

    const compositeResult = await compositeImagesFlow(compositeInput);

    return NextResponse.json({ previewImageUrl: compositeResult.compositeImageUrl });
  } catch (error: any) {
    console.error('Error in /api/preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview.', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
