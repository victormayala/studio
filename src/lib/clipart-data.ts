
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
    imageUrl: '/clipart/yellow-star.png', 
    type: 'image/png',
    aiHint: 'yellow star',
  },
  {
    id: 'clipart-heart-1',
    name: 'Red Heart',
    imageUrl: '/clipart/red-heart.png', 
    type: 'image/png',
    aiHint: 'red heart',
  },
  {
    id: 'clipart-smiley-1',
    name: 'Smiley Face',
    imageUrl: '/clipart/smiley-face.png',
    type: 'image/png',
    aiHint: 'smiley face',
  },
  {
    id: 'clipart-arrow-1',
    name: 'Blue Arrow',
    imageUrl: '/clipart/blue-arrow.png',
    type: 'image/png',
    aiHint: 'blue arrow',
  },
  {
    id: 'clipart-speech-bubble-1',
    name: 'Speech Bubble',
    imageUrl: '/clipart/speech-bubble.png', 
    type: 'image/png',
    aiHint: 'speech bubble',
  },
  {
    id: 'clipart-sun-1',
    name: 'Bright Sun',
    imageUrl: '/clipart/bright-sun.png',
    type: 'image/png',
    aiHint: 'bright sun',
  },
];
