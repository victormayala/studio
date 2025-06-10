"use client"; // Required because SidebarProvider and its context consumers are client components

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppHeader from '@/components/layout/AppHeader';
import LeftPanel from '@/components/customizer/LeftPanel';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';

export default function CustomizerPage() {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar className="h-full shadow-md"> {/* Ensure Sidebar itself is styled if needed */}
          <LeftPanel />
        </Sidebar>
        
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          {/* Flex container for DesignCanvas and RightPanel, gap removed */}
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto"> {/* DesignCanvas container, takes most space */}
              <DesignCanvas />
            </main>
            <RightPanel /> {/* RightPanel sits to the right of the main content */}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
