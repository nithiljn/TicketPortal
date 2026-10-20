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

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://ticketflow-hub.vercel.app')

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
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
    url: appUrl,
    siteName: 'TicketFlow',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TicketFlow - Engineering Workspace',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TicketFlow for Engineering Teams',
    description:
      'A unified workspace to manage engineering tickets, track daily standup notes, and monitor project expenses.',
    images: ['/og-image.png'],
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
      suppressHydrationWarning
      className={`${roboto.variable} ${roboto.className} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('tp_theme')==='dark'){document.documentElement.classList.add('dark');}}catch(_){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
