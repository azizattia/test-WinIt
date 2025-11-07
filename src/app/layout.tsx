import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Court Records API',
  description: 'Santa Clara County Superior Court Records Search',
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
