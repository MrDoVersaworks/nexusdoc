'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import type { ApiResponse, AISettings } from '@/types';

export default function ApiKeyBanner() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function checkKey() {
      try {
        const data = await apiRequest<ApiResponse<AISettings>>({
          method: 'GET',
          path: '/api/settings',
        });
        if (data.success) {
          setHasKey(data.data.hasApiKey);
        }
      } catch {
        // Silently fail if settings can't be fetched (e.g., logged out)
      }
    }
    checkKey();
  }, [pathname]); // Re-check when navigation happens

  // If we haven't loaded yet, or if they DO have a key, render nothing
  if (hasKey === null || hasKey === true) {
    return null;
  }

  // If they are already on the settings page, we don't need to yell at them
  if (pathname === '/dashboard/settings') {
    return null;
  }

  return (
    <div style={{
      backgroundColor: 'rgba(255, 171, 0, 0.1)',
      border: '1px solid rgba(255, 171, 0, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--space-md)',
      flexWrap: 'wrap'
    }}>
      <div>
        <h4 style={{ margin: 0, color: 'var(--warning)', fontSize: 'var(--font-base)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> Action Required: Missing API Key
        </h4>
        <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>
          You must configure your Gemini API Key in Settings before you can upload documents, generate AI summaries, or use Semantic Search.
        </p>
      </div>
      <Link 
        href="/dashboard/settings" 
        className="btn btn-primary btn-sm"
        style={{ backgroundColor: 'var(--warning)', color: '#000', border: 'none', whiteSpace: 'nowrap' }}
      >
        Configure Settings →
      </Link>
    </div>
  );
}
