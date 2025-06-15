
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Palette, ShoppingBag, Zap, Users, Settings2, Edit, BarChart3, ShoppingCart, Layers, Star, CheckCircle, Link2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const FeatureHighlightCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center p-6 text-center bg-card rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
    <div className="bg-primary/10 p-4 rounded-full w-fit mb-5">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const StepPill = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex items-start space-x-4 p-6 bg-card rounded-lg shadow-sm">
    <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-lg font-bold">
      {number}
    </div>
    <div>
      <h4 className="text-lg font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 text-center bg-gradient-to-b from-background via-primary/5 to-background">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-foreground mb-6 leading-tight">
              Unleash Creativity. <span className="text-primary">Boost Sales.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              CSTMZR provides a powerful yet simple platform for e-commerce businesses to offer product personalization at scale.
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 px-8 py-3 text-base">
                <Link href="/signup">
                  <span className="flex items-center">
                    Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </Link>
              </Button>
            </div>
            <div className="mt-16 md:mt-20 max-w-4xl mx-auto">
              <div className="relative w-full aspect-[16/9] rounded-xl shadow-2xl overflow-hidden border-2 border-primary/10">
                  <Image 
                      src="https://placehold.co/1200x675.png" 
                      alt="Product customizer interface showing a t-shirt being customized"
                      fill
                      className="object-cover"
                      data-ai-hint="product customizer interface"
                      priority
                  />
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-sm font-semibold text-muted-foreground text-center mb-6 tracking-wider uppercase">
              Powering Personalization For Brands Worldwide
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-12 lg:gap-x-16">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="relative h-8 w-28 opacity-60 hover:opacity-100 transition-opacity">
                  <Image
                    src={`https://placehold.co/120x40.png`}
                    alt={`Client Logo ${i + 1}`}
                    fill
                    className="object-contain"
                    data-ai-hint="company logo"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-16 md:py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                Everything You Need, Nothing You Don't
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                CSTMZR is packed with features to make product personalization seamless for you and delightful for your customers.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureHighlightCard 
                icon={Zap} 
                title="Effortless Integration" 
                description="Connect with Shopify, WooCommerce, and more in minutes. Simple setup, powerful results." 
              />
              <FeatureHighlightCard 
                icon={Layers} 
                title="Intuitive Design Canvas" 
                description="A user-friendly interface for text, image uploads, clipart, shapes, and live previews." 
              />
              <FeatureHighlightCard 
                icon={Palette} 
                title="AI-Powered Suggestions" 
                description="Smart AI assists with design ideas, element suggestions, and even background removal." 
              />
              <FeatureHighlightCard 
                icon={Settings2} 
                title="Granular Control" 
                description="Define design areas, manage product views, set up variations, and control every aspect." 
              />
              <FeatureHighlightCard 
                icon={ShoppingCart} 
                title="Boost Conversions" 
                description="Personalized products lead to higher engagement, increased AOV, and stronger brand loyalty." 
              />
              <FeatureHighlightCard 
                icon={Users} 
                title="Delight Customers" 
                description="Give customers the power to create exactly what they want, leading to higher satisfaction." 
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Launching your personalized product line is simpler than you think.
              </p>
            </div>
            <div className="max-w-2xl mx-auto space-y-8">
              <StepPill 
                number="1" 
                title="Connect Your Store" 
                description="Easily link CSTMZR to your existing e-commerce platform like Shopify or WooCommerce." 
              />
              <StepPill 
                number="2" 
                title="Configure Products" 
                description="Select products, define customizable views, design areas, and set up options." 
              />
              <StepPill 
                number="3" 
                title="Embed & Go Live" 
                description="Add the CSTMZR tool to your product pages and start offering personalized items." 
              />
            </div>
            <div className="text-center mt-12">
              <Button asChild size="lg" variant="link" className="text-primary hover:text-primary/80 text-base px-0">
                <Link href="/how-it-works">
                  <span className="flex items-center">
                  Learn More About How It Works <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">
              Ready to Transform Your E-commerce?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-10 max-w-xl mx-auto">
              Join hundreds of businesses offering unique, personalized products. Start your journey with CSTMZR today.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto text-base px-8 py-3"
                >
                  <Link href="/signup">
                    <span>Start Your Free Trial</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-transparent hover:border-primary-foreground/80 hover:text-primary-foreground/80 w-full sm:w-auto text-base px-8 py-3"
                >
                  <Link href="/pricing">
                    <span>View Pricing Plans</span>
                  </Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
}
