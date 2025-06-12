
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
// Removed SidebarTrigger as the new desktop layout doesn't use it in the same way.
// Mobile responsiveness will need a different approach for the new layout.
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard, Send, LogOut, Menu } from "lucide-react"; // Added Menu for potential mobile
import { useUploads } from '@/contexts/UploadContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useSearchParams } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile'; // For potential mobile sheet later

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { canvasImages, canvasTexts, canvasShapes } = useUploads();
  const { user, signOut, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile(); // For future mobile sheet toggle

  const [customizerShareUrlPath, setCustomizerShareUrlPath] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith('/customizer')) {
      const productId = searchParams.get('productId');
      if (productId) {
        let urlPath = `/customizer?productId=${productId}`;
        if (user?.id) {
          urlPath += `&userId=${user.id}`;
        }
        setCustomizerShareUrlPath(urlPath);
      } else {
        let urlPath = `/customizer`;
        if (user?.id) {
          urlPath += `?userId=${user.id}`; 
        }
         setCustomizerShareUrlPath(urlPath);
      }
    } else {
      setCustomizerShareUrlPath(null);
    }
  }, [pathname, searchParams, user]);

  // const showSidebarTrigger = pathname.startsWith('/customizer') && isMobile; // Example for future mobile

  const handleApplyDesign = () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to apply designs.",
        variant: "destructive",
      });
      return;
    }

    const currentProductIdFromParams = searchParams.get('productId'); 

    const designData = {
      images: canvasImages,
      texts: canvasTexts,
      shapes: canvasShapes,
      productId: currentProductIdFromParams, 
      userId: user?.id, 
    };

    let targetOrigin = '*'; 
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_WORDPRESS_SITE_ORIGIN) {
        targetOrigin = process.env.NEXT_PUBLIC_WORDPRESS_SITE_ORIGIN;
    }
    
    if (window.parent !== window) {
      window.parent.postMessage({ cstmzrDesignData: designData }, targetOrigin);
      toast({
        title: "Design Applied!",
        description: "Your design has been sent to the product page.",
      });
    } else {
       toast({
        title: "Not in an iframe",
        description: "This action is intended to be used when the customizer is embedded.",
        variant: "info"
      });
      console.warn("AppHeader: 'Apply Design' clicked, but not in an iframe. Data:", designData);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", variant: "destructive" });
    }
  };

  return (
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm px-4 md:px-6 w-full flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Example for future mobile sheet trigger:
        {showSidebarTrigger && (
          <Button variant="ghost" size="icon" onClick={() => { console.log("Mobile menu clicked") }}>
            <Menu className="h-6 w-6" />
          </Button>
        )}
        */}
        <Link href={user ? "/dashboard" : "/"} aria-label="Go to main app page">
            <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {pathname.startsWith('/customizer') && (
          <Button 
            onClick={handleApplyDesign} 
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!user && (canvasImages.length === 0 && canvasTexts.length === 0 && canvasShapes.length === 0)}
          >
            <Send className="mr-2 h-4 w-4" />
            Apply Design
          </Button>
        )}
        <Button asChild variant="outline" className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        {pathname.startsWith('/customizer') && (
          <Button 
            onClick={() => setIsEmbedModalOpen(true)} 
            variant="outline" 
            className="hover:bg-accent hover:text-accent-foreground"
            disabled={!customizerShareUrlPath} 
          >
            <CodeXml className="mr-2 h-4 w-4" />
            Embed Code
          </Button>
        )}
        {user && (
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="hover:bg-destructive/10 hover:text-destructive"
            disabled={authIsLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>
      <EmbedCodeModal 
        isOpen={isEmbedModalOpen} 
        onOpenChange={setIsEmbedModalOpen}
        customizerUrlPath={customizerShareUrlPath} 
      />
    </header>
  );
}
