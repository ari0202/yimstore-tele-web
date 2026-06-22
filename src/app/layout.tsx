import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-[var(--color-surface-bg)] text-[var(--color-text-primary)] relative min-h-[100dvh]">
        {children}
      </body>
    </html>
  )
}
