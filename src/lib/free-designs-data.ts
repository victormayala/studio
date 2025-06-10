
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
    imageUrl: 'https://placehold.co/150x100/8BC34A/FFFFFF.png?text=Abstract+1',
    type: 'image/png',
    aiHint: 'abstract waves',
  },
  {
    id: 'free-design-geometric-1',
    name: 'Geometric Pattern',
    imageUrl: 'https://placehold.co/150x100/00BCD4/FFFFFF.png?text=Geometric+1',
    type: 'image/png',
    aiHint: 'geometric pattern',
  },
  {
    id: 'free-design-floral-1',
    name: 'Simple Floral',
    imageUrl: 'https://placehold.co/150x100/E91E63/FFFFFF.png?text=Floral+1',
    type: 'image/png',
    aiHint: 'floral pattern',
  },
  {
    id: 'free-design-tech-1',
    name: 'Tech Lines',
    imageUrl: 'https://placehold.co/150x100/607D8B/FFFFFF.png?text=Tech+Lines',
    type: 'image/png',
    aiHint: 'tech lines',
  },
  {
    id: 'free-design-badge-1',
    name: 'Circular Badge',
    imageUrl: 'https://placehold.co/150x100/FF9800/000000.png?text=Badge',
    type: 'image/png',
    aiHint: 'circular badge',
  },
   {
    id: 'free-design-holiday-1',
    name: 'Festive Pattern',
    imageUrl: 'https://placehold.co/150x100/D32F2F/FFFFFF.png?text=Holiday',
    type: 'image/png',
    aiHint: 'holiday pattern',
  },
];
