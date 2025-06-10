
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';

// Define the BoundaryBox interface
interface BoundaryBox {
  id: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage width
  height: number; // percentage height
}

// Mock data - replace with actual data fetching
interface ProductDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  colors: string[];
  sizes: string[];
  imageUrl: string;
  aiHint?: string;
  boundaryBoxes: BoundaryBox[]; // Added boundaryBoxes
}

const mockProductDetails: ProductDetails = {
  id: 'prod_1',
  name: 'Classic T-Shirt',
  description: 'A high-quality cotton t-shirt, perfect for customization.',
  price: 19.99,
  colors: ['#FFFFFF', '#000000', '#FF0000'],
  sizes: ['S', 'M', 'L', 'XL'],
  imageUrl: 'https://placehold.co/600x600.png',
  aiHint: 't-shirt mockup front',
  boundaryBoxes: [], // Initialized as empty
};

export default function ProductOptionsPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  
  const [newColorHex, setNewColorHex] = useState<string>('#CCCCCC');
  const [newColorSwatch, setNewColorSwatch] = useState<string>('#CCCCCC');
  const [newSize, setNewSize] = useState<string>('');

  useEffect(() => {
    if (productId) {
      if (mockProductDetails.id === productId) {
          setProduct(mockProductDetails);
      } else {
          const genericProduct = { 
            ...mockProductDetails, 
            id: productId, 
            name: `Product ${productId}`, 
            imageUrl: `https://placehold.co/600x600.png?text=Product+${productId}`,
            boundaryBoxes: [], // Ensure boundaryBoxes is initialized for generic products too
          };
          setProduct(genericProduct);
      }
    }
  }, [productId]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-card">
        <p>Loading product details...</p>
      </div>
    );
  }

  const handleAddColor = () => {
    if (!product) return;
    const updatedProduct = { ...product, colors: [...product.colors, newColorHex] };
    setProduct(updatedProduct);
    setNewColorHex('#CCCCCC'); 
    setNewColorSwatch('#CCCCCC');
    // Placeholder for actual API call
    // alert(`Adding color: ${newColorHex}`);
  };

  const handleRemoveColor = (colorToRemove: string) => {
    if (!product) return;
    const updatedProduct = { ...product, colors: product.colors.filter(c => c !== colorToRemove) };
    setProduct(updatedProduct);
    // Placeholder
    // alert(`Removing color: ${colorToRemove}`);
  };

  const handleAddSize = () => {
    if (!product || !newSize.trim()) return;
    const updatedProduct = { ...product, sizes: [...product.sizes, newSize.trim()] };
    setProduct(updatedProduct);
    setNewSize('');
    // Placeholder
    // alert(`Adding size: ${newSize}`);
  };

  const handleRemoveSize = (sizeToRemove: string) => {
     if (!product) return;
    const updatedProduct = { ...product, sizes: product.sizes.filter(s => s !== sizeToRemove) };
    setProduct(updatedProduct);
    // Placeholder
    // alert(`Removing size: ${sizeToRemove}`);
  };
  
  const handleSaveChanges = () => {
    alert("Saving changes... (functionality not implemented)");
  };

  const handleAddBoundaryBox = () => {
    if (!product || product.boundaryBoxes.length >= 3) return;
    const newBox: BoundaryBox = {
      id: crypto.randomUUID(),
      name: `Area ${product.boundaryBoxes.length + 1}`,
      x: 10, // Default values
      y: 10,
      width: 30,
      height: 20,
    };
    setProduct(prev => prev ? { ...prev, boundaryBoxes: [...prev.boundaryBoxes, newBox] } : null);
  };

  const handleRemoveBoundaryBox = (boxId: string) => {
    setProduct(prev => prev ? { ...prev, boundaryBoxes: prev.boundaryBoxes.filter(b => b.id !== boxId) } : null);
  };
  
  const handleProductDetailChange = (field: keyof ProductDetails, value: any) => {
    if (product) {
      setProduct({ ...product, [field]: value });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-card min-h-screen">
      <div className="mb-6">
        <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline text-foreground">
        Product Options
      </h1>
      <p className="text-muted-foreground mb-8">
        Editing options for: <span className="font-semibold text-foreground">{product.name}</span> (ID: {product.id})
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
           <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="rounded-md object-contain border aspect-square"
                  data-ai-hint={product.aiHint || "product image"}
                />
              ) : (
                 <div className="aspect-square bg-muted rounded-md flex flex-col items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">No image available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Customization Areas</CardTitle>
              <CardDescription>Define printable/customizable regions. (Max 3)</CardDescription>
            </CardHeader>
            <CardContent>
              {product.boundaryBoxes.length > 0 && (
                <div className="space-y-3 mb-4">
                  {product.boundaryBoxes.map((box, index) => (
                    <div key={box.id} className="p-3 border rounded-md bg-muted/30">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="font-semibold text-sm text-foreground">
                          {/* Basic name editing could be added here later */}
                          Area {index + 1} 
                        </h4>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveBoundaryBox(box.id)} 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                            title="Remove Area"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* For now, display values. Inputs for editing can be a future step. */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><strong>Name:</strong> {box.name}</p>
                        <p><strong>X:</strong> {box.x}% | <strong>Y:</strong> {box.y}%</p>
                        <p><strong>Width:</strong> {box.width}% | <strong>Height:</strong> {box.height}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {product.boundaryBoxes.length < 3 ? (
                <Button onClick={handleAddBoundaryBox} variant="outline" className="w-full hover:bg-accent hover:text-accent-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Customization Area
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Maximum of 3 customization areas reached.
                </p>
              )}
               <p className="text-xs text-muted-foreground mt-3 text-center">
                  Interactive boundary box editor coming soon.
                </p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input 
                    id="productName" 
                    value={product.name} 
                    onChange={(e) => handleProductDetailChange('name', e.target.value)}
                    className="mt-1" 
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea 
                    id="productDescription" 
                    value={product.description} 
                    onChange={(e) => handleProductDetailChange('description', e.target.value)}
                    className="mt-1" 
                    rows={4} 
                />
              </div>
              <div>
                <Label htmlFor="productPrice">Product Price ($)</Label>
                <Input 
                    id="productPrice" 
                    type="number" 
                    value={product.price} 
                    onChange={(e) => handleProductDetailChange('price', parseFloat(e.target.value) || 0)}
                    className="mt-1" 
                    step="0.01" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Colors</CardTitle>
              <CardDescription>Manage available color options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Current Colors:</Label>
                {product.colors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) => (
                      <Badge key={index} variant="secondary" className="relative group pr-7">
                        <span className="inline-block w-3 h-3 rounded-full mr-1.5 border" style={{ backgroundColor: color }}></span>
                        {color.toUpperCase()}
                        <button 
                            onClick={() => handleRemoveColor(color)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Remove color"
                        >
                           <Trash2 className="w-3 h-3"/>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No colors added yet.</p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label htmlFor="newColorHex">Add New Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    id="newColorSwatch"
                    value={newColorSwatch}
                    onChange={(e) => { setNewColorSwatch(e.target.value); setNewColorHex(e.target.value);}}
                    className="p-0.5 h-10 w-12 border-input rounded-md"
                  />
                  <Input
                    id="newColorHex"
                    placeholder="#RRGGBB"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                    onBlur={(e) => setNewColorSwatch(e.target.value)} // Ensure swatch updates if hex is manually changed
                    maxLength={7}
                    className="flex-grow"
                  />
                  <Button onClick={handleAddColor} variant="outline" size="icon" className="shrink-0 hover:bg-accent hover:text-accent-foreground">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Add Color</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Product Sizes</CardTitle>
              <CardDescription>Manage available size options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Current Sizes:</Label>
                {product.sizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, index) => (
                       <Badge key={index} variant="secondary" className="relative group pr-7">
                        {size}
                         <button 
                            onClick={() => handleRemoveSize(size)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Remove size"
                        >
                           <Trash2 className="w-3 h-3"/>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sizes added yet.</p>
                )}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Label htmlFor="newSize">Add New Size</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="newSize"
                    placeholder="e.g., XL, 12oz"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                     className="flex-grow"
                  />
                  <Button onClick={handleAddSize} variant="outline" size="icon" className="shrink-0 hover:bg-accent hover:text-accent-foreground">
                    <PlusCircle className="h-5 w-5" />
                     <span className="sr-only">Add Size</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleSaveChanges} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save Product Options
        </Button>
      </div>
    </div>
  );
}

