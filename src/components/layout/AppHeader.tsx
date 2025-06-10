
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/icons/Logo";
import { EmbedCodeModal } from "@/components/customizer/EmbedCodeModal";
import { CodeXml, LayoutDashboard } from "lucide-react";

export default function AppHeader() {
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);

  return (
    <header className="flex items-center justify-between h-16 border-b bg-card shadow-sm">
      <div className="flex items-center gap-4 pl-4 md:pl-6">
        <SidebarTrigger className="md:hidden" />
        <Link href="/customizer" aria-label="Go to Customizer">
            <Logo />
        </Link>
      </div>
      <div className="flex items-center gap-2 pr-4 md:pr-6">
        <Button asChild variant="outline" className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button 
          onClick={() => setIsEmbedModalOpen(true)} 
          variant="outline" 
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <CodeXml className="mr-2 h-4 w-4" />
          Get Embed Code
        </Button>
      </div>
      <EmbedCodeModal isOpen={isEmbedModalOpen} onOpenChange={setIsEmbedModalOpen} />
    </header>
  );
}
