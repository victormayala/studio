import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Source_Code_Pro } from 'next/font/google';
import './globals.css';
// import { AuthProvider } from '@/contexts/AuthContext'; // Temporarily removed
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
  // console.log("Simplified RootLayout rendering");
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable,
        spaceGrotesk.variable,
        sourceCodePro.variable
      )}>
        {/* <AuthProvider> */}
          {children}
          <Toaster />
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}
