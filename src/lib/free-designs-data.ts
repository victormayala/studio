
export interface FreeDesignItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string; // e.g., 'image/png'
  aiHint: string;
}

export const freeDesignsData: FreeDesignItem[] = [
  {
    id: 'free-design-abstract-1',
    name: 'Abstract Waves',
    imageUrl: '/free-designs/abstract-waves.png',
    type: 'image/png',
    aiHint: 'abstract waves',
  },
  {
    id: 'free-design-geometric-1',
    name: 'Geometric Pattern',
    imageUrl: '/free-designs/geometric-pattern.png',
    type: 'image/png',
    aiHint: 'geometric pattern',
  },
  {
    id: 'free-design-floral-1',
    name: 'Simple Floral',
    imageUrl: '/free-designs/simple-floral.png',
    type: 'image/png',
    aiHint: 'floral pattern',
  },
  {
    id: 'free-design-tech-1',
    name: 'Tech Lines',
    imageUrl: '/free-designs/tech-lines.png',
    type: 'image/png',
    aiHint: 'tech lines',
  },
  {
    id: 'free-design-badge-1',
    name: 'Circular Badge',
    imageUrl: '/free-designs/circular-badge.png',
    type: 'image/png',
    aiHint: 'circular badge',
  },
   {
    id: 'free-design-holiday-1',
    name: 'Festive Pattern',
    imageUrl: '/free-designs/festive-pattern.png',
    type: 'image/png',
    aiHint: 'holiday pattern',
  },
];
