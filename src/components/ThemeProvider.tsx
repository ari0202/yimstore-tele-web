'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { usePathname } from 'next/navigation';

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const storageKey = isAdmin ? 'admin-theme' : 'store-theme';
  const defaultTheme = isAdmin ? 'dark' : 'light';

  return (
    <NextThemesProvider 
      {...props} 
      key={storageKey}
      storageKey={storageKey}
      defaultTheme={defaultTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
