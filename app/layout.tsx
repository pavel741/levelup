import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import ClientNotificationManager from '@/components/ClientNotificationManager'
import ErrorDisplay from '@/components/ErrorDisplay'

export const metadata: Metadata = {
  title: 'LevelUp - Level Up Life',
  description: 'Productivity app using gamification to build habits, block distractions, and achieve goals through daily challenges.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <ClientNotificationManager />
          <ErrorDisplay />
        </ThemeProvider>
      </body>
    </html>
  )
}

