'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import type { ApiResponse, SearchResult } from '@/types';
import styles from './search.module.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const data = await apiRequest<ApiResponse<SearchResult[]>>({
        method: 'POST',
        path: '/api/documents/search',
        body: { query: query.trim() },
      });

      if (!data.success) {
        throw new Error(data.error.message);
      }

      setResults(data.data);

      if (data.data.length === 0) {
        toast.info('No matching results found.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed.';
      toast.error(message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function formatSimilarity(score: number): string {
    return `${(score * 100).toFixed(1)}%`;
  }

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <h1 className={styles.title}>Semantic Search</h1>
        <p className={styles.subtitle}>
          Search across all your documents using natural language
        </p>
      </header>

      <form onSubmit={handleSearch} className={styles.searchForm} id="search-form">
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your documents..."
            className={styles.searchInput}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={isSearching || !query.trim()}
          id="search-submit"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {isSearching ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Analyzing your documents...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔎</span>
          <h3>No results found</h3>
          <p>Try a different query or upload more documents.</p>
        </div>
      ) : results.length > 0 ? (
        <div className={styles.results}>
          <p className={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          {results.map((result, i) => (
            <div key={`${result.document_id}-${result.chunk_index}`} className={`card ${styles.resultCard}`}>
              <div className={styles.resultHeader}>
                <a
                  href={`/dashboard/documents/${result.document_id}`}
                  className={styles.resultDocTitle}
                >
                  📄 {result.document_title}
                </a>
                <span className={styles.similarityBadge}>
                  {formatSimilarity(result.similarity)} match
                </span>
              </div>
              <p className={styles.resultText}>{result.chunk_text}</p>
              <div className={styles.resultMeta}>
                <span>{result.document_filename}</span>
                <span>·</span>
                <span>Chunk #{result.chunk_index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
