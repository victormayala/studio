
"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image'; // Renamed to avoid conflict with local Image
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  boundaryBoxes: BoundaryBox[];
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
  boundaryBoxes: [],
};

export default function ProductOptionsPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  
  const [newColorHex, setNewColorHex] = useState<string>('#CCCCCC');
  const [newColorSwatch, setNewColorSwatch] = useState<string>('#CCCCCC');
  const [newSize, setNewSize] = useState<string>('');
  const [selectedBoundaryBoxId, setSelectedBoundaryBoxId] = useState<string | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (productId) {
      // Simulating fetching product details
      const foundProduct = mockProductDetails.id === productId ? mockProductDetails : { 
            ...mockProductDetails, 
            id: productId, 
            name: `Product ${productId}`, 
            imageUrl: `https://placehold.co/600x600.png?text=Product+${productId}`,
            boundaryBoxes: [], 
          };
      setProduct(foundProduct);
      if (foundProduct.boundaryBoxes.length > 0) {
        // setSelectedBoundaryBoxId(foundProduct.boundaryBoxes[0].id); // Optionally select the first box
      } else {
        setSelectedBoundaryBoxId(null);
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
  };

  const handleRemoveColor = (colorToRemove: string) => {
    if (!product) return;
    const updatedProduct = { ...product, colors: product.colors.filter(c => c !== colorToRemove) };
    setProduct(updatedProduct);
  };

  const handleAddSize = () => {
    if (!product || !newSize.trim()) return;
    const updatedProduct = { ...product, sizes: [...product.sizes, newSize.trim()] };
    setProduct(updatedProduct);
    setNewSize('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
     if (!product) return;
    const updatedProduct = { ...product, sizes: product.sizes.filter(s => s !== sizeToRemove) };
    setProduct(updatedProduct);
  };
  
  const handleSaveChanges = () => {
    alert("Saving changes... (functionality not implemented)");
  };

  const handleAddBoundaryBox = () => {
    if (!product || product.boundaryBoxes.length >= 3) return;
    const newBox: BoundaryBox = {
      id: crypto.randomUUID(),
      name: `Area ${product.boundaryBoxes.length + 1}`,
      x: 10 + product.boundaryBoxes.length * 5, 
      y: 10 + product.boundaryBoxes.length * 5,
      width: 30,
      height: 20,
    };
    const updatedProduct = { ...product, boundaryBoxes: [...product.boundaryBoxes, newBox] };
    setProduct(updatedProduct);
    setSelectedBoundaryBoxId(newBox.id); // Select the new box
  };

  const handleRemoveBoundaryBox = (boxId: string) => {
    setProduct(prev => prev ? { ...prev, boundaryBoxes: prev.boundaryBoxes.filter(b => b.id !== boxId) } : null);
    if (selectedBoundaryBoxId === boxId) {
      setSelectedBoundaryBoxId(null);
    }
  };
  
  const handleProductDetailChange = (field: keyof ProductDetails, value: any) => {
    if (product) {
      setProduct({ ...product, [field]: value });
    }
  };

  const handleBoundaryBoxNameChange = (boxId: string, newName: string) => {
    if (!product) return;
    const updatedBoxes = product.boundaryBoxes.map(box =>
      box.id === boxId ? { ...box, name: newName } : box
    );
    setProduct({ ...product, boundaryBoxes: updatedBoxes });
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
              <CardTitle className="font-headline text-lg">Product Image & Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={imageWrapperRef} className="relative w-full aspect-square border rounded-md overflow-hidden group bg-muted/20">
                {product.imageUrl ? (
                  <NextImage
                    src={product.imageUrl}
                    alt={product.name}
                    fill // Use fill for responsive sizing within the aspect-square container
                    className="object-contain" // Use object-contain to ensure the whole image is visible
                    data-ai-hint={product.aiHint || "product image"}
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No image available</p>
                  </div>
                )}

                {/* Render Boundary Boxes */}
                {product.boundaryBoxes.map((box) => (
                  <div
                    key={box.id}
                    className={cn(
                      "absolute transition-all duration-150 ease-in-out",
                      "border-2 hover:border-primary/70",
                      selectedBoundaryBoxId === box.id ? 'border-primary ring-2 ring-primary ring-offset-2 bg-primary/10' : 'border-dashed border-muted-foreground/70 hover:bg-foreground/5',
                      "cursor-pointer" // Add cursor pointer to indicate interactivity
                    )}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      // zIndex needed if you want them above other things, or to control stacking if they overlap
                    }}
                    onClick={() => setSelectedBoundaryBoxId(box.id)}
                    title={`Select Area: ${box.name}`}
                  >
                    {/* Future: Handles can go here */}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click on an area on the image or in the list below to select it. Interactive editing coming soon.
              </p>
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
                  {product.boundaryBoxes.map((box) => (
                    <div 
                      key={box.id} 
                      className={cn(
                        "p-3 border rounded-md transition-all",
                        selectedBoundaryBoxId === box.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-muted/30 hover:bg-muted/50',
                        "cursor-pointer"
                      )}
                      onClick={() => setSelectedBoundaryBoxId(box.id)}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <Input
                          value={box.name}
                          onChange={(e) => handleBoundaryBoxNameChange(box.id, e.target.value)}
                          className="text-sm font-semibold text-foreground h-8 flex-grow mr-2 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring p-1"
                          onClick={(e) => e.stopPropagation()} // Prevent card click when editing name
                        />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); handleRemoveBoundaryBox(box.id);}} 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                            title="Remove Area"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><strong>X:</strong> {box.x.toFixed(1)}% | <strong>Y:</strong> {box.y.toFixed(1)}%</p>
                        <p><strong>W:</strong> {box.width.toFixed(1)}% | <strong>H:</strong> {box.height.toFixed(1)}%</p>
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
                    onBlur={(e) => setNewColorSwatch(e.target.value)} 
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

