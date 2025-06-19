
'use server';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { promises as fs } from 'fs';

// Schema definitions (assuming they remain the same for input validation)
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
  textDecoration: z.string().optional(), // Note: basic canvas won't easily do underline
  textTransform: z.string().optional(), // Note: canvas needs manual implementation
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
  archAmount: z.number().optional(), // Note: Arching is very complex for basic canvas
  // Shape specific
  shapeType: z.string().optional(),
  width: z.number().optional(), // Base width for shapes, also used for images if needed
  height: z.number().optional(), // Base height for shapes, also used for images if needed
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
  widthPx: z.number().optional().describe('Canvas width in pixels. Defaults to 500.'),
  heightPx: z.number().optional().describe('Canvas height in pixels. Defaults to 500.'),
});

// Simple font mapping (extend this as needed)
// Note: For production, you'd need robust font loading/availability on the server.
const mapFontFamily = (fontFamily?: string): string => {
  if (!fontFamily) return 'sans-serif';
  const lowerFamily = fontFamily.toLowerCase();
  if (lowerFamily.includes('arial')) return 'Arial';
  if (lowerFamily.includes('helvetica')) return 'Helvetica';
  if (lowerFamily.includes('times new roman')) return 'Times New Roman';
  if (lowerFamily.includes('georgia')) return 'Georgia';
  if (lowerFamily.includes('courier new')) return 'Courier New';
  // Add more mappings or fallback to a generic one
  return 'sans-serif'; // Default fallback
};

// TODO: Implement font registration if font files are available in the project
// Example: registerFont(path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf'), { family: 'Roboto' });
// For now, we'll rely on system fonts or simple mappings.

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

    const canvas = createCanvas(widthPx, heightPx);
    const ctx = canvas.getContext('2d');

    // 1. Draw base image
    try {
      const baseImage = await loadImage(baseImageDataUri);
      // Calculate aspect ratios to fit and center the base image
      const canvasAspectRatio = widthPx / heightPx;
      const imageAspectRatio = baseImage.width / baseImage.height;
      let drawWidth, drawHeight, drawX, drawY;

      if (canvasAspectRatio > imageAspectRatio) { // Canvas is wider than image
        drawHeight = heightPx;
        drawWidth = baseImage.width * (heightPx / baseImage.height);
        drawX = (widthPx - drawWidth) / 2;
        drawY = 0;
      } else { // Canvas is taller or same aspect ratio
        drawWidth = widthPx;
        drawHeight = baseImage.height * (widthPx / baseImage.width);
        drawX = 0;
        drawY = (heightPx - drawHeight) / 2;
      }
      ctx.drawImage(baseImage, drawX, drawY, drawWidth, drawHeight);
    } catch (e: any) {
      console.error(`Failed to load base image: ${baseImageDataUri}`, e.message);
      return NextResponse.json({ error: 'Failed to load base image.', details: e.message }, { status: 500 });
    }

    // 2. Sort elements by zIndex
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 3. Draw each element
    for (const element of sortedElements) {
      ctx.save(); // Save current state (transformations, styles)

      // Calculate element center in pixels
      const elCenterX = (element.x / 100) * widthPx;
      const elCenterY = (element.y / 100) * heightPx;

      // Apply transformations - translate to element center, rotate, scale, then translate back
      ctx.translate(elCenterX, elCenterY);
      ctx.rotate((element.rotation * Math.PI) / 180);
      // Note: node-canvas scale is uniform. If separate X/Y scale needed, it's more complex.
      // We'll use element.scale for uniform scaling.

      if (element.type === 'image' && element.imageDataUri) {
        try {
          const img = await loadImage(element.imageDataUri);
          const scaledWidth = (element.width || img.width) * element.scale;
          const scaledHeight = (element.height || img.height) * element.scale;
          ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        } catch (e: any) {
          console.error(`Failed to load element image: ${element.imageDataUri}`, e.message);
          // Optionally skip this element or draw a placeholder
        }
      } else if (element.type === 'text' && element.content) {
        const fontSize = (element.fontSize || 24) * element.scale; // Apply scale to font size
        const fontFamily = mapFontFamily(element.fontFamily);
        ctx.font = `${element.fontWeight || 'normal'} ${element.fontStyle || 'normal'} ${fontSize}px "${fontFamily}"`;
        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Basic text transformation (uppercase/lowercase)
        let contentToDraw = element.content;
        if (element.textTransform === 'uppercase') {
          contentToDraw = contentToDraw.toUpperCase();
        } else if (element.textTransform === 'lowercase') {
          contentToDraw = contentToDraw.toLowerCase();
        }
        
        // Simple outline
        if (element.outlineEnabled && element.outlineWidth && element.outlineWidth > 0 && element.outlineColor) {
            ctx.strokeStyle = element.outlineColor;
            ctx.lineWidth = element.outlineWidth * element.scale; // Scale outline width too
            ctx.strokeText(contentToDraw, 0, 0);
        }
        // Simple shadow (note: canvas shadow affects subsequent drawing unless reset)
        if (element.shadowEnabled && element.shadowColor) {
            ctx.shadowColor = element.shadowColor;
            ctx.shadowOffsetX = (element.shadowOffsetX || 0) * element.scale;
            ctx.shadowOffsetY = (element.shadowOffsetY || 0) * element.scale;
            ctx.shadowBlur = (element.shadowBlur || 0) * element.scale;
        }
        
        ctx.fillText(contentToDraw, 0, 0);

        // Reset shadow for next element
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

      } else if (element.type === 'shape' && element.shapeType) {
        const shapeWidth = (element.width || 100) * element.scale;
        const shapeHeight = (element.height || 100) * element.scale;
        
        ctx.fillStyle = element.color || '#CCCCCC';
        if (element.outlineEnabled && element.outlineWidth && element.outlineWidth > 0 && element.outlineColor) {
          ctx.strokeStyle = element.outlineColor;
          ctx.lineWidth = element.outlineWidth; // No separate scale for stroke width in this simple version
        } else {
            ctx.strokeStyle = 'transparent'; // ensure no stroke if not enabled
            ctx.lineWidth = 0;
        }

        if (element.shapeType === 'rectangle') {
          ctx.beginPath();
          ctx.rect(-shapeWidth / 2, -shapeHeight / 2, shapeWidth, shapeHeight);
          ctx.fill();
          if (element.outlineEnabled && element.outlineWidth && element.outlineWidth > 0) ctx.stroke();
        } else if (element.shapeType === 'circle') {
          ctx.beginPath();
          // For a circle, width and height are effectively the diameter
          const radius = Math.min(shapeWidth, shapeHeight) / 2;
          ctx.arc(0, 0, radius, 0, 2 * Math.PI);
          ctx.fill();
          if (element.outlineEnabled && element.outlineWidth && element.outlineWidth > 0) ctx.stroke();
        }
      }
      ctx.restore(); // Restore to state before this element's transformations
    }

    const previewImageUrl = canvas.toDataURL('image/png');
    return NextResponse.json({ previewImageUrl });

  } catch (error: any) {
    console.error('Error in /api/preview (non-AI):', error);
    // Ensure error.message is a string
    const message = typeof error.message === 'string' ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to generate non-AI preview.', details: message },
      { status: 500 }
    );
  }
}
