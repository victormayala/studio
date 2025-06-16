
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

  console.log(`WooCommerce API Credentials Check: 
    Store URL Found: ${!!storeUrl} (User Provided: ${!!credentials?.storeUrl}), 
    Consumer Key Found: ${!!consumerKey} (User Provided: ${!!credentials?.consumerKey}), 
    Consumer Secret Found: ${!!consumerSecret} (User Provided: ${!!credentials?.consumerSecret})`);

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
      : `Global WooCommerce API credentials (WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET) are not set in .env or provided.`;
    
    console.error(`CRITICAL WOOCOMMERCE ERROR: ${message}`);
    return { error: `Server configuration error: ${message} Check server logs for details.` };
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
      console.error(`WooCommerce API error during product fetch: ${response.status} ${response.statusText}`, errorBody);
      return { error: `Failed to fetch products from WooCommerce. Status: ${response.status}. Details: ${errorBody}. Check server logs.` };
    }

    let products: WCCustomProduct[];
    try {
      products = await response.json();
    } catch (jsonError) {
      console.error('Error parsing JSON response from WooCommerce product fetch:', jsonError);
      if (jsonError instanceof Error) {
        return { error: `Failed to parse product data from WooCommerce. Invalid JSON. Details: ${jsonError.message}. Check server logs.` };
      }
      return { error: 'Failed to parse product data from WooCommerce. Invalid JSON. Check server logs.' };
    }
    
    return { products };
  } catch (error) {
    console.error('Network or fetch error during WooCommerce product fetch:', error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred: ${error.message}. Check server logs.` };
    }
    return { error: 'An unexpected error occurred while fetching products. Check server logs.' };
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
      ? `User-specific WooCommerce API credentials missing for product ID ${productId}: ${missingFields.join(', ')}.`
      : `Global WooCommerce API credentials for product ID ${productId} are not set in .env or provided.`;
    
    console.error(`CRITICAL WOOCOMMERCE ERROR: ${message}`);
    return { error: `Server configuration error: ${message} Check server logs for details.` };
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
      return { error: `Failed to fetch product ${productId}. Status: ${response.status}. ${errorBody}. Check server logs.` };
    }

    let product: WCCustomProduct;
    try {
        product = await response.json();
    } catch (jsonError) {
        console.error(`Error parsing JSON response for product ${productId}:`, jsonError);
        if (jsonError instanceof Error) {
            return { error: `Failed to parse data for product ${productId}. Invalid JSON. Details: ${jsonError.message}. Check server logs.` };
        }
        return { error: `Failed to parse data for product ${productId}. Invalid JSON. Check server logs.` };
    }
    return { product };
  } catch (error) {
    console.error(`Network or fetch error for WooCommerce product ${productId}:`, error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred for product ${productId}: ${error.message}. Check server logs.` };
    }
    return { error: `An unexpected error occurred while fetching product ${productId}. Check server logs.` };
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
      ? `User-specific WooCommerce API credentials for variations of product ${productId} missing: ${missingFields.join(', ')}.`
      : `Global WooCommerce API credentials for variations of product ${productId} are not set in .env or provided.`;
    
    console.error(`CRITICAL WOOCOMMERCE ERROR: ${message}`);
    return { error: `Server configuration error: ${message} Check server logs for details.` };
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
      return { error: `Failed to fetch variations for product ${productId}. Status: ${response.status}. ${errorBody}. Check server logs.` };
    }

    let variations: WCVariation[];
    try {
        variations = await response.json();
    } catch (jsonError) {
        console.error(`Error parsing JSON response for product ${productId} variations:`, jsonError);
        if (jsonError instanceof Error) {
            return { error: `Failed to parse variation data for product ${productId}. Invalid JSON. Details: ${jsonError.message}. Check server logs.` };
        }
        return { error: `Failed to parse variation data for product ${productId}. Invalid JSON. Check server logs.` };
    }
    return { variations };
  } catch (error) {
    console.error(`Network or fetch error for WooCommerce variations for product ${productId}:`, error);
    if (error instanceof Error) {
      return { error: `An unexpected network or fetch error occurred for product ${productId} variations: ${error.message}. Check server logs.` };
    }
    return { error: `An unexpected error occurred while fetching variations for product ${productId}. Check server logs.` };
  }
}
