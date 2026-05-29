'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { ApiResponse, Document } from '@/types';
import ReactMarkdown from 'react-markdown';
import styles from './document-detail.module.css';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRawText, setShowRawText] = useState(false);
  const [preflightDownload, setPreflightDownload] = useState<{ type: 'blob' | 'link'; action: () => void } | null>(null);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<ApiResponse<Document>>({
        method: 'GET',
        path: `/api/documents/${documentId}`,
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setDocument(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load document.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId, fetchDocument]);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const copyToClipboard = () => {
    if (!document?.ai_summary) return;
    navigator.clipboard.writeText(document.ai_summary);
    toast.success('Summary copied to clipboard!');
  };

  const downloadSummary = () => {
    const summary = document?.ai_summary;
    if (!summary) return;
    setPreflightDownload({
      type: 'blob',
      action: () => {
        const element = window.document.createElement('a');
        const file = new Blob([summary || ''], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${document.title}_summary.txt`;
        window.document.body.appendChild(element);
        element.click();
        window.document.body.removeChild(element);
        toast.success('Summary downloaded!');
      }
    });
  };

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading document intelligence...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className={styles.errorState}>
        <h2>Document Not Found</h2>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard/documents')} style={{ marginTop: 'var(--space-md)' }}>
          ← Back to Documents
        </button>
      </div>
    );
  }

  // Determine if it's a PDF for iframe embedding
  const isPdf = document.file_type === 'application/pdf';

  return (
    <div className={`fade-in ${styles.container}`}>
      <Link href="/dashboard/documents" className={styles.backLink}>
        ← Back to Documents
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{document.title}</h1>
        <div className={styles.meta}>
          <span>📄 {document.original_filename}</span>
          <span>·</span>
          <span>{formatFileSize(document.file_size_bytes)}</span>
          <span>·</span>
          <span>Uploaded {formatDate(document.created_at)}</span>
        </div>
        
        <div className={styles.actions}>
          <a 
            href={document.file_url} 
            onClick={(e) => {
              e.preventDefault();
              setPreflightDownload({
                type: 'link',
                action: () => {
                  window.open(document.file_url, '_blank', 'noopener,noreferrer');
                }
              });
            }}
            className="btn btn-secondary btn-sm"
          >
            ⬇️ Download Original File
          </a>
        </div>
      </header>

      {document.ai_summary ? (
        <section className={styles.summarySection}>
          <div className={styles.summaryHeader}>
            <h2 className={styles.summaryTitle}>
              ✨ AI Intelligence Summary
            </h2>
            <div className={styles.utilityButtons}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={copyToClipboard}
              >
                📋 Copy
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={downloadSummary}
              >
                📥 Download
              </button>
            </div>
          </div>
          <div className={styles.summaryContent}>
            <ReactMarkdown>{document.ai_summary}</ReactMarkdown>
          </div>
        </section>
      ) : (
        <section className={styles.summarySection} style={{ background: 'var(--bg-card)' }}>
          <h2 className={styles.summaryTitle} style={{ color: 'var(--text-secondary)' }}>
            ⚠️ No AI Summary Available
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
            This document was uploaded without an active Gemini API Key, so AI summarization and semantic indexing were skipped.
          </p>
        </section>
      )}

      {/* Native PDF / File Viewer */}
      <div className={styles.viewerHeader}>
        <h3 className={styles.viewerTitle}>Document Viewer</h3>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setShowRawText(!showRawText)}
        >
          {showRawText ? 'Hide Raw Text' : 'View AI Raw Extraction'}
        </button>
      </div>

      {!showRawText && isPdf && (
        <div className={styles.pdfContainer}>
          <iframe 
            src={`${document.file_url}#toolbar=0&navpanes=0`} 
            className={styles.pdfFrame}
            title={document.title}
          />
        </div>
      )}

      {!showRawText && !isPdf && (
        <div className={styles.contentSection}>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            Native viewer preview is not available for this file type. Please view the raw text or download the original file.
          </p>
        </div>
      )}

      {/* Raw Extracted Text Toggle */}
      {showRawText && (
        <section className={styles.contentSection}>
          <div className={styles.contentText}>
            <ReactMarkdown>{document.content_text}</ReactMarkdown>
          </div>
        </section>
      )}

      {preflightDownload && (
        <div style={modalStyles.overlay} onClick={() => setPreflightDownload(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>⚠️ Security Preflight Warning</h3>
              <button style={modalStyles.closeBtn} onClick={() => setPreflightDownload(null)}>✕</button>
            </div>
            
            <p style={modalStyles.warningText}>
              You are attempting to download an unverified file. To prevent system infection and protect your workstation, 
              please open your account and carry out this download within an isolated <strong>Virtual Machine (VM/VirtualBox)</strong>.
            </p>

            <div style={modalStyles.actions}>
              <button 
                type="button" 
                onClick={() => setPreflightDownload(null)}
                style={modalStyles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  preflightDownload.action();
                  setPreflightDownload(null);
                }}
                style={modalStyles.confirmBtn}
              >
                Acknowledge & Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 5, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    background: '#0c0f1d',
    border: '1px solid rgba(225, 112, 117, 0.25)',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(225, 112, 117, 0.1)',
    fontFamily: 'inherit'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff7675'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aed0',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px'
  },
  warningText: {
    fontSize: '14px',
    color: '#e2e8f0',
    lineHeight: '1.6',
    margin: '0 0 24px 0'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#a0aed0',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  confirmBtn: {
    background: '#d63031',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};
