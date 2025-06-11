
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Settings, Code, Trash2, AlertTriangle, Loader2, LogOut, Link as LinkIcon, KeyRound, Save, Package as PackageIcon, PlugZap, UserCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { fetchWooCommerceProducts } from "@/app/actions/woocommerceActions";
import type { WCCustomProduct } from '@/types/woocommerce';
import {format} from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/layout/AppHeader";
import { UploadProvider } from "@/contexts/UploadContext";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";

interface DisplayProduct {
  id: string;
  name: string;
  status: string;
  lastEdited: string;
  imageUrl?: string;
  aiHint?: string;
}

type ActiveDashboardTab = 'products' | 'storeIntegration' | 'settings' | 'profile';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading, signOut } = useAuth();
  const { toast } = useToast(); 

  const [activeTab, setActiveTab] = useState<ActiveDashboardTab>('products');

  // All product fetching and credential management logic has been removed from this section for debugging.

  // Simplified loading state check
  if (authIsLoading || !user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <UploadProvider>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <SidebarProvider defaultOpen>
          <div className="flex flex-1">
            <Sidebar className="h-full shadow-md border-r">
              <SidebarHeader className="p-4 border-b">
                <h2 className="font-headline text-lg font-semibold text-foreground">Navigation</h2>
              </SidebarHeader>
              <SidebarContent className="flex flex-col p-0">
                <div className="p-2">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setActiveTab('products')} isActive={activeTab === 'products'} className="w-full justify-start">
                        <PackageIcon className="mr-2 h-5 w-5" /> Products
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setActiveTab('storeIntegration')} isActive={activeTab === 'storeIntegration'} className="w-full justify-start">
                        <PlugZap className="mr-2 h-5 w-5" /> Store Integration
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
              </SidebarContent>
              <SidebarFooter className="p-4 border-t mt-auto">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab('settings')} isActive={activeTab === 'settings'} className="w-full justify-start">
                      <Settings className="mr-2 h-5 w-5" /> Settings
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setActiveTab('profile')} isActive={activeTab === 'profile'} className="w-full justify-start">
                      <UserCircle className="mr-2 h-5 w-5" /> Profile
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            <SidebarInset className="flex-1 overflow-hidden">
              <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30 overflow-y-auto h-full">
                <div className="container mx-auto space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
                        Your Dashboard
                      </h1>
                      <p className="text-muted-foreground">
                        Welcome, {user?.email}!
                      </p>
                    </div>
                    {activeTab === 'products' && (
                       <div className="flex items-center gap-2">
                        <Button /*onClick={handleAddNewProduct}*/ className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <PlusCircle className="mr-2 h-5 w-5" />
                          Add Product Configuration
                        </Button>
                      </div>
                    )}
                  </div>

                  {activeTab === 'products' && (
                    <Card className="shadow-lg border-border bg-card">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">Your Products</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          View, edit, and manage your customizable products. Product loading is temporarily disabled.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-center py-10">Product display and fetching logic has been temporarily removed for debugging.</p>
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'storeIntegration' && (
                    <Card className="shadow-lg border-border bg-card">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">WooCommerce Store Connection</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Connect your WooCommerce store to fetch and manage products. Credential saving is temporarily disabled.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form /* onSubmit={handleSaveCredentials} */ className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="storeUrl" className="flex items-center">
                              <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Store URL
                            </Label>
                            <Input
                              id="storeUrl"
                              type="url"
                              placeholder="https://yourstore.com"
                              required
                              className="bg-input/50"
                              disabled // Temporarily disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="consumerKey" className="flex items-center">
                              <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" /> Consumer Key
                            </Label>
                            <Input
                              id="consumerKey"
                              type="text"
                              placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              required
                              className="bg-input/50"
                              disabled // Temporarily disabled
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="consumerSecret" className="flex items-center">
                              <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" /> Consumer Secret
                            </Label>
                            <Input
                              id="consumerSecret"
                              type="password"
                              placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              required
                              className="bg-input/50"
                              disabled // Temporarily disabled
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" className="w-full sm:w-auto" disabled>
                                <Save className="mr-2 h-4 w-4" />
                              Save Credentials
                            </Button>
                             <Button
                                type="button"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                disabled
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                              Clear Saved Credentials
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'settings' && (
                    <Card className="shadow-lg border-border bg-card">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">Settings</CardTitle>
                        <CardDescription className="text-muted-foreground">Application settings and preferences.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Settings content will go here. (Coming Soon)</p>
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'profile' && (
                     <Card className="shadow-lg border-border bg-card">
                       <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">User Profile</CardTitle>
                        <CardDescription className="text-muted-foreground">Manage your account details.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Email: {user?.email}</p>
                        <p className="mt-4 text-muted-foreground">More profile options will be available here. (Coming Soon)</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </UploadProvider>
  );
}

