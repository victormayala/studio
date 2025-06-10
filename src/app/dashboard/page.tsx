
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Settings, Code, Trash2 } from "lucide-react"; // Added Settings
import Link from "next/link";

interface MockProduct {
  id: string;
  name: string;
  status: 'Customizable' | 'Draft' | 'Archived';
  lastEdited: string;
  imageUrl?: string;
  aiHint?: string;
}

const mockProducts: MockProduct[] = [
  { id: 'prod_1', name: 'Classic T-Shirt', status: 'Customizable', lastEdited: '2024-07-28', imageUrl: 'https://placehold.co/100x100.png', aiHint: 't-shirt' },
  { id: 'prod_2', name: 'Coffee Mug - Unfinished', status: 'Draft', lastEdited: '2024-07-25', imageUrl: 'https://placehold.co/100x100.png', aiHint: 'coffee mug' },
  { id: 'prod_3', name: 'Customizable Phone Case', status: 'Customizable', lastEdited: '2024-07-22', imageUrl: 'https://placehold.co/100x100.png', aiHint: 'phone case' },
  { id: 'prod_4', name: 'Archived Cap Design', status: 'Archived', lastEdited: '2024-06-15', imageUrl: 'https://placehold.co/100x100.png', aiHint: 'cap' },
];

export default function DashboardPage() {
  const handleAddNewProduct = () => {
    alert("Add New Product functionality coming soon!");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-card">
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

          <Card className="shadow-lg border-border bg-card">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-card-foreground">Your Products</CardTitle>
              <CardDescription className="text-muted-foreground">
                View, edit, and manage your customizable products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] hidden sm:table-cell text-muted-foreground">Image</TableHead>
                        <TableHead className="text-muted-foreground">Name</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="hidden md:table-cell text-muted-foreground">Last Edited</TableHead>
                        <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                          <TableCell className="hidden sm:table-cell">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
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
                              variant={
                                product.status === 'Customizable' ? 'default' :
                                product.status === 'Draft' ? 'secondary' :
                                'outline'
                              }
                              className={
                                product.status === 'Customizable' ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/30' :
                                product.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' :
                                'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
                              }
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
                                <DropdownMenuItem asChild className="hover:bg-accent focus:bg-accent cursor-pointer">
                                  <Link href={`/dashboard/products/${product.id}/options`}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Product Options
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert(`Embed code for ${product.name}`)} className="hover:bg-accent focus:bg-accent cursor-pointer">
                                  <Code className="mr-2 h-4 w-4" />
                                  Get Embed Code
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 focus:!text-destructive cursor-pointer" onClick={() => alert(`Archive ${product.name}`)}>
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
                  <Button onClick={handleAddNewProduct} variant="outline" className="hover:bg-accent hover:text-accent-foreground">
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
