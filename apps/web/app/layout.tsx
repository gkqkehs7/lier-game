import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: '나는 누구? — 라이어 게임',
  description: '친구들끼리 즐기는 인물 맞추기 라이어 게임',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '라이어 게임',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#EEEDFE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <main className="mx-auto max-w-[430px] min-h-dvh flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
