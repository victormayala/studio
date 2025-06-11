
'use server';

import type { WCCustomProduct } from '@/types/woocommerce';

interface FetchWooCommerceProductsResponse {
  products?: WCCustomProduct[];
  error?: string;
}

interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export async function fetchWooCommerceProducts(credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductsResponse> {
  const storeUrl = credentials?.storeUrl || process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = credentials?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = credentials?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    const missingFields = [];
    if (!storeUrl) missingFields.push('Store URL');
    if (!consumerKey) missingFields.push('Consumer Key');
    if (!consumerSecret) missingFields.push('Consumer Secret');
    
    const message = credentials 
      ? `User-specific WooCommerce API credentials missing: ${missingFields.join(', ')}.`
      : `Global WooCommerce API credentials (WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET) are not set in .env.`;
    
    console.error(message);
    return { error: `Server configuration error: ${message}` };
  }

  const apiUrl = `${storeUrl}/wp-json/wc/v3/products`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`WooCommerce API error: ${response.status} ${response.statusText}`, errorBody);
      return { error: `Failed to fetch products from WooCommerce. Status: ${response.status}. ${errorBody}` };
    }

    const products: WCCustomProduct[] = await response.json();
    return { products };
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    if (error instanceof Error) {
      return { error: `An unexpected error occurred: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while fetching products.' };
  }
}
