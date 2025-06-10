
"use client";

import React from 'react'; // Added React import
import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Link2, Settings2, Code, Palette, ShoppingCart, PackageCheck } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    icon: <Link2 className="h-10 w-10 text-primary mb-4" />,
    title: "1. Sign Up & Connect Your Store",
    description: "Create your CSTMZR account in minutes. Then, seamlessly connect your Shopify or WooCommerce store using our guided setup. Product synchronization starts immediately, importing your catalog into CSTMZR."
  },
  {
    icon: <Settings2 className="h-10 w-10 text-primary mb-4" />,
    title: "2. Configure Customization Options",
    description: "From your CSTMZR dashboard, select products you want to make customizable. Define available colors, sizes, text input fields, image upload zones, and set up design boundaries directly on your product images using our intuitive editor."
  },
  {
    icon: <Code className="h-10 w-10 text-primary mb-4" />,
    title: "3. Embed the Customizer",
    description: "Add CSTMZR to your product pages by simply copying a lightweight JavaScript snippet. For Shopify and WooCommerce, our dedicated apps/plugins will make this even easier, often just a few clicks to integrate."
  },
  {
    icon: <Palette className="h-10 w-10 text-primary mb-4" />,
    title: "4. Customers Design & Personalize",
    description: "Your customers will now see the CSTMZR tool on your product pages. They can add text, upload images, choose colors, and see a live preview of their unique creation, leading to higher engagement and satisfaction."
  },
  {
    icon: <PackageCheck className="h-10 w-10 text-primary mb-4" />,
    title: "5. Receive & Fulfill Custom Orders",
    description: "When a customer places an order, all customization details (text, image URLs, chosen options) are seamlessly passed to your e-commerce platform with the order. Fulfill custom orders accurately and efficiently."
  }
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6">
              How CSTMZR Transforms Your Store
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Integrating powerful product customization into your e-commerce store is straightforward with CSTMZR. Follow these simple steps to unlock a new level of customer engagement and boost your sales.
            </p>
          </div>
          
          <div className="grid md:grid-cols-1 gap-10 lg:gap-12">
            {steps.map((step, index) => (
              <CardStep key={index} step={step} index={index} totalSteps={steps.length} />
            ))}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold font-headline text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join businesses already leveraging the power of personalization with CSTMZR. Sign up today and take the first step towards a more interactive and profitable online store.
            </p>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/signup">Sign Up for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

interface CardStepProps {
  step: {
    icon: JSX.Element;
    title: string;
    description: string;
  };
  index: number;
  totalSteps: number;
}

const CardStep = ({ step, index }: CardStepProps) => {
  const isEven = index % 2 === 0;
  const placeholderImage = `https://placehold.co/500x350.png`;
  const aiHint = step.title.toLowerCase().split(" ").slice(1,3).join(" ");


  return (
    <div className={`flex flex-col md:flex-row items-center gap-8 lg:gap-12 ${isEven ? '' : 'md:flex-row-reverse'}`}>
      <div className="md:w-1/2 lg:w-5/12">
        <div className="p-8 border rounded-xl shadow-lg bg-card h-full flex flex-col">
          <div className="flex items-center mb-4">
            <div className={`mr-4 p-3 rounded-full bg-primary/10 text-primary`}>
              {React.cloneElement(step.icon, { className: "h-6 w-6" })}
            </div>
            <h2 className="text-2xl font-semibold font-headline text-card-foreground">{step.title}</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>
      <div className="md:w-1/2 lg:w-7/12">
        <Image
          src={placeholderImage}
          alt={step.title}
          width={500}
          height={350}
          className="rounded-xl shadow-xl object-cover border"
          data-ai-hint={aiHint || "step visual"}
        />
      </div>
    </div>
  );
};

