import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'NexusDoc — AI Document Intelligence',
  description: 'Upload, analyze, and semantically search your documents with AI-powered intelligence. Summarize PDFs, extract insights, and find information instantly.',
  openGraph: {
    title: 'NexusDoc — AI Document Intelligence',
    description: 'Upload, analyze, and semantically search your documents with AI-powered intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning={true}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-family)',
                },
              }}
              richColors
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
