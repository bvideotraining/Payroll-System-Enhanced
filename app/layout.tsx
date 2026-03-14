import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { QueryProvider } from '@/src/frontend/providers/query-provider';

export const metadata: Metadata = {
  title: 'Enterprise HR ERP & Payroll System',
  description: 'Multi-branch international nursery HR management',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
