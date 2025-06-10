
export interface ClipartItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string; // e.g., 'image/png'
  aiHint: string;
}

export const clipartData: ClipartItem[] = [
  {
    id: 'clipart-star-1',
    name: 'Yellow Star',
    imageUrl: 'https://placehold.co/100x100/FFEB3B/000000.png?text=\u2605', // Yellow star
    type: 'image/png',
    aiHint: 'yellow star',
  },
  {
    id: 'clipart-heart-1',
    name: 'Red Heart',
    imageUrl: 'https://placehold.co/100x100/F44336/FFFFFF.png?text=\u2764', // Red heart
    type: 'image/png',
    aiHint: 'red heart',
  },
  {
    id: 'clipart-smiley-1',
    name: 'Smiley Face',
    imageUrl: 'https://placehold.co/100x100/FFC107/000000.png?text=\u263A', // Smiley face
    type: 'image/png',
    aiHint: 'smiley face',
  },
  {
    id: 'clipart-arrow-1',
    name: 'Blue Arrow',
    imageUrl: 'https://placehold.co/100x100/2196F3/FFFFFF.png?text=\u279C', // Right arrow
    type: 'image/png',
    aiHint: 'blue arrow',
  },
  {
    id: 'clipart-speech-bubble-1',
    name: 'Speech Bubble',
    imageUrl: 'https://placehold.co/100x100/4CAF50/FFFFFF.png?text=\uD83D\uDCAC', // Speech bubble
    type: 'image/png',
    aiHint: 'speech bubble',
  },
  {
    id: 'clipart-sun-1',
    name: 'Bright Sun',
    imageUrl: 'https://placehold.co/100x100/FF9800/000000.png?text=\u2600', // Sun
    type: 'image/png',
    aiHint: 'bright sun',
  },
];
