
"use client"; 

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppHeader from '@/components/layout/AppHeader';
import LeftPanel from '@/components/customizer/LeftPanel';
import DesignCanvas from '@/components/customizer/DesignCanvas';
import RightPanel from '@/components/customizer/RightPanel';
import { UploadProvider } from "@/contexts/UploadContext"; // Added import

export default function CustomizerPage() {
  return (
    <UploadProvider> {/* Wrapped with UploadProvider */}
      <SidebarProvider defaultOpen>
        <div className=""> {/* Removed: group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar */}
          <Sidebar className="h-full shadow-md">
            <LeftPanel />
          </Sidebar>
          
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <AppHeader />
            <div className="flex flex-1 overflow-hidden"> {/* Removed gap */}
              <main className="flex-1 overflow-y-auto"> 
                <DesignCanvas />
              </main>
              <RightPanel /> 
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </UploadProvider>
  );
}
