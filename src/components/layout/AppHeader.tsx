"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml } from "lucide-react";

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  return (
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm"> {/* Removed px-4 md:px-6 */}
      <div className="flex items-center gap-4 pl-4 md:pl-6"> {/* Added padding here to keep logo indented */}
        <SidebarTrigger className="md:hidden" /> {/* Hidden on md and larger screens where sidebar might be pinned */}
        <Logo />
      </div>
      <Button onClick={() => setIsEmbedModalOpen(true)} variant="outline" className="bg-accent text-accent-foreground hover:bg-accent/90 mr-4 md:mr-6"> {/* Added margin here for spacing */}
        <CodeXml className="mr-2 h-4 w-4" />
        Get Embed Code
      </Button>
      <EmbedCodeModal isOpen={isEmbedModalOpen} onOpenChange={setIsEmbedModalOpen} />
    </header>
  );
}
