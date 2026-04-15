import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeScript } from '@/components/layout/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Financeiro — Controle para Casais',
    template: '%s · Financeiro',
  },
  description: 'Controle financeiro compartilhado para casais. Gerencie contas, transações, orçamentos e metas juntos.',
  keywords: ['finanças', 'controle financeiro', 'casal', 'orçamento', 'metas'],
  authors: [{ name: 'Financeiro' }],
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Financeiro',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Financeiro — Controle para Casais',
    description: 'Controle financeiro compartilhado para casais.',
    siteName: 'Financeiro',
  },
  twitter: {
    card: 'summary',
    title: 'Financeiro — Controle para Casais',
    description: 'Controle financeiro compartilhado para casais.',
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
