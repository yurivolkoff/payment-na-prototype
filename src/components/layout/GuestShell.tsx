import React from 'react';
import { TopPromoBar } from './TopPromoBar';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';

export interface GuestShellProps {
  children: React.ReactNode;
}

/** Обёртка экранов неавторизованной зоны: PromoBar + guest-Header + main + Footer. */
export function GuestShell({ children }: GuestShellProps): React.ReactElement {
  return (
    <div className="app">
      <TopPromoBar />
      <AppHeader />
      <main className="main">
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
