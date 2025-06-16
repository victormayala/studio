
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Palette, Code, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MarketingHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground mb-6">
              Create Stunning Product Designs with <span className="text-primary">Embedz</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Easily compose graphical elements, manage layers, and generate embeddable scripts for your online store. Power up your product personalization.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">
                  Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-accent border-accent hover:bg-accent/10">
                <Link href="/how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">
                Powerful Features, Simple Interface
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Embedz provides all the tools you need to offer rich product customization.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Palette className="h-10 w-10 text-primary mb-4" />}
                title="Intuitive Design Canvas"
                description="Drag, drop, and arrange elements on a customizable canvas. Perfect for t-shirts, mugs, and more."
              />
              <FeatureCard
                icon={<Layers className="h-10 w-10 text-primary mb-4" />}
                title="Advanced Layer Management"
                description="Easily reorder, lock, and manage visibility of design layers for complex compositions."
              />
              <FeatureCard
                icon={<Code className="h-10 w-10 text-primary mb-4" />}
                title="Embeddable Script Generation"
                description="Once your design options are set, generate a simple script to embed the customizer in your store."
              />
            </div>
          </div>
        </section>

        {/* AI Assistant Teaser */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="md:w-1/2">
                 <Image 
                  src="https://placehold.co/600x400.png" 
                  alt="AI Design Assistant Mockup"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl border"
                  data-ai-hint="AI assistant interface"
                />
              </div>
              <div className="md:w-1/2 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                  AI Design Assistant
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Stuck for ideas? Let our AI assistant suggest relevant design elements and generate concepts based on your current composition or simple text prompts.
                </p>
                <Button variant="secondary" size="lg" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center p-6 shadow-lg hover:shadow-xl transition-shadow bg-background">
      <CardHeader className="items-center">
        {icon}
        <CardTitle className="font-headline text-xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
