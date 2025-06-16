// src/app/layout.tsx
import type {Metadata} from 'next';
import './globals.css'; // This will also be simplified

export const metadata: Metadata = {
  title: 'Test App - Stripped Down',
  description: 'Testing Next.js App Router with minimal setup.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}> {/* Keep suppressHydrationWarning on body as it's common practice */}
        {children}
      </body>
    </html>
  );
}
