
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-6">
          Welcome to <span className="text-primary">Customizer Studio</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
          This is the homepage for Customizer Studio.
        </p>
        <div className="space-x-4">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard">
              Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-accent border-accent hover:bg-accent/10">
            <Link href="/signin">
              Sign In
            </Link>
          </Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
