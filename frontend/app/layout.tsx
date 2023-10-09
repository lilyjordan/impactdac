import 'tailwindcss/tailwind.css'
import './styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Impact DAC',
  description: 'Dominant assurance contract + impact certificate',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className='p-6 text-3xl font-bold'>Retroflex</header>
        <div className='m-8'>
          {children}
        </div>
      </body>
    </html>
  )
}
