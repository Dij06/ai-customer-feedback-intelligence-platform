import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

export const metadata: Metadata = {
  title: "LOOP - AI Customer Feedback Intelligence Platform",
  description: "Ingest multi-channel customer feedback, analyze sentiment with AI, and track product insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  const saved = localStorage.getItem("loop_theme");
                  if (saved === "light" || (!saved && !window.matchMedia("(prefers-color-scheme: dark)").matches)) {
                    document.documentElement.classList.remove("dark");
                  } else {
                    document.documentElement.classList.add("dark");
                  }
                } catch(e) {}
              `,
            }}
          />
        </head>
        <body className="bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-500 selection:text-white transition-colors duration-150">
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}

