
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Edit3, Code, Trash2 } from "lucide-react";
import Link from "next/link";

interface MockProduct {
  id: string;
  name: string;
  status: 'Customizable' | 'Draft' | 'Archived';
  lastEdited: string;
  imageUrl?: string; // Optional image for the product
}

const mockProducts: MockProduct[] = [
  { id: 'prod_1', name: 'Classic T-Shirt', status: 'Customizable', lastEdited: '2024-07-28', imageUrl: 'https://placehold.co/100x100/E0F4F1/468189.png?text=Tee' },
  { id: 'prod_2', name: 'Coffee Mug - Unfinished', status: 'Draft', lastEdited: '2024-07-25', imageUrl: 'https://placehold.co/100x100/E0F4F1/468189.png?text=Mug' },
  { id: 'prod_3', name: 'Customizable Phone Case', status: 'Customizable', lastEdited: '2024-07-22', imageUrl: 'https://placehold.co/100x100/E0F4F1/468189.png?text=Case' },
  { id: 'prod_4', name: 'Archived Cap Design', status: 'Archived', lastEdited: '2024-06-15', imageUrl: 'https://placehold.co/100x100/E0F4F1/468189.png?text=Cap' },
];

export default function DashboardPage() {
  const handleAddNewProduct = () => {
    // Placeholder: Will eventually trigger a modal or navigate to a product creation page
    alert("Add New Product functionality coming soon!");
  };

  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure full height if needed */}
      {/* The AppHeader is already part of the layout via src/app/page.tsx or a future dashboard layout */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
                Your Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your customizable products and settings.
              </p>
            </div>
            <Button onClick={handleAddNewProduct} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Product
            </Button>
          </div>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Your Products</CardTitle>
              <CardDescription>
                View, edit, and manage your customizable products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Last Edited</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="hidden sm:table-cell">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-md object-cover"
                                data-ai-hint="product thumbnail" 
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                No Image
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                product.status === 'Customizable' ? 'default' :
                                product.status === 'Draft' ? 'secondary' :
                                'outline' 
                              }
                              className={
                                product.status === 'Customizable' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' :
                                product.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30' :
                                'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30'
                              }
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{product.lastEdited}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => alert(`Edit ${product.name}`)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Customizer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert(`Embed code for ${product.name}`)}>
                                  <Code className="mr-2 h-4 w-4" />
                                  Get Embed Code
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive" onClick={() => alert(`Archive ${product.name}`)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Archive
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
                  <p className="text-muted-foreground mb-2">You haven't added any products yet.</p>
                  <Button onClick={handleAddNewProduct} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Product
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
