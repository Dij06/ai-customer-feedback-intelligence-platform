import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from 'sonner' // 1. Import Toaster

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          {/* 2. Add Toaster inside body tag */}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}