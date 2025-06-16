
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
    return { error: `Server configuration error: ${message} Please check server logs for details and ensure credentials are set.` };
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
      const errorLog = `WooCommerce API error during product fetch: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch products from WooCommerce. Status: ${response.status}. Please check server logs for more details.` };
    }

    let products: WCCustomProduct[];
    try {
      products = await response.json();
    } catch (jsonError: any) {
      const errorLog = `Error parsing JSON response from WooCommerce product fetch. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
      console.error(errorLog, jsonError);
      return { error: `Failed to parse product data from WooCommerce. Invalid JSON. Please check server logs for details.` };
    }
    
    return { products };
  } catch (error: any) {
    const errorLog = `Network or fetch error during WooCommerce product fetch. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred. Please check server logs for details.` };
  }
}

export async function fetchWooCommerceProductById(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductByIdResponse> {
  const { storeUrl, consumerKey, consumerSecret, isUserProvided } = getApiCredentials(credentials);
  
  if (!productId) {
    console.error("fetchWooCommerceProductById: Product ID is required.");
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
    return { error: `Server configuration error: ${message} Please check server logs for details.` };
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
      const errorLog = `WooCommerce API error for product ${productId}: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch product ${productId}. Status: ${response.status}. Please check server logs for details.` };
    }

    let product: WCCustomProduct;
    try {
        product = await response.json();
    } catch (jsonError: any) {
        const errorLog = `Error parsing JSON response for product ${productId}. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
        console.error(errorLog, jsonError);
        return { error: `Failed to parse data for product ${productId}. Invalid JSON. Please check server logs for details.` };
    }
    return { product };
  } catch (error: any) {
    const errorLog = `Network or fetch error for WooCommerce product ${productId}. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred for product ${productId}. Please check server logs for details.` };
  }
}

export async function fetchWooCommerceProductVariations(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductVariationsResponse> {
  const { storeUrl, consumerKey, consumerSecret, isUserProvided } = getApiCredentials(credentials);

  if (!productId) {
    console.error("fetchWooCommerceProductVariations: Product ID is required.");
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
    return { error: `Server configuration error: ${message} Please check server logs for details.` };
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
      const errorLog = `WooCommerce API error for product ${productId} variations: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch variations for product ${productId}. Status: ${response.status}. Please check server logs for details.` };
    }

    let variations: WCVariation[];
    try {
        variations = await response.json();
    } catch (jsonError: any) {
        const errorLog = `Error parsing JSON response for product ${productId} variations. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
        console.error(errorLog, jsonError);
        return { error: `Failed to parse variation data for product ${productId}. Invalid JSON. Please check server logs for details.` };
    }
    return { variations };
  } catch (error: any) {
    const errorLog = `Network or fetch error for WooCommerce variations for product ${productId}. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred for product ${productId} variations. Please check server logs for details.` };
  }
}

