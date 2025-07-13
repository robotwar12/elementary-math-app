import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🧮 초등학교 수학 학습 애플리케이션',
  description: 'Claude와 Cline을 활용하여 개발하는 인터랙티브 초등학교 수학 학습 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* CSS 애니메이션 추가 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
        
        <script src="https://cdn.jsdelivr.net/npm/onnxjs/dist/onnx.min.js"></script>
        <script src="/stroke-digit-recognizer.js"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
