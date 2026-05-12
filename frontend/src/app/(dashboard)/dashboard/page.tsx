'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import styles from './dashboard.module.css';

interface DashboardStats {
  documents: number;
  summaries: number;
  chunks: number;
  hasApiKey: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiRequest<{ success: true; data: DashboardStats }>({
          method: 'GET',
          path: '/api/stats',
        });
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <h1 className={styles.greeting}>
          Welcome back, <span className="gradient-text">{user?.name}</span>
        </h1>
        <p className={styles.subtitle}>
          Your AI-powered document intelligence hub
        </p>
      </header>

      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>📄</div>
          <div>
            <div className={styles.statLabel}>Documents</div>
            <div className={styles.statValue}>{stats ? stats.documents : '—'}</div>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>🔍</div>
          <div>
            <div className={styles.statLabel}>Total Chunks</div>
            <div className={styles.statValue}>{stats ? stats.chunks : '—'}</div>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>🧠</div>
          <div>
            <div className={styles.statLabel}>AI Summaries</div>
            <div className={styles.statValue}>{stats ? stats.summaries : '—'}</div>
          </div>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon}>⚡</div>
          <div>
            <div className={styles.statLabel}>AI Status</div>
            <div className={`${styles.statValue} ${stats?.hasApiKey ? styles.statusActive : styles.statusInactive}`}>
              {stats ? (stats.hasApiKey ? 'Ready' : 'Setup Required') : '—'}
            </div>
          </div>
        </div>
      </div>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <a href="/dashboard/documents" className={`card ${styles.actionCard}`} id="action-upload">
            <span className={styles.actionIcon}>📤</span>
            <span className={styles.actionLabel}>Upload Document</span>
            <span className={styles.actionDesc}>Add a PDF or text file for AI analysis</span>
          </a>
          <a href="/dashboard/search" className={`card ${styles.actionCard}`} id="action-search">
            <span className={styles.actionIcon}>🔎</span>
            <span className={styles.actionLabel}>Semantic Search</span>
            <span className={styles.actionDesc}>Find information across your documents</span>
          </a>
          <a href="/dashboard/settings" className={`card ${styles.actionCard}`} id="action-settings">
            <span className={styles.actionIcon}>🔑</span>
            <span className={styles.actionLabel}>Configure AI</span>
            <span className={styles.actionDesc}>Set up your Gemini API key and model</span>
          </a>
        </div>
      </section>
    </div>
  );
}
