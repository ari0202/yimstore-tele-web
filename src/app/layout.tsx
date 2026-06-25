import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="font-sans bg-[var(--color-surface-bg)] text-[var(--color-text-primary)] relative min-h-[100dvh]">
        {children}
      </body>
    </html>
  )
}
