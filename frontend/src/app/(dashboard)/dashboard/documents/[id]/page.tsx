'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiBinaryRequest, apiRequest } from '@/lib/api';
import type { ApiResponse, DocumentDetail } from '@/types';
import ReactMarkdown from 'react-markdown';
import styles from './document-detail.module.css';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const data = await apiRequest<ApiResponse<DocumentDetail>>({ method: 'GET', path: `/api/documents/${documentId}` });
      if (!data.success) throw new Error(data.error.message);
      setDocument(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load document.';
      setError(message); toast.error(message);
    } finally { setIsLoading(false); }
  }, [documentId]);

  useEffect(() => { if (documentId) fetchDocument(); }, [documentId, fetchDocument]);

  useEffect(() => {
    let active = true;
    if (!document || document.file_type !== 'application/pdf') return;
    apiBinaryRequest(document.download_path)
      .then((blob) => { if (active) setFileUrl(URL.createObjectURL(blob)); })
      .catch(() => { if (active) setFileUrl(null); });
    return () => {
      active = false;
      setFileUrl((current) => { if (current) URL.revokeObjectURL(current); return null; });
    };
  }, [document]);

  async function downloadOriginal() {
    if (!document) return;
    try {
      const blob = await apiBinaryRequest(document.download_path);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.original_filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed.');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const copyToClipboard = () => {
    if (!document?.ai_summary) return;
    navigator.clipboard.writeText(document.ai_summary);
    toast.success('Summary copied to clipboard!');
  };

  const downloadSummary = () => {
    if (!document?.ai_summary) return;
    const blob = new Blob([document.ai_summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url; anchor.download = `${document.title}_summary.txt`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className={styles.loadingState}><div className={styles.spinner} /><p>Loading document intelligence...</p></div>;

  if (error || !document) return (
    <div className={styles.errorState}>
      <h2>Document Not Found</h2><p>{error}</p>
      <button className="btn btn-secondary" onClick={() => router.push('/dashboard/documents')}>← Back to Documents</button>
    </div>
  );

  return (
    <div className={`fade-in ${styles.container}`}>
      <Link href="/dashboard/documents" className={styles.backLink}>← Back to Documents</Link>
      <header className={styles.header}>
        <h1 className={styles.title}>{document.title}</h1>
        <div className={styles.meta}>
          <span>📄 {document.original_filename}</span><span>·</span><span>{formatFileSize(document.file_size_bytes)}</span><span>·</span><span>Uploaded {formatDate(document.created_at)}</span>
        </div>
        <div className={styles.actions}>
          <button onClick={downloadOriginal} className="btn btn-secondary btn-sm">⬇️ Download Original File</button>
        </div>
      </header>

      {document.ai_summary ? (
        <section className={styles.summarySection}>
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>✨ AI Intelligence Summary</h2>
            <div className={styles.utilityButtons}>
              <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>📋 Copy</button>
              <button className="btn btn-secondary btn-sm" onClick={downloadSummary}>📥 Download</button>
            </div>
          </div>
          <div className={styles.summaryContent}><ReactMarkdown>{document.ai_summary}</ReactMarkdown></div>
        </section>
      ) : (
        <section className={styles.summarySection}><h2 className={styles.summaryTitle}>⚠️ No AI Summary Available</h2></section>
      )}

      <div className={styles.viewerHeader}>
        <h3 className={styles.viewerTitle}>Document Viewer</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowRawText(!showRawText)}>
          {showRawText ? 'Hide Raw Text' : 'View AI Raw Extraction'}
        </button>
      </div>

      {!showRawText && document.file_type === 'application/pdf' && (
        <div className={styles.pdfContainer}>
          {fileUrl ? <iframe src={fileUrl} className={styles.pdfFrame} title={document.title} /> : <p>Loading secure document preview…</p>}
        </div>
      )}
      {!showRawText && document.file_type !== 'application/pdf' && (
        <div className={styles.contentSection}><p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Secure preview is available through raw extraction or the authenticated download.</p></div>
      )}
      {showRawText && (
        <section className={styles.contentSection}><div className={styles.contentText}><ReactMarkdown>{document.content_text}</ReactMarkdown></div></section>
      )}
    </div>
  );
}
