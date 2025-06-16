
'use server';

import type { WCCustomProduct, WCVariation } from '@/types/woocommerce';

interface FetchWooCommerceProductsResponse {
  products?: WCCustomProduct[];
  error?: string;
}

interface FetchWooCommerceProductByIdResponse {
  product?: WCCustomProduct;
  error?: string;
}

interface FetchWooCommerceProductVariationsResponse {
  variations?: WCVariation[];
  error?: string;
}

interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

function getApiCredentials(credentials?: WooCommerceCredentials) {
  const storeUrl = credentials?.storeUrl || process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = credentials?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = credentials?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;
  return { storeUrl, consumerKey, consumerSecret, isUserProvided: !!credentials };
}

export async function fetchWooCommerceProducts(credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductsResponse> {
  const { storeUrl, consumerKey, consumerSecret, isUserProvided } = getApiCredentials(credentials);

  if (!storeUrl || !consumerKey || !consumerSecret) {
    const missingFields = [];
    if (!storeUrl) missingFields.push('Store URL');
    if (!consumerKey) missingFields.push('Consumer Key');
    if (!consumerSecret) missingFields.push('Consumer Secret');
    
    const message = isUserProvided 
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
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`WooCommerce API error: ${response.status} ${response.statusText}`, errorBody);
      return { error: `Failed to fetch products from WooCommerce. Status: ${response.status}. Details: ${errorBody}` };
    }

    let products: WCCustomProduct[];
    try {
      products = await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON response from WooCommerce:', jsonError);
      if (jsonError instanceof Error) {
        return { error: `Failed to parse product data from WooCommerce. Invalid JSON. Details: ${jsonError.message}` };
      }
      return { error: 'Failed to parse product data from WooCommerce. Invalid JSON.' };
    }
    
    return { products };
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while fetching products.' };
  }
}

export async function fetchWooCommerceProductById(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductByIdResponse> {
  const { storeUrl, consumerKey, consumerSecret, isUserProvided } = getApiCredentials(credentials);
  
  if (!productId) {
    return { error: 'Product ID is required.' };
  }

  if (!storeUrl || !consumerKey || !consumerSecret) {
    const missingFields = [];
    if (!storeUrl) missingFields.push('Store URL');
    if (!consumerKey) missingFields.push('Consumer Key');
    if (!consumerSecret) missingFields.push('Consumer Secret');
    
    const message = isUserProvided
      ? `User-specific WooCommerce API credentials missing: ${missingFields.join(', ')}.`
      : `Global WooCommerce API credentials (WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET) are not set in .env.`;
    
    console.error(message);
    return { error: `Server configuration error: ${message}` };
  }

  const apiUrl = `${storeUrl}/wp-json/wc/v3/products/${productId}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`WooCommerce API error for product ${productId}: ${response.status} ${response.statusText}`, errorBody);
      return { error: `Failed to fetch product ${productId}. Status: ${response.status}. ${errorBody}` };
    }

    let product: WCCustomProduct;
    try {
        product = await response.json();
    } catch (jsonError) {
        console.error(`Error parsing JSON response for product ${productId}:`, jsonError);
        if (jsonError instanceof Error) {
            return { error: `Failed to parse data for product ${productId}. Invalid JSON. Details: ${jsonError.message}` };
        }
        return { error: `Failed to parse data for product ${productId}. Invalid JSON.` };
    }
    return { product };
  } catch (error) {
    console.error(`Error fetching WooCommerce product ${productId}:`, error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred for product ${productId}: ${error.message}` };
    }
    return { error: `An unexpected error occurred while fetching product ${productId}.` };
  }
}

export async function fetchWooCommerceProductVariations(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductVariationsResponse> {
  const { storeUrl, consumerKey, consumerSecret, isUserProvided } = getApiCredentials(credentials);

  if (!productId) {
    return { error: 'Product ID is required to fetch variations.' };
  }

  if (!storeUrl || !consumerKey || !consumerSecret) {
    const missingFields = [];
    if (!storeUrl) missingFields.push('Store URL');
    if (!consumerKey) missingFields.push('Consumer Key');
    if (!consumerSecret) missingFields.push('Consumer Secret');
    
    const message = isUserProvided
      ? `User-specific WooCommerce API credentials for variations missing: ${missingFields.join(', ')}.`
      : `Global WooCommerce API credentials for variations are not set in .env.`;
    
    console.error(message);
    return { error: `Server configuration error: ${message}` };
  }

  const apiUrl = `${storeUrl}/wp-json/wc/v3/products/${productId}/variations?per_page=100`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`WooCommerce API error for product ${productId} variations: ${response.status} ${response.statusText}`, errorBody);
      return { error: `Failed to fetch variations for product ${productId}. Status: ${response.status}. ${errorBody}` };
    }

    let variations: WCVariation[];
    try {
        variations = await response.json();
    } catch (jsonError) {
        console.error(`Error parsing JSON response for product ${productId} variations:`, jsonError);
        if (jsonError instanceof Error) {
            return { error: `Failed to parse variation data for product ${productId}. Invalid JSON. Details: ${jsonError.message}` };
        }
        return { error: `Failed to parse variation data for product ${productId}. Invalid JSON.` };
    }
    return { variations };
  } catch (error) {
    console.error(`Error fetching WooCommerce variations for product ${productId}:`, error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred for product ${productId} variations: ${error.message}` };
    }
    return { error: `An unexpected error occurred while fetching variations for product ${productId}.` };
  }
}

