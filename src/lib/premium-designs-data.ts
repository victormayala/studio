
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
    imageUrl: '/premium-designs/pro-logo-template.png', 
    type: 'image/png',
    aiHint: 'professional logo',
    price: 1.00,
  },
  {
    id: 'premium-design-illustration-1',
    name: 'Detailed Illustration',
    imageUrl: '/premium-designs/detailed-illustration.png',
    type: 'image/png',
    aiHint: 'detailed illustration',
    price: 1.00,
  },
  {
    id: 'premium-design-iconset-1',
    name: 'Custom Icon Set',
    imageUrl: '/premium-designs/custom-icon-set.png',
    type: 'image/png',
    aiHint: 'custom icons',
    price: 1.00,
  },
  {
    id: 'premium-design-banner-1',
    name: 'Exclusive Banner',
    imageUrl: '/premium-designs/exclusive-banner.png',
    type: 'image/png',
    aiHint: 'exclusive banner',
    price: 1.00,
  },
];
