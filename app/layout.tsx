import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'SewaBot - Platform Bot Auto Order',
  description: 'Buat bot Telegram sendiri untuk menerima pesanan otomatis. Kelola produk, pantau pesanan, dan tingkatkan penjualan Anda 24/7.',
  keywords: ['bot telegram', 'auto order', 'jualan online', 'bot jualan', 'telegram bot'],
  authors: [{ name: 'SewaBot' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster 
          position="top-center"
          expand={true}
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
            classNames: {
              toast: 'animate-in slide-in-from-top-2 duration-300',
              success: 'bg-success/10 border-success/30 text-success',
              error: 'bg-destructive/10 border-destructive/30 text-destructive',
              warning: 'bg-warning/10 border-warning/30 text-warning',
              info: 'bg-primary/10 border-primary/30 text-primary',
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
