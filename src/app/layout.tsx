import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

// Server-side check for critical environment variables
// This log will appear in your Firebase App Hosting runtime logs
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  console.log("--- Customizer Studio Environment Variable Check (Server Startup) ---");
  const criticalEnvVars = [
    'APP_ACCESS_PASSWORD',
    'APP_ACCESS_COOKIE_VALUE',
    'WOOCOMMERCE_STORE_URL',
    'WOOCOMMERCE_CONSUMER_KEY',
    'WOOCOMMERCE_CONSUMER_SECRET',
    // Add 'GOOGLE_API_KEY' or similar if Genkit explicitly needs it and isn't using Application Default Credentials
  ];
  criticalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`[ENV VAR] ${varName}: SET (length: ${process.env[varName]?.length})`);
    } else {
      console.warn(`[ENV VAR WARNING] ${varName}: NOT SET`);
    }
  });
  console.log("----------------------------------------------------------------------");
}


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
