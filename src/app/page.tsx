
"use client";

import MarketingHeader from '@/components/layout/MarketingHeader';
import MarketingFooter from '@/components/layout/MarketingFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Palette, ShoppingBag, Zap, Users, Edit, BarChart3, Settings, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col">
    <CardHeader>
      <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <CardTitle className="font-headline text-xl">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const StepCard = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: React.ElementType }) => (
  <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
      <Icon className="h-8 w-8 text-primary" />
    </div>
    <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold mb-4">{number}</div>
    <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);


export default function MarketingHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarketingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 items-center gap-12">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-foreground mb-6 leading-tight">
                  Elevate Your Brand with <span className="text-primary">Personalized</span> Products
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0">
                  CSTMZR empowers your customers to co-create unique products. Integrate our intuitive customizer and watch your engagement and sales soar.
                </p>
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center md:justify-start">
                  <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto">
                    <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-background hover:bg-muted w-full sm:w-auto">
                    <Link href="/how-it-works">Discover How</Link>
                  </Button>
                </div>
              </div>
              <div className="w-full mt-10 md:mt-0">
                <div className="relative w-full aspect-video rounded-xl shadow-2xl overflow-hidden border-2 border-primary/20">
                    <Image 
                        src="https://placehold.co/800x450.png" 
                        alt="Product customizer interface example"
                        fill
                        className="object-cover"
                        data-ai-hint="customizer interface product"
                        priority
                    />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                CSTMZR provides powerful tools and seamless integrations to make product personalization effortless.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={Zap} title="Effortless Integration" description="Connect with Shopify, WooCommerce, and more in minutes. Simple setup, powerful results." />
              <FeatureCard icon={Palette} title="Intuitive Design Tools" description="Empower customers with text, image uploads, clipart, shapes, and AI-driven design suggestions." />
              <FeatureCard icon={ShoppingBag} title="Boost Sales & Loyalty" description="Personalized products mean higher conversions, happier customers, and stronger brand loyalty." />
              <FeatureCard icon={Edit} title="Full Customization Control" description="Define design areas, manage assets, set pricing rules, and tailor the experience to your brand." />
              <FeatureCard icon={Users} title="AI-Powered Assistance" description="Our AI can suggest design elements, generate ideas, and even help create initial designs from prompts." />
              <FeatureCard icon={BarChart3} title="Actionable Insights" description="Understand popular options and design trends to optimize your offerings (Coming Soon)." />
            </div>
          </div>
        </section>

        {/* How it Works Simplified */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                Launch in <span className="text-primary">3 Simple Steps</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Go from setup to selling personalized products in no time.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <StepCard number="1" title="Connect Your Store" description="Link CSTMZR to your e-commerce platform. Sync products instantly." icon={Zap} />
              <StepCard number="2" title="Configure Products" description="Define views, design areas, and customization options with ease." icon={Settings} />
              <StepCard number="3" title="Embed & Sell" description="Add the customizer to your site and start offering unique products." icon={ShoppingCart} />
            </div>
             <div className="text-center mt-16">
                <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                    <Link href="/signup">Start Customizing Today <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
          </div>
        </section>

        {/* Showcase Section Placeholder */}
        <section className="py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                See What's Possible
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Inspire your customers with stunning examples of personalized products.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Custom T-Shirts", imgHint: "custom t-shirt" },
                { title: "Personalized Mugs", imgHint: "personalized mug" },
                { title: "Unique Phone Cases", imgHint: "custom phone case" }
              ].map((item, index) => (
                <div key={index} className="group relative rounded-lg overflow-hidden shadow-lg aspect-square">
                  <Image 
                    src={`https://placehold.co/600x600.png`} 
                    alt={item.title} 
                    fill 
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={item.imgHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                    <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-white/10">View Example</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Placeholder Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground mb-4">
                Loved by Brands Like Yours
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card shadow-md">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground italic mb-4">"CSTMZR revolutionized how we offer products. Our customers love the creative freedom, and we've seen a significant boost in sales!"</p>
                    <div className="flex items-center">
                      <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full mr-3" data-ai-hint="avatar person" />
                      <div>
                        <p className="font-semibold text-foreground">Jane Doe</p>
                        <p className="text-xs text-muted-foreground">CEO, Happy Tees Co.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">
              Ready to Unleash Personalization?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-10 max-w-xl mx-auto">
              Join the growing number of businesses transforming their customer experience with CSTMZR. Start your free trial today and see the difference.
            </p>
            <div className="space-x-0 md:space-x-4 space-y-4 md:space-y-0 flex flex-col md:flex-row justify-center items-center">
                <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 w-full md:w-auto">
                    <Link href="/signup">Claim Your Free Trial</Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline" 
                  className="border-primary-foreground text-primary-foreground hover:bg-transparent hover:border-primary-foreground/80 hover:text-primary-foreground/80 w-full md:w-auto"
                >
                    <Link href="/pricing">View Pricing Plans</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>
      
      <MarketingFooter />
    </div>
  );
}
    
