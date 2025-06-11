
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Settings, Code, Trash2, AlertTriangle, Loader2, LogOut } from "lucide-react"; // Added LogOut
import Link from "next/link";
import { useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { fetchWooCommerceProducts } from "@/app/actions/woocommerceActions";
import type { WCCustomProduct } from '@/types/woocommerce';
import {format} from 'date-fns';
import { useAuth } from "@/contexts/AuthContext"; // Added
import { useToast } from "@/hooks/use-toast"; // Added
import AppHeader from "@/components/layout/AppHeader"; // For a consistent header within the app

interface DisplayProduct {
  id: string;
  name: string;
  status: string;
  lastEdited: string;
  imageUrl?: string;
  aiHint?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authIsLoading, signOut } = useAuth(); // Added
  const { toast } = useToast(); // Added

  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsLoading && !user) {
      router.replace('/signin'); // Redirect if not logged in
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (user) { // Only fetch products if user is logged in
      async function loadProducts() {
        setIsLoadingProducts(true);
        setError(null);
        const response = await fetchWooCommerceProducts();
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
      }
      loadProducts();
    }
  }, [user]); // Depend on user to re-fetch if user changes (though less likely here)

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      // Navigation is handled by AuthContext's signOut
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign you out. Please try again.", variant: "destructive" });
    }
  };

  if (authIsLoading || (!user && !authIsLoading)) { // Show loading while checking auth or if redirecting
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  // At this point, user should be authenticated.

  return (
    <div className="flex flex-col min-h-screen">
       {/* Using AppHeader now for consistent internal navigation */}
      <AppHeader /> 
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-card">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
                Your Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your customizable products. Welcome, {user?.email}!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Product Configuration
              </Button>
              {/* Sign Out button moved to AppHeader */}
            </div>
          </div>

          <Card className="shadow-lg border-border bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-card-foreground">Your Products</CardTitle>
              <CardDescription className="text-muted-foreground">
                View, edit, and manage your customizable products. Products are fetched from WooCommerce.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading products from WooCommerce...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-destructive">
                  <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
                  <p className="font-semibold">Error loading products:</p>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-2">Please check your WooCommerce API settings in .env and ensure your store is accessible.</p>
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
                  <p className="text-muted-foreground mb-2">No products found in your WooCommerce store.</p>
                  <Button onClick={handleAddNewProduct} variant="outline" className="hover:bg-accent hover:text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Configure First Product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
