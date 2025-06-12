
// A simplified interface for WooCommerce Product data focused on what we need for the dashboard
// You might want to expand this based on your needs or use a more comprehensive type definition library
export interface WCCustomProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: 'simple' | 'variable' | 'grouped' | 'external'; // and others
  status: 'draft' | 'pending' | 'private' | 'publish'; // and others
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  // ... other fields like downloads, download_limit, download_expiry
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  // ... backorders, backorders_allowed, backordered
  // ... weight, dimensions { length, width, height }
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  // ... related_ids, upsell_ids, cross_sell_ids
  parent_id: number;
  purchase_note: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: Array<{
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: Array<{ id: number; name: string; option: string }>;
  variations: number[]; // Array of variation IDs
  grouped_products: number[];
  menu_order: number;
  price_html: string;
  meta_data: Array<{ id: number; key: string; value: any }>;
  // ... and more fields
}

export interface WCVariationAttribute {
  id: number;
  name: string;
  option: string;
}

export interface WCVariationImage {
  id: number;
  src: string;
  alt: string;
  name: string;
}

export interface WCVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  status: 'publish' | 'private' | 'draft';
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  image: WCVariationImage | null; // Can be null if variation uses parent image
  attributes: WCVariationAttribute[];
  meta_data: Array<{ id: number; key: string; value: any }>;
}
