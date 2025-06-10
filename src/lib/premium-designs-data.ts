
export interface PremiumDesignItem {
  id: string;
  name: string;
  imageUrl: string;
  type: string; // e.g., 'image/png'
  aiHint: string;
  price: number; // Price in USD
}

export const premiumDesignsData: PremiumDesignItem[] = [
  {
    id: 'premium-design-logo-1',
    name: 'Pro Logo Template',
    imageUrl: 'https://placehold.co/150x100/673AB7/FFFFFF.png?text=Premium+Logo', // Deep Purple
    type: 'image/png',
    aiHint: 'professional logo',
    price: 1.00,
  },
  {
    id: 'premium-design-illustration-1',
    name: 'Detailed Illustration',
    imageUrl: 'https://placehold.co/150x100/3F51B5/FFFFFF.png?text=Premium+Art', // Indigo
    type: 'image/png',
    aiHint: 'detailed illustration',
    price: 1.00,
  },
  {
    id: 'premium-design-iconset-1',
    name: 'Custom Icon Set',
    imageUrl: 'https://placehold.co/150x100/009688/FFFFFF.png?text=Icon+Set', // Teal
    type: 'image/png',
    aiHint: 'custom icons',
    price: 1.00,
  },
  {
    id: 'premium-design-banner-1',
    name: 'Exclusive Banner',
    imageUrl: 'https://placehold.co/150x100/FF5722/FFFFFF.png?text=Pro+Banner', // Deep Orange
    type: 'image/png',
    aiHint: 'exclusive banner',
    price: 1.00,
  },
];
