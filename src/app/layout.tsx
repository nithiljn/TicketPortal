import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0d0d10' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ticketflow-hub.vercel.app')
  ),
  title: {
    default: 'TicketFlow for Engineering Teams',
    template: '%s | TicketFlow',
  },
  description:
    'A unified workspace to manage engineering tickets, track daily standup notes, and monitor project expenses.',
  keywords: [
    'ticket portal',
    'expense tracker',
    'developer tools',
    'daily notes',
    'activity heatmap',
    'kanban board',
    'task management',
  ],
  authors: [{ name: 'TicketFlow' }],
  openGraph: {
    title: 'TicketFlow for Engineering Teams',
    description:
      'A unified workspace to manage engineering tickets, track daily standup notes, and monitor project expenses.',
    siteName: 'TicketFlow',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/ticket-icon.png',
        width: 512,
        height: 512,
        alt: 'TicketFlow Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'TicketFlow for Engineering Teams',
    description:
      'A unified workspace to manage engineering tickets, track daily standup notes, and monitor project expenses.',
    images: ['/ticket-icon.png'],
  },
  icons: {
    icon: [
      { url: '/ticket-icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${roboto.className} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
