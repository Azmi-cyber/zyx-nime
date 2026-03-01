import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zyx-Nime - Streaming Anime',
  description: 'Watch your favorite anime online for free',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
