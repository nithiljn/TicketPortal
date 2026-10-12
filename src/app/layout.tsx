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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ticketflow.local'),
  title: {
    default: 'TicketFlow - Engineering Task & Expense Portal',
    template: '%s | TicketFlow',
  },
  description:
    'All-in-one developer workspace for engineering ticket management, consistency activity heatmaps, daily standup logs, and financial expense tracking.',
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
    title: 'TicketFlow - Engineering Task & Expense Portal',
    description:
      'Track engineering tickets, consistency activity heatmaps, daily standup notes, and project expenses seamlessly.',
    siteName: 'TicketFlow',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/ticket-icon.svg',
        width: 512,
        height: 512,
        alt: 'TicketFlow Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'TicketFlow - Engineering Task & Expense Portal',
    description: 'Track engineering tickets, consistency heatmaps, and project expenses.',
    images: ['/ticket-icon.svg'],
  },
  icons: {
    icon: [
      { url: '/ticket-icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/ticket-icon.svg' }],
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
