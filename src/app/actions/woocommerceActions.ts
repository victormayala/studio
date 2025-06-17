
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

export interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

function getValidatedCredentials(credentials?: WooCommerceCredentials): { validated?: WooCommerceCredentials; error?: string } {
  if (!credentials || !credentials.storeUrl || !credentials.consumerKey || !credentials.consumerSecret) {
    const missingFields = [];
    if (!credentials?.storeUrl) missingFields.push('Store URL');
    if (!credentials?.consumerKey) missingFields.push('Consumer Key');
    if (!credentials?.consumerSecret) missingFields.push('Consumer Secret');
    
    const message = `WooCommerce API credentials are not configured. Please connect your store in the 'Store Integration' section. Missing: ${missingFields.join(', ')}.`;
    console.warn(`WooCommerce Action Warning: ${message}`);
    return { error: message };
  }
  return { validated: credentials };
}

export async function fetchWooCommerceProducts(credentials?: WooCommerceCredentials, wpApiBaseUrl?: string): Promise<FetchWooCommerceProductsResponse> {
  let apiUrl: string;
  let headers: HeadersInit = { 'Content-Type': 'application/json' };

  if (wpApiBaseUrl) {
    apiUrl = `${wpApiBaseUrl.replace(/\/$/, "")}/products`;
    // No Authorization header needed as WP plugin handles auth
  } else {
    const credsResult = getValidatedCredentials(credentials);
    if (credsResult.error || !credsResult.validated) {
      return { error: credsResult.error || "User-specific WooCommerce credentials are required." };
    }
    const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
    apiUrl = `${storeUrl}/wp-json/wc/v3/products`;
    headers['Authorization'] = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: headers,
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorLog = `WooCommerce API error during product fetch: ${response.status} ${response.statusText}. URL: ${apiUrl}. Using ${wpApiBaseUrl ? 'proxy' : 'direct credentials'}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch products. Status: ${response.status}. Please check server logs for details.` };
    }

    let products: WCCustomProduct[];
    try {
      products = await response.json();
    } catch (jsonError: any) {
      const errorLog = `Error parsing JSON response from WooCommerce product fetch. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
      console.error(errorLog, jsonError);
      return { error: `Failed to parse product data. Invalid JSON. Please check server logs for details.` };
    }
    
    return { products };
  } catch (error: any) {
    const errorLog = `Network or fetch error during WooCommerce product fetch. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred. Please check server logs for details.` };
  }
}

export async function fetchWooCommerceProductById(productId: string, credentials?: WooCommerceCredentials, wpApiBaseUrl?: string): Promise<FetchWooCommerceProductByIdResponse> {
  if (!productId) {
    console.error("fetchWooCommerceProductById: Product ID is required.");
    return { error: 'Product ID is required.' };
  }

  let apiUrl: string;
  let headers: HeadersInit = { 'Content-Type': 'application/json' };

  if (wpApiBaseUrl) {
    apiUrl = `${wpApiBaseUrl.replace(/\/$/, "")}/product/${productId}`;
     // No Authorization header needed as WP plugin handles auth
  } else {
    const credsResult = getValidatedCredentials(credentials);
    if (credsResult.error || !credsResult.validated) {
      return { error: credsResult.error || `User-specific WooCommerce credentials are required to fetch product ${productId}.` };
    }
    const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
    apiUrl = `${storeUrl}/wp-json/wc/v3/products/${productId}`;
    headers['Authorization'] = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: headers,
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorLog = `WooCommerce API error for product ${productId}: ${response.status} ${response.statusText}. URL: ${apiUrl}. Using ${wpApiBaseUrl ? 'proxy' : 'direct credentials'}. Response: ${errorBody}`;
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

export async function fetchWooCommerceProductVariations(productId: string, credentials?: WooCommerceCredentials, wpApiBaseUrl?: string): Promise<FetchWooCommerceProductVariationsResponse> {
  if (!productId) {
    console.error("fetchWooCommerceProductVariations: Product ID is required.");
    return { error: 'Product ID is required to fetch variations.' };
  }
  
  let apiUrl: string;
  let headers: HeadersInit = { 'Content-Type': 'application/json' };

  if (wpApiBaseUrl) {
    apiUrl = `${wpApiBaseUrl.replace(/\/$/, "")}/product/${productId}/variations`;
    // No Authorization header needed as WP plugin handles auth
  } else {
    const credsResult = getValidatedCredentials(credentials);
    if (credsResult.error || !credsResult.validated) {
      return { error: credsResult.error || `User-specific WooCommerce credentials are required to fetch variations for product ${productId}.` };
    }
    const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
    apiUrl = `${storeUrl}/wp-json/wc/v3/products/${productId}/variations?per_page=100`;
    headers['Authorization'] = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: headers,
      cache: 'no-store', 
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorLog = `WooCommerce API error for product ${productId} variations: ${response.status} ${response.statusText}. URL: ${apiUrl}. Using ${wpApiBaseUrl ? 'proxy' : 'direct credentials'}. Response: ${errorBody}`;
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
