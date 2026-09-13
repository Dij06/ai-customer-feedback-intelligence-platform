import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'LOOP — AI Customer Feedback Intelligence Platform',
  description: 'Ingest multi-channel customer feedback, analyze sentiment with AI, and track product insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}