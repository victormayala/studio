
"use client";

import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboardIcon } from 'lucide-react'; // Added LogOut, LayoutDashboardIcon
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext'; // Added
import { useToast } from '@/hooks/use-toast'; // Added

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

// Original auth links for logged-out users
const defaultAuthLinks = [
  { href: "/signin", label: "Sign In", variant: "outline" as const },
  { href: "/signup", label: "Sign Up", variant: "default" as const },
];

export default function MarketingHeader() {
  const isMobile = useIsMobile();
  const { user, signOut, isLoading: authIsLoading } = useAuth(); // Added
  const { toast } = useToast(); // Added

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      // Navigation is handled by AuthContext's signOut
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign you out. Please try again.", variant: "destructive" });
    }
  };

  // Dynamic auth links based on user state
  const authLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", variant: "outline" as const, icon: LayoutDashboardIcon },
        { action: handleSignOut, label: "Sign Out", variant: "default" as const, icon: LogOut },
      ]
    : defaultAuthLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card flex justify-center">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-center px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>
        </div>

        {isMobile ? (
          <div className="ml-auto">
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
                    link.href ? (
                      <Button key={link.label} asChild variant={link.variant} className="w-full">
                        <Link href={link.href}>
                          <span className="flex items-center justify-center w-full">
                            {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                            {link.label}
                          </span>
                        </Link>
                      </Button>
                    ) : (
                      <Button key={link.label} onClick={link.action} variant={link.variant} className="w-full" disabled={authIsLoading}>
                        {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                        {link.label}
                      </Button>
                    )
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <>
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
            <div className="flex items-center space-x-3">
              {authLinks.map((link) => (
                link.href ? (
                  <Button key={link.label} asChild variant={link.variant} size="sm">
                    <Link href={link.href}>
                      <span className="flex items-center">
                        {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                        {link.label}
                      </span>
                    </Link>
                  </Button>
                ) : (
                  <Button key={link.label} onClick={link.action} variant={link.variant} size="sm" disabled={authIsLoading}>
                     {link.icon && <link.icon className="mr-2 h-4 w-4" />}
                    {link.label}
                  </Button>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
