import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import './globals.css';

import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: 'NexusDoc — AI Document Intelligence',
  description: 'Upload, analyze, and semantically search your documents with AI-powered intelligence. Summarize PDFs, extract insights, and find information instantly.',
  keywords: ['AI document analysis', 'semantic search', 'PDF summarization', 'document intelligence', 'AI RAG'],
  authors: [{ name: 'Oyewole Favour' }],
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('nexusdoc-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', storedTheme);
                if (storedTheme === 'dark') {
                  document.documentElement.style.backgroundColor = '#09090f';
                } else {
                  document.documentElement.style.backgroundColor = '#f8fafc';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
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
