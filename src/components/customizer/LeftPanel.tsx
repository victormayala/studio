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

  // In a real app, clicking these would change the content of a sub-panel or view.
  const handleItemClick = (id: string) => {
    setActiveItem(id);
    console.log(`Switched to ${id} panel`);
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b">
        <h2 className="font-headline text-lg font-semibold text-foreground">Design Tools</h2>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarMenu className="p-2">
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
