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
          <main className="flex flex-1 gap-4 md:gap-6 overflow-y-auto"> {/* scrollable main content, removed p-4 md:p-6 */}
            <DesignCanvas />
            <RightPanel />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
