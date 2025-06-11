
'use server';

import type { WCCustomProduct } from '@/types/woocommerce';

interface FetchWooCommerceProductsResponse {
  products?: WCCustomProduct[];
  error?: string;
}

export async function fetchWooCommerceProducts(): Promise<FetchWooCommerceProductsResponse> {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    console.error('WooCommerce API credentials are not set in .env');
    return { error: 'Server configuration error: WooCommerce API credentials missing.' };
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
