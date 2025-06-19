
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-design-elements.ts';
import '@/ai/flows/generate-design-ideas.ts';
import '@/ai/flows/generate-design-from-prompt.ts';
import '@/ai/flows/make-background-transparent.ts'; // Added new flow
// Removed imports for generate-text-image, generate-shape-image, and composite-images flows
// as their primary consumer (/api/preview with node-canvas) was removed.

