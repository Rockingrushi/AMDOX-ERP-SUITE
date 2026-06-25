import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AMX ERP - AI Powered Enterprise Suite',
  description: 'Production Grade ERP dashboard and resource planning platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#06070a] text-gray-100 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
