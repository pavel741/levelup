import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LevelUp – Level Up Life',
  description: 'Productivity app using gamification to build habits, block distractions, and achieve goals through daily challenges and community support.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

