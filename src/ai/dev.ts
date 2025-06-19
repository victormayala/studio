
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-design-elements.ts';
import '@/ai/flows/generate-design-ideas.ts';
import '@/ai/flows/generate-design-from-prompt.ts';
import '@/ai/flows/make-background-transparent.ts'; // Added new flow
import '@/ai/flows/generate-text-image.ts'; // New: For preview API
import '@/ai/flows/generate-shape-image.ts'; // New: For preview API
import '@/ai/flows/composite-images.ts'; // New: For preview API
