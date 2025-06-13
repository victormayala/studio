
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Palette, ShoppingBag, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-card">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Left Column: Text Content */}
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground mb-6">
                  Unleash Product Customization Power
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto md:mx-0">
                  Empower your customers with seamless product personalization. CSTMZR integrates with your store to offer an intuitive design experience, boosting engagement and sales.
                </p>
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center md:justify-start">
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                    <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link href="/how-it-works">Learn More</Link>
                  </Button>
                </div>
              </div>
              {/* Right Column: Image */}
              <div className="md:w-1/2 w-full mt-10 md:mt-0">
                <div className="relative w-full aspect-[2/1] rounded-lg shadow-2xl overflow-hidden border">
                    <Image 
                        src="/hero-banner-image.png" 
                        alt="Hero banner for CSTMZR"
                        fill
                        className="object-cover"
                        data-ai-hint="hero banner"
                        priority
                    />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24"> {/* This section retains default background */}
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center text-foreground mb-16">
              Why Choose <span className="text-primary">CSTMZR</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-headline">Easy Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Connect seamlessly with Shopify, WooCommerce, and more. Get up and running in minutes with simple script embeds or robust API options.</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <Palette className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-headline">Intuitive Design Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Offer your customers a rich design experience with text tools, image uploads, clipart, shapes, and AI-powered suggestions.</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <ShoppingBag className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="font-headline">Boost Sales & Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Personalized products lead to higher conversion rates and customer satisfaction. Let your customers create exactly what they want.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works Simplified */}
        <section className="py-16 md:py-24 bg-muted/50"> {/* This section retains its specific background */}
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center text-foreground mb-16">
              Get Started in 3 Simple Steps
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Store</h3>
                <p className="text-muted-foreground">Easily link CSTMZR to your existing e-commerce platform.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Configure Products</h3>
                <p className="text-muted-foreground">Define customization options for your products in minutes.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Go Live!</h3>
                <p className="text-muted-foreground">Embed the customizer and start offering personalized products.</p>
              </div>
            </div>
             <div className="text-center mt-12">
                <Button asChild size="lg">
                    <Link href="/signup">Start Customizing Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32"> {/* This section retains default background */}
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-6">
              Ready to Transform Your Store?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join hundreds of businesses leveraging product customization to stand out.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/pricing">View Pricing & Plans</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
}
