
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard, Send, LogOut } from "lucide-react";
import { useUploads } from '@/contexts/UploadContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation'; // Added import

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { canvasImages, canvasTexts, canvasShapes } = useUploads();
  const { signOut, isLoading: authIsLoading, user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname(); // Get current path

  const showSidebarTrigger = pathname.startsWith('/customizer');

  const handleApplyDesign = () => {
    if (!user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to apply designs.",
        variant: "destructive",
      });
      return;
    }

    const designData = {
      images: canvasImages,
      texts: canvasTexts,
      shapes: canvasShapes,
    };

    const targetOrigin = process.env.NODE_ENV === 'production' ? 'YOUR_WORDPRESS_SITE_ORIGIN' : '*';
    
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
        variant: "destructive"
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
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger className="md:hidden" />}
        <Link href={user ? "/dashboard" : "/customizer"} aria-label="Go to main app page">
            <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {pathname.startsWith('/customizer') && (
          <Button 
            onClick={handleApplyDesign} 
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!user}
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
      {pathname.startsWith('/customizer') && <EmbedCodeModal isOpen={isEmbedModalOpen} onOpenChange={setIsEmbedModalOpen} />}
    </header>
  );
}
