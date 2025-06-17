
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCcw, MoreHorizontal, Settings, Code, Trash2, AlertTriangle, Loader2, LogOut, Link as LinkIcon, KeyRound, Save, Package as PackageIcon, PlugZap, UserCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { fetchWooCommerceProducts, type WooCommerceCredentials } from "@/app/actions/woocommerceActions";
import { deleteWooCommerceCredentials, type UserWooCommerceCredentials } from "@/app/actions/userCredentialsActions"; 
import { db } from '@/lib/firebase'; 
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; 
import type { WCCustomProduct } from '@/types/woocommerce';
import {format} from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/layout/AppHeader";
import { UploadProvider } from "@/contexts/UploadContext";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface DisplayProduct {
  id: string;
  name: string;
  status: string;
  lastEdited: string;
  imageUrl?: string;
  aiHint?: string;
}

type ActiveDashboardTab = 'products' | 'storeIntegration' | 'settings' | 'profile';

interface ProductToDelete {
  id: string;
  name: string;
}

const LOCALLY_HIDDEN_PRODUCTS_KEY_PREFIX = 'customizer_studio_locally_hidden_products_';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading, signOut: authSignOut } = useAuth();
  const { toast } = useToast(); 

  const [activeTab, setActiveTab] = useState<ActiveDashboardTab>('products');

  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [credentialsExist, setCredentialsExist] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductToDelete | null>(null);

  const getLocallyHiddenProductIds = useCallback((): string[] => {
    if (!user) return [];
    try {
      const storedIds = localStorage.getItem(`${LOCALLY_HIDDEN_PRODUCTS_KEY_PREFIX}${user.uid}`);
      return storedIds ? JSON.parse(storedIds) : [];
    } catch (e) {
      console.error("Error getting locally hidden product IDs:", e);
      return [];
    }
  }, [user]);

  const setLocallyHiddenProductIds = useCallback((ids: string[]): void => {
    if (!user) return;
    try {
      localStorage.setItem(`${LOCALLY_HIDDEN_PRODUCTS_KEY_PREFIX}${user.uid}`, JSON.stringify(ids));
    } catch (e) {
      console.error("Error setting locally hidden product IDs:", e);
      toast({
        title: "Storage Error",
        description: "Could not save hidden product preference locally.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const loadProductsWithUserCredentials = useCallback(async (
    isManualRefresh?: boolean,
    ignoreHiddenList: boolean = false
  ) => {
    if (!user) {
      setError("Please sign in to view products.");
      setIsLoadingProducts(false);
      return;
    }

    setIsLoadingProducts(true);
    setError(null);
    const startTime = Date.now();

    if (!credentialsExist || !storeUrl || !consumerKey || !consumerSecret) {
      setError("WooCommerce store not connected. Please go to 'Store Integration' to connect your store.");
      setProducts([]);
      setIsLoadingProducts(false);
      if (isManualRefresh) {
        toast({
          title: "Store Not Connected",
          description: "Please connect your WooCommerce store first.",
          variant: "default",
        });
      }
      return;
    }
    
    const userCredentialsToUse: WooCommerceCredentials = { 
      storeUrl, 
      consumerKey, 
      consumerSecret 
    };
    
    try {
      const { products: fetchedProducts, error: fetchError } = await fetchWooCommerceProducts(userCredentialsToUse);
      const duration = Date.now() - startTime;

      if (fetchError) {
        setError(fetchError);
        setProducts([]);
      } else if (fetchedProducts) {
        const hiddenProductIds = ignoreHiddenList ? [] : getLocallyHiddenProductIds();
        const filteredFetchedProducts = fetchedProducts.filter(p => !hiddenProductIds.includes(p.id.toString()));
        
        const displayProducts = filteredFetchedProducts.map(p => ({
          id: p.id.toString(),
          name: p.name,
          status: p.status,
          lastEdited: format(new Date(p.date_modified_gmt || p.date_modified || p.date_created_gmt || p.date_created), "PPP"),
          imageUrl: p.images && p.images.length > 0 ? p.images[0].src : `https://placehold.co/150x150.png`,
          aiHint: p.images && p.images.length > 0 && p.images[0].alt ? p.images[0].alt.split(" ").slice(0,2).join(" ") : "product image"
        }));
        setProducts(displayProducts);
        if (isManualRefresh) {
            toast({
            title: "Products Refreshed",
            description: `Fetched ${displayProducts.length} products using your saved credentials in ${duration}ms. ${ignoreHiddenList ? 'Hidden items temporarily shown.' : ''}`,
            });
        }
      } else {
        setProducts([]);
         if (isManualRefresh) {
            toast({
            title: "No Products Returned",
            description: "No products were returned from your store.",
            });
         }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during product fetch.";
      setError(message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [user, toast, getLocallyHiddenProductIds, credentialsExist, storeUrl, consumerKey, consumerSecret]);

  useEffect(() => {
    if (user && user.uid && db) {
      setIsLoadingCredentials(true);
      const docRef = doc(db, 'userWooCommerceCredentials', user.uid);
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const credentials = docSnap.data() as UserWooCommerceCredentials;
            setStoreUrl(credentials.storeUrl || '');
            setConsumerKey(credentials.consumerKey || '');
            setConsumerSecret(credentials.consumerSecret || '');
            setCredentialsExist(true);
          } else {
            setStoreUrl('');
            setConsumerKey('');
            setConsumerSecret('');
            setCredentialsExist(false);
          }
        })
        .catch(e => {
          console.error("Error loading credentials from Firestore (client-side):", e);
          toast({ title: "Credential Load Error", description: "Could not read saved credentials from the cloud.", variant: "destructive"});
          setCredentialsExist(false);
        })
        .finally(() => {
          setIsLoadingCredentials(false);
        });
    } else if (!user) {
      setStoreUrl('');
      setConsumerKey('');
      setConsumerSecret('');
      setCredentialsExist(false);
      setIsLoadingCredentials(false); 
    }
  }, [user, toast, db]);


  const handleSaveCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !user.uid || isSavingCredentials || !db) {
      toast({ title: "Error", description: "User not authenticated or database unavailable.", variant: "destructive" });
      return;
    }

    setIsSavingCredentials(true);
    const credentialsToSave: WooCommerceCredentials = { storeUrl, consumerKey, consumerSecret };
    
    try {
      const docRef = doc(db, 'userWooCommerceCredentials', user.uid);
      const dataToSave: UserWooCommerceCredentials = {
        ...credentialsToSave,
        lastSaved: serverTimestamp(),
      };
      await setDoc(docRef, dataToSave);
      
      setCredentialsExist(true);
      toast({
        title: "Credentials Saved",
        description: "Your WooCommerce credentials have been saved to your account.",
      });
      if (activeTab === 'products') {
         loadProductsWithUserCredentials(true, false); 
      }
    } catch (error: any) {
      console.error('Error saving WooCommerce credentials to Firestore (client-side):', error);
      toast({
        title: "Error Saving Credentials",
        description: `Failed to save credentials: ${error.message || "Unknown Firestore error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleClearCredentials = async () => {
    if (!user || !user.uid || isSavingCredentials) return;
    setIsSavingCredentials(true); 
    
    const result = await deleteWooCommerceCredentials(user.uid); 

    if (result.success) {
      setStoreUrl('');
      setConsumerKey('');
      setConsumerSecret('');
      setCredentialsExist(false);
      toast({
        title: "Credentials Cleared",
        description: "Your WooCommerce credentials have been removed from your account.",
      });
       if (activeTab === 'products') {
        setProducts([]); 
        setError("WooCommerce store not connected. Please go to 'Store Integration' to connect your store.");
      }
    } else {
      toast({
        title: "Error Clearing Credentials",
        description: result.error || "Could not clear credentials from your account.",
        variant: "destructive",
      });
    }
    setIsSavingCredentials(false);
  };

  const handleRefreshDashboardData = useCallback(() => {
    if (user && user.uid && !isLoadingCredentials) {
      if (credentialsExist) {
         loadProductsWithUserCredentials(true, true);
      } else {
         setError("WooCommerce store not connected. Please go to 'Store Integration' to connect your store.");
         setProducts([]);
         toast({ 
            title: "Cannot Refresh",
            description: "Please connect your WooCommerce store first.",
            variant: "default",
          });
      }
    }
  }, [user, isLoadingCredentials, loadProductsWithUserCredentials, credentialsExist, toast]);

  useEffect(() => {
    if (activeTab === 'products' && user && user.uid && !isLoadingCredentials && products.length === 0 && !isLoadingProducts && !error) {
       if (credentialsExist) {
        loadProductsWithUserCredentials(false, false); 
       } else if (!isLoadingProducts) { 
         setError("WooCommerce store not connected. Please go to 'Store Integration' to connect your store.");
       }
    }
  }, [activeTab, user, isLoadingCredentials, products.length, isLoadingProducts, error, loadProductsWithUserCredentials, credentialsExist]);

  const handleDeleteProduct = (product: DisplayProduct) => {
    setProductToDelete({ id: product.id, name: product.name });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete || !user) return;
    
    const currentHiddenIds = getLocallyHiddenProductIds();
    if (!currentHiddenIds.includes(productToDelete.id)) {
      setLocallyHiddenProductIds([...currentHiddenIds, productToDelete.id]);
    }

    toast({
      title: "Product Hidden",
      description: `${productToDelete.name} has been hidden from your dashboard. It is not deleted from your store. Click "Refresh Product Data" with "ignore hidden" to see it again (if needed).`,
    });
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id)); 
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  if (authIsLoading || !user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isStoreNotConnectedError = error && (error.includes("store not connected") || error.includes("credentials are not configured") || error.includes("User-specific WooCommerce credentials are required"));

  return (
    <UploadProvider>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <SidebarProvider defaultOpen>
          <div className="flex flex-1">
            <Sidebar side="left" className="h-full shadow-md border-r">
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
                        <Button onClick={handleRefreshDashboardData} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoadingProducts || isLoadingCredentials || !credentialsExist}>
                          {isLoadingProducts ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCcw className="mr-2 h-5 w-5" />}
                          Refresh Product Data
                        </Button>
                      </div>
                    )}
                  </div>

                  {activeTab === 'products' && (
                    <Card className="shadow-lg border-border bg-card">
                      <CardHeader>
                        <CardTitle className="font-headline text-xl text-card-foreground">Your Products</CardTitle>
                        <CardDescription className="text-muted-foreground">
                          View, edit, and manage your customizable products from your connected store.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingProducts || (isLoadingCredentials && !credentialsExist && !error) ? ( 
                          <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Loading products...</p>
                          </div>
                        ) : error ? (
                          <div className="text-center py-10">
                            <AlertTriangle className="mx-auto h-12 w-12 text-orange-500" />
                            <p className="mt-4 text-orange-600 font-semibold">
                              {isStoreNotConnectedError
                                ? "Store Not Connected"
                                : "No Products Found"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 px-4">
                              {isStoreNotConnectedError
                                ? <>Your WooCommerce store is not connected.<br />Please go to 'Store Integration' to connect your store.</>
                                : error}
                            </p>
                            {isStoreNotConnectedError && (
                              <Button variant="link" onClick={() => setActiveTab('storeIntegration')} className="mt-3 text-orange-600 hover:text-orange-700">
                                Go to Store Integration
                              </Button>
                            )}
                          </div>
                        ) : products.length > 0 && credentialsExist ? (
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
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => handleDeleteProduct(product)}>
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : credentialsExist ? ( 
                          <div className="text-center py-10">
                            <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No products found in your connected store.</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Click "Refresh Product Data" to try fetching again.
                            </p>
                          </div>
                        ) : ( 
                           <div className="text-center py-10">
                            <PlugZap className="mx-auto h-12 w-12 text-orange-500" />
                            <p className="mt-4 text-orange-600 font-semibold">Store Not Connected</p>
                            <p className="text-sm text-muted-foreground mt-1 px-4">
                               Your WooCommerce store is not connected.<br />Please go to the 'Store Integration' tab to set up your WooCommerce connection.
                            </p>
                             <Button variant="link" onClick={() => setActiveTab('storeIntegration')} className="mt-3 text-orange-600 hover:text-orange-700">
                                Connect Store
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
                          Connect your WooCommerce store to fetch and manage products. Your credentials are saved to your account.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingCredentials ? ( 
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
                                disabled={isSavingCredentials || (!storeUrl && !consumerKey && !consumerSecret && !credentialsExist)}
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
          </div>
        </SidebarProvider>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will hide the product "{productToDelete?.name}" from your dashboard in this browser. 
              It will not be deleted from your WooCommerce store. Clicking "Refresh Product Data" with "ignore hidden" to see it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={cn(buttonVariants({variant: "destructive"}))}
            >
              Hide Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UploadProvider>
  );
}
    

    