import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/common/ThemeProvider'
import { LanguageProvider } from '@/components/common/LanguageProvider'
import ClientNotificationManager from '@/components/ClientNotificationManager'
import ErrorDisplay from '@/components/common/ErrorDisplay'
import ToastContainer from '@/components/common/Toast'
import ErrorBoundary from '@/components/common/ErrorBoundary'

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
        <LanguageProvider>
          <ThemeProvider>
            <ErrorBoundary>
              {children}
              <ClientNotificationManager />
              <ErrorDisplay />
              <ToastContainer />
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

