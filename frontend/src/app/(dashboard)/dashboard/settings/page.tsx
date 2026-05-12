'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { ApiResponse, AISettings } from '@/types';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete key confirmation
  const [showDeleteKey, setShowDeleteKey] = useState(false);

  // Delete account state (A3)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { logout } = useAuth();
  const router = useRouter();

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<ApiResponse<AISettings>>({
        method: 'GET',
        path: '/api/settings',
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSettings(data.data);
      setModel(data.data.geminiModel ? data.data.geminiModel : '');
      setEmbeddingModel(data.data.geminiEmbeddingModel ? data.data.geminiEmbeddingModel : '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const body: Record<string, string> = {
        geminiModel: model,
        geminiEmbeddingModel: embeddingModel,
      };

      if (apiKey) {
        body.geminiApiKey = apiKey;
      }

      const data = await apiRequest<ApiResponse<AISettings>>({
        method: 'PUT',
        path: '/api/settings',
        body,
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSettings(data.data);
      setApiKey('');
      toast.success('Settings saved successfully!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteKey() {
    try {
      const data = await apiRequest<ApiResponse<null>>({
        method: 'DELETE',
        path: '/api/settings/api-key',
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setSettings((prev) => prev ? { ...prev, hasApiKey: false } : null);
      setShowDeleteKey(false);
      toast.success('API key deleted.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key.';
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className={styles.header}>
          <div className={`skeleton ${styles.skeletonTitle}`} />
          <div className={`skeleton ${styles.skeletonSubtitle}`} />
        </div>
        <div className={`card ${styles.skeletonForm}`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`skeleton ${styles.skeletonField}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <h1 className={styles.title}>AI Settings</h1>
        <p className={styles.subtitle}>Configure your Gemini API key and models</p>
      </header>

      <form onSubmit={handleSave} className={`card ${styles.settingsForm}`} id="settings-form">
        {/* API Key */}
        <div className={styles.formGroup}>
          <label htmlFor="settings-api-key">
            Gemini API Key
            {settings?.hasApiKey && (
              <span className={styles.keyBadge}>✓ Configured</span>
            )}
          </label>
          <input
            id="settings-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings?.hasApiKey ? '••••••••••••••••' : 'Enter your Gemini API key'}
            autoComplete="off"
          />
          <p className={styles.fieldHint}>
            Get your API key from{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
            . Your key is encrypted with AES-256-GCM before storage.
          </p>

          {settings?.hasApiKey && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteKey(true)}
              style={{ marginTop: 'var(--space-sm)' }}
              id="delete-key-btn"
            >
              Delete API Key
            </button>
          )}
        </div>

        {/* Generation Model */}
        <div className={styles.formGroup}>
          <label htmlFor="settings-model">Generation Model</label>
          <input
            id="settings-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-1.5-flash"
            required
          />
          <p className={styles.fieldHint}>
            Used for document summarization and AI features
          </p>
        </div>

        {/* Embedding Model */}
        <div className={styles.formGroup}>
          <label htmlFor="settings-embedding-model">Embedding Model</label>
          <input
            id="settings-embedding-model"
            type="text"
            value={embeddingModel}
            onChange={(e) => setEmbeddingModel(e.target.value)}
            placeholder="gemini-embedding-001"
            required
          />
          <p className={styles.fieldHint}>
            Used for semantic search vector embeddings
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isSaving}
          id="settings-save"
          style={{ width: '100%' }}
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Delete Key Confirmation (C8: Destructive Action) */}
      {showDeleteKey && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteKey(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Delete API Key</h2>
            <p className={styles.modalText}>
              Are you sure you want to delete your Gemini API key? AI features will stop working until you add a new key.
            </p>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteKey(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteKey} id="delete-key-confirm">
                Delete Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
         DANGER ZONE — Account Deletion (A3)
         ============================================================ */}
      <section className={styles.dangerZone}>
        <h2 className={styles.dangerTitle}>Danger Zone</h2>
        <p className={styles.dangerDescription}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setShowDeleteAccount(true)}
          id="delete-account-btn"
        >
          Delete My Account
        </button>
      </section>

      {/* Delete Account Confirmation (C8: Destructive Action) */}
      {showDeleteAccount && (
        <div className={styles.modalOverlay} onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>⚠️ Delete Account</h2>
            <p className={styles.modalText}>
              This will permanently delete your account, all documents, API keys, and search data. This action <strong>cannot be undone</strong>.
            </p>
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                if (!deletePassword) {
                  toast.error('Please enter your password to confirm.');
                  return;
                }
                setIsDeleting(true);
                try {
                  const data = await apiRequest<ApiResponse<null>>({
                    method: 'DELETE',
                    path: '/api/auth/account',
                    body: { password: deletePassword },
                  });

                  if (!data.success) {
                    throw new Error(data.error.message);
                  }

                  await logout();
                  toast.success('Account deleted.');
                  router.replace('/login');
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Account deletion failed.';
                  toast.error(message);
                } finally {
                  setIsDeleting(false);
                }
              }}
              id="delete-account-form"
            >
              <div className={styles.formGroup} style={{ marginTop: 'var(--space-md)' }}>
                <label htmlFor="delete-password">Enter your password to confirm</label>
                <input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowDeleteAccount(false); setDeletePassword(''); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isDeleting || !deletePassword}
                  id="delete-account-confirm"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
