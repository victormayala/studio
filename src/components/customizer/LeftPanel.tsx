
"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Package,
  Layers,
  UploadCloud,
  Type,
  Shapes,
  Smile,
  Palette,
  Gem,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import UploadArea from "./UploadArea";
import ImageTransformControls from "./ImageTransformControls"; // Added import
import { useUploads } from "@/contexts/UploadContext"; // Added import

const menuItems = [
  { id: "products", label: "Products", icon: Package },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "text", label: "Text Tool", icon: Type },
  { id: "shapes", label: "Shapes", icon: Shapes },
  { id: "clipart", label: "Clipart", icon: Smile },
  { id: "free-designs", label: "Free Designs", icon: Palette },
  { id: "premium-designs", label: "Premium Designs", icon: Gem },
];

export default function LeftPanel() {
  const [activeItem, setActiveItem] = useState("products");
  const { activeUploadedImage } = useUploads(); // Get active image state

  const handleItemClick = (id: string) => {
    setActiveItem(id);
  };

  const renderPanelContent = () => {
    const selectedMenuItem = menuItems.find(item => item.id === activeItem);
    const panelLabel = selectedMenuItem ? selectedMenuItem.label : "Panel";

    switch (activeItem) {
      case "uploads":
        return (
          <>
            <UploadArea />
            {activeUploadedImage && <ImageTransformControls />}
          </>
        );
      // Add cases for other panels as they are implemented
      // case "products":
      //   return <div className="p-4">Products Panel Content (To be implemented)</div>;
      default:
        return (
          <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
            <Package className="w-12 h-12 mb-4 text-muted-foreground/50" /> {/* Generic Icon */}
            <h3 className="text-lg font-semibold mb-1">{panelLabel}</h3>
            <p className="text-sm">This panel is not yet implemented.</p>
            <p className="text-xs mt-2">Select another tool or check back later!</p>
          </div>
        );
    }
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold text-foreground">Design Tools</h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col p-0">
        <div className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleItemClick(item.id)}
                  isActive={activeItem === item.id}
                  className="w-full justify-start"
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
        <Separator className="bg-sidebar-border mx-2 w-auto" />
        <ScrollArea className="flex-grow">
          {renderPanelContent()}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
         <SidebarMenuButton className="w-full justify-start">
            <Settings2 className="mr-2 h-5 w-5" />
            <span>Settings</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
}
