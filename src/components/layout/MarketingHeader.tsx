
"use client";

import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

const authLinks = [
  { href: "/signin", label: "Sign In", variant: "outline" as const },
  { href: "/signup", label: "Sign Up", variant: "default" as const },
]

export default function MarketingHeader() {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card flex justify-center">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-center px-4 md:px-6">
        {/* Logo Section */}
        <div className="flex items-center"> {/* Wrapper for Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>

        {isMobile ? (
          <div className="ml-auto"> {/* Mobile menu trigger, ml-auto to push to right */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-card">
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-lg font-medium text-foreground hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-border" />
                  {authLinks.map((link) => (
                    <Button key={link.label} asChild variant={link.variant} className="w-full">
                      <Link href={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <> {/* Desktop navigation and auth buttons */}
            {/* Navigation Links - Centered */}
            <nav className="flex flex-1 items-center justify-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Authentication Buttons - Pushed to the right */}
            <div className="flex items-center space-x-3">
              {authLinks.map((link) => (
                <Button key={link.label} asChild variant={link.variant} size="sm">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
