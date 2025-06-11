
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Added AuthProvider

export const metadata: Metadata = {
  title: 'CSTMZR - Your Product Customization Platform',
  description: 'Easily create and embed product customizers for your e-commerce store. Connect with Shopify, WordPress, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Updated to Roboto font */}
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      {/* Changed from font-body to font-sans to use the new default */}
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <AuthProvider> {/* Added AuthProvider */}
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
