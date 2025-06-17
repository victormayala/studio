
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

// Simplified: This function now only cares about the credentials passed to it.
// It no longer looks at process.env.
function getValidatedCredentials(credentials?: WooCommerceCredentials): { validated?: WooCommerceCredentials; error?: string } {
  if (!credentials || !credentials.storeUrl || !credentials.consumerKey || !credentials.consumerSecret) {
    const missingFields = [];
    if (!credentials?.storeUrl) missingFields.push('Store URL');
    if (!credentials?.consumerKey) missingFields.push('Consumer Key');
    if (!credentials?.consumerSecret) missingFields.push('Consumer Secret');
    
    const message = `WooCommerce API credentials are not configured. Please connect your store in the 'Store Integration' section. Missing: ${missingFields.join(', ')}.`;
    console.warn(`WooCommerce Action Warning: ${message}`); // Keep a server log for this
    return { error: message };
  }
  return { validated: credentials };
}

export async function fetchWooCommerceProducts(credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductsResponse> {
  const credsResult = getValidatedCredentials(credentials);
  if (credsResult.error || !credsResult.validated) {
    return { error: credsResult.error || "User-specific WooCommerce credentials are required." };
  }
  const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
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
      const errorLog = `User WooCommerce API error during product fetch: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch products from your WooCommerce store. Status: ${response.status}. Please check your credentials and store. Server logs have details.` };
    }

    let products: WCCustomProduct[];
    try {
      products = await response.json();
    } catch (jsonError: any) {
      const errorLog = `Error parsing JSON response from user WooCommerce product fetch. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
      console.error(errorLog, jsonError);
      return { error: `Failed to parse product data from your WooCommerce store. Invalid JSON. Please check server logs for details.` };
    }
    
    return { products };
  } catch (error: any) {
    const errorLog = `Network or fetch error during user WooCommerce product fetch. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred while connecting to your store. Please check server logs for details.` };
  }
}

export async function fetchWooCommerceProductById(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductByIdResponse> {
  if (!productId) {
    console.error("fetchWooCommerceProductById: Product ID is required.");
    return { error: 'Product ID is required.' };
  }

  const credsResult = getValidatedCredentials(credentials);
  if (credsResult.error || !credsResult.validated) {
    return { error: credsResult.error || `User-specific WooCommerce credentials are required to fetch product ${productId}.` };
  }
  const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
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
      const errorLog = `User WooCommerce API error for product ${productId}: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch product ${productId} from your store. Status: ${response.status}. Please check server logs for details.` };
    }

    let product: WCCustomProduct;
    try {
        product = await response.json();
    } catch (jsonError: any) {
        const errorLog = `Error parsing JSON response for product ${productId} from your store. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
        console.error(errorLog, jsonError);
        return { error: `Failed to parse data for product ${productId} from your store. Invalid JSON. Please check server logs for details.` };
    }
    return { product };
  } catch (error: any) {
    const errorLog = `Network or fetch error for user WooCommerce product ${productId}. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred for product ${productId} from your store. Please check server logs for details.` };
  }
}

export async function fetchWooCommerceProductVariations(productId: string, credentials?: WooCommerceCredentials): Promise<FetchWooCommerceProductVariationsResponse> {
  if (!productId) {
    console.error("fetchWooCommerceProductVariations: Product ID is required.");
    return { error: 'Product ID is required to fetch variations.' };
  }
  
  const credsResult = getValidatedCredentials(credentials);
  if (credsResult.error || !credsResult.validated) {
    return { error: credsResult.error || `User-specific WooCommerce credentials are required to fetch variations for product ${productId}.` };
  }
  const { storeUrl, consumerKey, consumerSecret } = credsResult.validated;
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
      const errorLog = `User WooCommerce API error for product ${productId} variations: ${response.status} ${response.statusText}. URL: ${apiUrl}. Response: ${errorBody}`;
      console.error(errorLog);
      return { error: `Failed to fetch variations for product ${productId} from your store. Status: ${response.status}. Please check server logs for details.` };
    }

    let variations: WCVariation[];
    try {
        variations = await response.json();
    } catch (jsonError: any) {
        const errorLog = `Error parsing JSON response for product ${productId} variations from your store. URL: ${apiUrl}. Error: ${jsonError.message || jsonError}`;
        console.error(errorLog, jsonError);
        return { error: `Failed to parse variation data for product ${productId} from your store. Invalid JSON. Please check server logs for details.` };
    }
    return { variations };
  } catch (error: any) {
    const errorLog = `Network or fetch error for user WooCommerce variations for product ${productId}. URL: ${apiUrl}. Error: ${error.message || error}`;
    console.error(errorLog, error);
    return { error: `An unexpected network or fetch error occurred for product ${productId} variations from your store. Please check server logs for details.` };
  }
}

