// src/app/layout.tsx
import type {Metadata} from 'next';
import './globals.css'; // This will also be simplified
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// Server-side check for critical environment variables
// This log will appear in your Firebase App Hosting runtime logs
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') { // Check if on server & in production
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
  console.log("------------------------------------------------------------------");
}


export const metadata: Metadata = {
  title: 'Customizer Studio',
  description: 'Create and customize your product designs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
