
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Settings, Code, Trash2, AlertTriangle, Loader2, LogOut, Link as LinkIcon, KeyRound, Save, Package as PackageIcon, PlugZap, UserCircle, XCircle } from "lucide-react"; // Added XCircle
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

  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isClearingCredentials, setIsClearingCredentials] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveDashboardTab>('products');


  useEffect(() => {
    if (!authIsLoading && !user) {
      router.replace('/signin'); 
    }
  }, [user, authIsLoading, router]);

  const loadProductsWithCredentials = useCallback(async (credentials?: { storeUrl: string; consumerKey: string; consumerSecret: string }) => {
    setIsLoadingProducts(true);
    setError(null);
    
    let response;
    if (credentials && credentials.storeUrl && credentials.consumerKey && credentials.consumerSecret) {
       toast({
        title: "Using User Credentials",
        description: "Fetching products using your saved WooCommerce store connection.",
        duration: 3000,
      });
      response = await fetchWooCommerceProducts(credentials);
    } else {
      toast({
        title: "Using Global Credentials",
        description: "Attempting to fetch products using the application's default WooCommerce connection.",
        duration: 3000,
      });
      response = await fetchWooCommerceProducts(); // Fallback to global .env credentials
    }

    if (response.error) {
      setError(response.error);
      setProducts([]);
    } else if (response.products) {
      const displayProducts = response.products.map((p: WCCustomProduct) => ({
        id: p.id.toString(),
        name: p.name,
        status: p.status === 'publish' ? 'Customizable' : p.status.charAt(0).toUpperCase() + p.status.slice(1),
        lastEdited: p.date_modified ? format(new Date(p.date_modified), 'yyyy-MM-dd') : 'N/A',
        imageUrl: p.images && p.images.length > 0 ? p.images[0].src : 'https://placehold.co/100x100/eee/ccc.png?text=No+Image',
        aiHint: p.name ? p.name.toLowerCase().split(' ').slice(0,2).join(' ') : 'product image',
      }));
      setProducts(displayProducts);
    }
    setIsLoadingProducts(false);
  }, [toast]);


  useEffect(() => {
    if (user && activeTab === 'products') {
      const userStoreUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const userConsumerKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const userConsumerSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);

      if (userStoreUrl && userConsumerKey && userConsumerSecret) {
        loadProductsWithCredentials({ storeUrl: userStoreUrl, consumerKey: userConsumerKey, consumerSecret: userConsumerSecret });
      } else {
        loadProductsWithCredentials(); // No user-specific creds, try global
      }
    } else if (activeTab !== 'products') {
      setIsLoadingProducts(false); // Not on products tab, no need to load
    }
  }, [user, activeTab, loadProductsWithCredentials]); 

  const handleAddNewProduct = () => {
    alert("Add New Product (Configuration) functionality coming soon!");
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" => {
    if (status === 'Customizable') return 'default';
    if (status === 'Draft') return 'secondary';
    return 'outline';
  };
  
  const getStatusBadgeClassName = (status: string): string => {
    if (status === 'Customizable') return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/30';
    if (status === 'Draft') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCredentials(true);
    
    if (!storeUrl.trim() || !consumerKey.trim() || !consumerSecret.trim()) {
        toast({
            title: "Missing Fields",
            description: "Please fill in all WooCommerce credential fields.",
            variant: "destructive",
        });
        setIsSavingCredentials(false);
        return;
    }
    if (!storeUrl.startsWith('http://') && !storeUrl.startsWith('https://')) {
        toast({
            title: "Invalid Store URL",
            description: "Store URL must start with http:// or https://.",
            variant: "destructive",
        });
        setIsSavingCredentials(false);
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    if (user) {
      try {
        localStorage.setItem(`wc_store_url_${user.id}`, storeUrl);
        localStorage.setItem(`wc_consumer_key_${user.id}`, consumerKey);
        localStorage.setItem(`wc_consumer_secret_${user.id}`, consumerSecret); 
        toast({
          title: "Credentials Saved",
          description: "Your WooCommerce credentials have been saved locally. Products will refresh if you are on the 'Products' tab.",
        });
        if (activeTab === 'products') {
             loadProductsWithCredentials({ storeUrl, consumerKey, consumerSecret });
        }
      } catch (error) {
         toast({
          title: "Error Saving Credentials",
          description: "Could not save credentials locally.",
          variant: "destructive",
        });
      }
    }
    setIsSavingCredentials(false);
  };
  
  const handleClearCredentials = async () => {
    setIsClearingCredentials(true);
    if (user) {
        try {
            localStorage.removeItem(`wc_store_url_${user.id}`);
            localStorage.removeItem(`wc_consumer_key_${user.id}`);
            localStorage.removeItem(`wc_consumer_secret_${user.id}`);
            setStoreUrl('');
            setConsumerKey('');
            setConsumerSecret('');
            toast({
                title: "Credentials Cleared",
                description: "Your saved WooCommerce credentials have been removed.",
            });
            if (activeTab === 'products') {
                loadProductsWithCredentials(); // Re-fetch with global credentials (or show error if none)
            }
        } catch (error) {
            toast({
                title: "Error Clearing Credentials",
                description: "Could not clear credentials from local storage.",
                variant: "destructive",
            });
        }
    }
    setIsClearingCredentials(false);
  };


  useEffect(() => {
    if (user) {
      const savedUrl = localStorage.getItem(`wc_store_url_${user.id}`);
      const savedKey = localStorage.getItem(`wc_consumer_key_${user.id}`);
      const savedSecret = localStorage.getItem(`wc_consumer_secret_${user.id}`);
      if (savedUrl) setStoreUrl(savedUrl);
      if (savedKey) setConsumerKey(savedKey);
      if (savedSecret) setConsumerSecret(savedSecret);
    } else {
      setStoreUrl('');
      setConsumerKey('');
      setConsumerSecret('');
    }
  }, [user]);

  if (authIsLoading || (!user && !authIsLoading)) { 
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
                          View, edit, and manage your customizable products. Products are fetched from your connected WooCommerce store.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingProducts ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-muted-foreground">Loading products...</p>
                          </div>
                        ) : error ? (
                          <div className="text-center py-10 text-destructive">
                            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
                            <p className="font-semibold">Error loading products:</p>
                            <p className="text-sm">{error}</p>
                            <p className="text-xs mt-2">Please check your WooCommerce API settings under 'Store Integration' and ensure your store is accessible. Also verify the global .env credentials if no user-specific ones are set.</p>
                          </div>
                        ) : products.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[80px] hidden sm:table-cell text-muted-foreground">Image</TableHead>
                                  <TableHead className="text-muted-foreground">Name</TableHead>
                                  <TableHead className="text-muted-foreground">Status</TableHead>
                                  <TableHead className="hidden md:table-cell text-muted-foreground">Last Edited (WooCommerce)</TableHead>
                                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {products.map((product) => (
                                  <TableRow key={product.id} className="hover:bg-muted/50">
                                    <TableCell className="hidden sm:table-cell">
                                      {product.imageUrl && product.imageUrl !== 'https://placehold.co/100x100/eee/ccc.png?text=No+Image' ? (
                                        <NextImage
                                          src={product.imageUrl}
                                          alt={product.name}
                                          width={48}
                                          height={48}
                                          className="h-12 w-12 rounded-md object-cover border border-border"
                                          data-ai-hint={product.aiHint || "product thumbnail"}
                                        />
                                      ) : (
                                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs border border-border">
                                          No Image
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium text-card-foreground">{product.name}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={getStatusBadgeVariant(product.status)}
                                        className={getStatusBadgeClassName(product.status)}
                                      >
                                        {product.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">{product.lastEdited}</TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-popover border-border">
                                          <DropdownMenuItem
                                            onClick={() => router.push(`/dashboard/products/${product.id}/options`)}
                                            className="hover:bg-accent focus:bg-accent cursor-pointer"
                                          >
                                            <Settings className="mr-2 h-4 w-4" />
                                            Product Options
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => router.push(`/customizer?productId=${product.id}`)} className="hover:bg-accent focus:bg-accent cursor-pointer">
                                            <Code className="mr-2 h-4 w-4" />
                                            Open Customizer
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <p className="text-muted-foreground mb-2">No products found using the current WooCommerce connection.</p>
                             <p className="text-xs text-muted-foreground mb-4">If you've just saved credentials, try navigating away from and back to the 'Products' tab to refresh.</p>
                            <Button onClick={handleAddNewProduct} variant="outline" className="hover:bg-accent hover:text-accent-foreground">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Configure First Product
                            </Button>
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
                          Connect your WooCommerce store to fetch and manage products. These credentials will be used for your account.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
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
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" className="w-full sm:w-auto" disabled={isSavingCredentials || isClearingCredentials}>
                              {isSavingCredentials ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="mr-2 h-4 w-4" />
                              )}
                              Save Credentials
                            </Button>
                             <Button 
                                type="button" 
                                variant="destructive" 
                                className="w-full sm:w-auto" 
                                onClick={handleClearCredentials}
                                disabled={isSavingCredentials || isClearingCredentials || (!storeUrl && !consumerKey && !consumerSecret))}
                            >
                              {isClearingCredentials ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                              )}
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

