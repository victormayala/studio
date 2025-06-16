import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Embedz - Product Customizer',
  description: 'Easily compose and arrange graphical elements for your products. Generate embeddable scripts for your store.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side log for environment variables - useful for deployed environment debugging
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'development') { // Adjust condition as needed
    console.log("Customizer Studio Environment Variable Check (Server-Side in layout.tsx):");
    console.log("APP_ACCESS_PASSWORD is set:", !!process.env.APP_ACCESS_PASSWORD ? 'Yes' : 'No');
    console.log("APP_ACCESS_COOKIE_VALUE is set:", !!process.env.APP_ACCESS_COOKIE_VALUE ? 'Yes' : 'No');
    console.log("WOOCOMMERCE_STORE_URL is set:", !!process.env.WOOCOMMERCE_STORE_URL ? 'Yes' : 'No');
    console.log("WOOCOMMERCE_CONSUMER_KEY is set:", !!process.env.WOOCOMMERCE_CONSUMER_KEY ? 'Yes' : 'No');
    console.log("WOOCOMMERCE_CONSUMER_SECRET is set:", !!process.env.WOOCOMMERCE_CONSUMER_SECRET ? 'Yes' : 'No');
    // Add any other critical env vars here
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable,
        spaceGrotesk.variable,
        sourceCodePro.variable
      )}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
