
import { NextResponse } from 'next/server';
import { compositeImages, type CompositeImagesInput, type ImageTransform } from '@/ai/flows/composite-images';
import { generateTextImage, type GenerateTextImageInput } from '@/ai/flows/generate-text-image';
import { generateShapeImage, type GenerateShapeImageInput } from '@/ai/flows/generate-shape-image';

interface PreviewElement {
  id: string;
  type: 'image' | 'text' | 'shape';
  viewId: string;
  dataUrl?: string; // For images
  content?: string; // For text
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  // Text style props
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  lineHeight?: number;
  letterSpacing?: number;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  archAmount?: number;
  // Shape props
  shapeType?: 'rectangle' | 'circle';
  strokeColor?: string;
  strokeWidth?: number;
  // Common props
  name?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  originalWidthPx?: number; 
  originalHeightPx?: number; 
}

interface PreviewRequestBody {
  baseImageDataUri: string;
  elements: PreviewElement[];
  widthPx: number; 
  heightPx: number; 
}

export async function POST(request: Request) {
  try {
    const body: PreviewRequestBody = await request.json();
    const { baseImageDataUri, elements, widthPx, heightPx } = body;

    if (!baseImageDataUri || !elements || !widthPx || !heightPx) {
      return NextResponse.json({ error: 'Missing required parameters: baseImageDataUri, elements, widthPx, heightPx.' }, { status: 400 });
    }

    const overlayTransforms: ImageTransform[] = [];

    for (const element of elements) {
      let imageDataUri: string | undefined = element.dataUrl;
      // let altTextForOverlay: string | undefined; // Not currently used by composite flow

      if (element.type === 'text' && element.content) {
        const textInput: GenerateTextImageInput = {
          text: element.content,
          fontFamily: element.fontFamily || 'Arial',
          fontSize: element.fontSize || 24,
          color: element.color || '#000000',
          // TODO: Pass more text style properties if generateTextImageFlow supports them
        };
        try {
          const { imageDataUri: textImgUri } = await generateTextImage(textInput);
          imageDataUri = textImgUri;
        } catch (textGenError: any) {
          console.warn(`Skipping text element "${element.content}" due to generation error: ${textGenError.message}`);
          continue;
        }
      } else if (element.type === 'shape' && element.shapeType) {
        const shapeInput: GenerateShapeImageInput = {
          shapeType: element.shapeType as 'rectangle' | 'circle',
          color: element.color || '#FF0000',
          strokeColor: element.strokeColor || '#000000',
          strokeWidth: element.strokeWidth || 0,
          aspectRatio: (element.originalWidthPx && element.originalHeightPx && element.originalHeightPx !== 0) 
            ? `${element.originalWidthPx / element.originalHeightPx}:1` 
            : '1:1',
        };
         try {
          const { imageDataUri: shapeImgUri } = await generateShapeImage(shapeInput);
          imageDataUri = shapeImgUri;
        } catch (shapeGenError: any) {
          console.warn(`Skipping shape element "${element.shapeType}" due to generation error: ${shapeGenError.message}`);
          continue;
        }
      }

      if (imageDataUri) {
        overlayTransforms.push({
          imageDataUri,
          x: element.x,
          y: element.y,
          scale: element.scale,
          rotation: element.rotation,
          zIndex: element.zIndex,
          originalWidthPx: element.originalWidthPx,
          originalHeightPx: element.originalHeightPx,
        });
      }
    }
    
    if (overlayTransforms.length === 0 && elements.length > 0 && !elements.some(el => el.type === 'image')) {
      // This means there were non-image elements but all failed generation
      console.warn("No valid image data could be prepared for compositing. All text/shape elements might have failed generation.");
      // Return base image if no overlays could be processed from text/shapes
      return NextResponse.json({ previewImageUrl: baseImageDataUri, altText: "Base image preview (overlay generation failed)." });
    }
    
    // If elements array was empty, or only contained images that were directly added, proceed.
    // If elements contained text/shapes and some or all were successfully converted, proceed.


    const compositeInput: CompositeImagesInput = {
      baseImageDataUri,
      baseImageWidthPx: widthPx,
      baseImageHeightPx: heightPx,
      overlays: overlayTransforms,
    };

    const { compositeImageUrl, altText } = await compositeImages(compositeInput);

    return NextResponse.json({ previewImageUrl: compositeImageUrl, altText: altText });

  } catch (error: any) {
    console.error('Error in /api/preview:', error);
    if (error.issues && Array.isArray(error.issues)) {
      const validationErrors = error.issues.map((issue: any) => `${issue.path.join('.')} - ${issue.message}`).join('; ');
      return NextResponse.json({ error: `Input validation failed: ${validationErrors}` }, { status: 400 });
    }
    return NextResponse.json({ error: `Preview generation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
    