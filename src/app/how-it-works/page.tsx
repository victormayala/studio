
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6">
            How CSTMZR Works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Discover the simple steps to integrate powerful product customization into your store.
          </p>
          
          {/* Placeholder Content */}
          <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="p-6 border rounded-lg shadow-md bg-card">
              <h3 className="text-xl font-semibold mb-3 text-primary font-headline">1. Connect Your Store</h3>
              <p className="text-muted-foreground">
                Easily link your Shopify, WooCommerce, or other e-commerce platforms with CSTMZR in just a few clicks. Securely sync your products.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-md bg-card">
              <h3 className="text-xl font-semibold mb-3 text-primary font-headline">2. Define Customizations</h3>
              <p className="text-muted-foreground">
                Use our intuitive interface to select which products are customizable. Add text fields, image uploads, color pickers, and define design areas.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-md bg-card">
              <h3 className="text-xl font-semibold mb-3 text-primary font-headline">3. Embed & Sell</h3>
              <p className="text-muted-foreground">
                Copy a simple script or use our plugins to embed the customizer on your product pages. Start offering personalized products and watch your sales grow!
              </p>
            </div>
          </div>

          <div className="mt-16">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/signup">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
