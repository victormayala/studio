
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
  const { user, isLoading: authIsLoading, signOut: authSignOut } = useAuth(); // Renamed signOut to authSignOut to avoid conflict if any
  const { toast } = useToast(); 

  const [activeTab, setActiveTab] = useState<ActiveDashboardTab>('products');

  // State for products
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for credentials
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);


  const loadProductsWithCredentials = useCallback(async (creds?: { storeUrl: string; consumerKey: string; consumerSecret: string }) => {
    setIsLoadingProducts(true);
    setError(null);
    const startTime = Date.now();

    try {
      const { products: fetchedProducts, error: fetchError } = await fetchWooCommerceProducts(creds);
      const duration = Date.now() - startTime;

      if (fetchError) {
        setError(fetchError);
        toast({
          title: "Error Fetching Products",
          description: fetchError,
          variant: "destructive",
        });
        setProducts([]);
      } else if (fetchedProducts) {
        const displayProducts = fetchedProducts.map(p => ({
          id: p.id.toString(),
          name: p.name,
          status: p.status,
          lastEdited: format(new Date(p.date_modified_gmt || p.date_modified || p.date_created_gmt || p.date_created), "PPP"),
          imageUrl: p.images && p.images.length > 0 ? p.images[0].src : `https://placehold.co/150x150.png`,
          aiHint: p.images && p.images.length > 0 && p.images[0].alt ? p.images[0].alt.split(" ").slice(0,2).join(" ") : "product image"
        }));
        setProducts(displayProducts);
        toast({
          title: "Products Loaded",
          description: `Fetched ${displayProducts.length} products in ${duration}ms. ${creds ? 'Used user credentials.' : 'Used global credentials.'}`,
        });
      } else {
        setProducts([]);
         toast({
          title: "No Products Found",
          description: "No products were returned from the store.",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during product fetch.";
      setError(message);
      toast({
        title: "Fetch Error",
        description: message,
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [toast]);

  // useEffect for loading products based on activeTab and credentials
  useEffect(() => {
    if (activeTab === 'products' && user && !isLoadingCredentials) { // Ensure credentials loaded first
      const userStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const userConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const userConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);

      if (userStoreUrl && userConsumerKey && userConsumerSecret) {
        loadProductsWithCredentials({ storeUrl: userStoreUrl, consumerKey: userConsumerKey, consumerSecret: userConsumerSecret });
      } else {
        loadProductsWithCredentials();
      }
    }
  }, [activeTab, user, loadProductsWithCredentials, isLoadingCredentials]);

  // useEffect to load credentials from localStorage on mount or user change
  useEffect(() => {
    if (user) {
      setIsLoadingCredentials(true);
      const savedStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const savedConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const savedConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);

      setStoreUrl(savedStoreUrl || '');
      setConsumerKey(savedConsumerKey || '');
      setConsumerSecret(savedConsumerSecret || '');
      setIsLoadingCredentials(false);
    } else {
      setStoreUrl('');
      setConsumerKey('');
      setConsumerSecret('');
      setIsLoadingCredentials(false); // Still need to set this if no user
    }
  }, [user]);


  const handleSaveCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSavingCredentials) return;

    setIsSavingCredentials(true);
    try {
      localStorage.setItem(`wc_store_url_${user.id}`, storeUrl);
      localStorage.setItem(`wc_consumer_key_${user.id}`, consumerKey);
      localStorage.setItem(`wc_consumer_secret_${user.id}`, consumerSecret);
      toast({
        title: "Credentials Saved (Locally)",
        description: "Your WooCommerce credentials have been saved in this browser.",
      });
      // If products tab is active, or to pre-load, re-fetch with new creds
      if (activeTab === 'products') {
         loadProductsWithCredentials({ storeUrl, consumerKey, consumerSecret });
      }
    } catch (error) {
      toast({
        title: "Error Saving Credentials",
        description: "Could not save credentials to local storage.",
        variant: "destructive",
      });
      console.error("Error saving to localStorage:", error);
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleClearCredentials = async () => {
    if (!user || isSavingCredentials) return;
    setIsSavingCredentials(true); 
    try {
      localStorage.removeItem(`wc_store_url_${user.id}`);
      localStorage.removeItem(`wc_consumer_key_${user.id}`);
      localStorage.removeItem(`wc_consumer_secret_${user.id}`);
      setStoreUrl('');
      setConsumerKey('');
      setConsumerSecret('');
      toast({
        title: "Credentials Cleared",
        description: "Your WooCommerce credentials have been removed from this browser.",
      });
       if (activeTab === 'products') {
        loadProductsWithCredentials(); // Fetch with global credentials
      }
    } catch (error) {
      toast({
        title: "Error Clearing Credentials",
        description: "Could not clear credentials from local storage.",
        variant: "destructive",
      });
       console.error("Error clearing localStorage:", error);
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleAddNewProduct = () => {
    const targetProductId = products.length > 0 ? products[0].id : "new_product_template";
    router.push(`/dashboard/products/${targetProductId}/options`);
  };


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
                        <Button onClick={handleAddNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
                          View, edit, and manage your customizable products.
                          {!isLoadingCredentials && !storeUrl && !consumerKey && !consumerSecret && (
                            <span className="block text-orange-500 text-xs mt-1">
                              <AlertTriangle className="inline h-3 w-3 mr-1" />
                              No user-specific credentials saved. Using global fallback if available.
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingProducts || isLoadingCredentials ? (
                          <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Loading products...</p>
                          </div>
                        ) : error ? (
                          <div className="text-center py-10">
                            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                            <p className="mt-4 text-destructive font-semibold">Error loading products</p>
                            <p className="text-sm text-muted-foreground mt-1">{error}</p>
                            {error.includes("WOOCOMMERCE_STORE_URL") && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Please ensure global WooCommerce credentials are set in your <code>.env</code> file or configure user-specific credentials in the 'Store Integration' tab.
                              </p>
                            )}
                          </div>
                        ) : products.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Edited</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {products.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-muted/30">
                                      <NextImage src={product.imageUrl || `https://placehold.co/150x150.png`} alt={product.name} fill className="object-contain" data-ai-hint={product.aiHint || "product image"}/>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell>
                                    <Badge variant={product.status === 'publish' ? 'default' : 'secondary'} className={product.status === 'publish' ? 'bg-green-500/10 text-green-700 border-green-500/30' : ''}>
                                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{product.lastEdited}</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Toggle menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${product.id}/options`)}>
                                          <Settings className="mr-2 h-4 w-4" /> Configure Options
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => router.push(`/customizer?productId=${product.id}`)} >
                                          <Code className="mr-2 h-4 w-4" /> Open in Customizer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => toast({ title: "Delete Clicked (Not Implemented)", description: `Would delete ${product.name}`})}>
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-10">
                            <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No products found.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Try fetching from your WooCommerce store or add product configurations.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {activeTab === 'storeIntegration' && (
                    <Card className="shadow-lg border-border bg-card">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">WooCommerce Store Connection</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Connect your WooCommerce store to fetch and manage products. Your credentials are saved locally in your browser.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingCredentials && !storeUrl && !consumerKey && !consumerSecret ? ( // Show loader only on initial check for credentials
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="ml-2 text-muted-foreground">Loading credentials...</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSaveCredentials} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="storeUrl" className="flex items-center">
                                <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" /> Store URL
                              </Label>
                              <Input
                                id="storeUrl"
                                type="url"
                                placeholder="https://yourstore.com"
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                required
                                className="bg-input/50"
                                disabled={isSavingCredentials}
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
                                value={consumerKey}
                                onChange={(e) => setConsumerKey(e.target.value)}
                                required
                                className="bg-input/50"
                                disabled={isSavingCredentials}
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
                                value={consumerSecret}
                                onChange={(e) => setConsumerSecret(e.target.value)}
                                required
                                className="bg-input/50"
                                disabled={isSavingCredentials}
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button type="submit" className="w-full sm:w-auto" disabled={isSavingCredentials || !storeUrl || !consumerKey || !consumerSecret}>
                                {isSavingCredentials ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Credentials
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={handleClearCredentials}
                                className="w-full sm:w-auto"
                                disabled={isSavingCredentials || (!storeUrl && !consumerKey && !consumerSecret)}
                              >
                                {isSavingCredentials ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Clear Saved Credentials
                              </Button>
                            </div>
                          </form>
                        )}
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
            <Sidebar side="right" className="h-full shadow-md border-l">
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
          </div>
        </SidebarProvider>
      </div>
    </UploadProvider>
  );
}

