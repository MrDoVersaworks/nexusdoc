'use client';

import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { ApiResponse, Document, PaginationMeta } from '@/types';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, DEFAULT_PAGE_SIZE, MAX_SUMMARY_DISPLAY_LENGTH } from '@/constants';
import styles from './documents.module.css';

interface DocumentsSuccessResponse {
  success: true;
  data: Document[];
  pagination: PaginationMeta;
}

interface DocumentsErrorResponse {
  success: false;
  error: { code: string; message: string };
}

type DocumentsApiResponse = DocumentsSuccessResponse | DocumentsErrorResponse;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const fetchDocuments = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest<DocumentsApiResponse>({
        method: 'GET',
        path: `/api/documents?page=${pageNum}&limit=${DEFAULT_PAGE_SIZE}&sort=created_at&order=desc`,
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setDocuments(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load documents.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(page);
  }, [page, fetchDocuments]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      e.target.value = '';
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('file', uploadFile);

      const data = await apiRequest<ApiResponse<Document>>({
        method: 'POST',
        path: '/api/documents',
        body: formData,
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      toast.success('Document uploaded successfully!');
      setShowUpload(false);
      setUploadTitle('');
      setUploadFile(null);
      setPage(1);
      fetchDocuments(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const data = await apiRequest<ApiResponse<null>>({
        method: 'DELETE',
        path: `/api/documents/${deleteTarget.id}`,
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      toast.success('Document deleted.');
      setDeleteTarget(null);
      fetchDocuments(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed.';
      toast.error(message);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function stripMarkdown(text: string): string {
    return text
      .replace(/[#*`_~]/g, '') // Remove basic markdown symbols
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
      .replace(/\n/g, ' ') // Replace newlines with spaces for a single-line preview
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.subtitle}>Upload and manage your documents</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
          id="upload-btn"
        >
          📤 Upload
        </button>
      </header>

      {/* Upload Modal */}
      {showUpload && (
        <div className={styles.modalOverlay} onClick={() => setShowUpload(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Upload Document</h2>
            <form onSubmit={handleUpload} id="upload-form">
              <div className={styles.formGroup}>
                <label htmlFor="upload-title">Document Title</label>
                <input
                  id="upload-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="My Document"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="upload-file">File ({ACCEPTED_FILE_TYPES})</label>
                <input
                  id="upload-file"
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  required
                  className={styles.fileInput}
                />
                <p className={styles.fileHint}>Max {MAX_FILE_SIZE_MB}MB</p>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUploading || !uploadFile}
                  id="upload-submit"
                >
                  {isUploading ? 'Processing AI Embeddings...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (C8: Destructive Action Confirmation) */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete Document</h2>
            <p className={styles.deleteWarning}>
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                id="delete-cancel"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                id="delete-confirm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`card ${styles.skeletonCard}`}>
              <div className={`skeleton ${styles.skeletonTitle}`} />
              <div className={`skeleton ${styles.skeletonMeta}`} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => fetchDocuments(page)}>
            Retry
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📁</span>
          <h3>No documents yet</h3>
          <p>Upload your first document to get started with AI analysis.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
            id="empty-upload-btn"
          >
            📤 Upload Your First Document
          </button>
        </div>
      ) : (
        <>
          <div className={styles.docList}>
            {documents.map((doc) => (
              <div key={doc.id} className={`card ${styles.docCard}`}>
                <div className={styles.docInfo}>
                  <div className={styles.docIcon}>
                    {doc.file_type === 'application/pdf' ? '📕' : '📝'}
                  </div>
                  <div className={styles.docDetails}>
                    <a href={`/dashboard/documents/${doc.id}`} className={styles.docTitle}>
                      {doc.title}
                    </a>
                    <div className={styles.docMeta}>
                      <span>{doc.original_filename}</span>
                      <span>·</span>
                      <span>{formatFileSize(doc.file_size_bytes)}</span>
                      <span>·</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.ai_summary && (
                      <p className={styles.docSummary}>{stripMarkdown(doc.ai_summary).slice(0, MAX_SUMMARY_DISPLAY_LENGTH)}...</p>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteTarget(doc)}
                  aria-label={`Delete ${doc.title}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                id="page-prev"
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                id="page-next"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
