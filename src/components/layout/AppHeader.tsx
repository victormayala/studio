
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard, Send, LogOut } from "lucide-react"; // Added Send, LogOut
import { useUploads } from '@/contexts/UploadContext'; // Added
import { useAuth } from '@/contexts/AuthContext'; // Added
import { useToast } from '@/hooks/use-toast'; // Added

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const { canvasImages, canvasTexts, canvasShapes } = useUploads(); // Added
  const { signOut, isLoading: authIsLoading, user } = useAuth(); // Added
  const { toast } = useToast(); // Added

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
      // You might want to add product ID or other context here
    };

    // For security, replace '*' with your WordPress site's origin in production
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
      // Navigation is handled by AuthContext
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", variant: "destructive" });
    }
  };

  return (
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <Link href="/customizer" aria-label="Go to Customizer">
            <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleApplyDesign} 
          variant="default" // Primary action
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!user}
        >
          <Send className="mr-2 h-4 w-4" />
          Apply Design
        </Button>
        <Button asChild variant="outline" className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button 
          onClick={() => setIsEmbedModalOpen(true)} 
          variant="outline" 
          className="hover:bg-accent hover:text-accent-foreground"
        >
          <CodeXml className="mr-2 h-4 w-4" />
          Embed Code
        </Button>
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
      <EmbedCodeModal isOpen={isEmbedModalOpen} onOpenChange={setIsEmbedModalOpen} />
    </header>
  );
}
