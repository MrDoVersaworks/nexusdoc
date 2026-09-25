'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export interface Review {
  id: string; name: string; rating: number; feedback: string; profession?: string; createdAt?: string;
}

export function PlatformReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', profession: '', rating: 5, feedback: '' });

  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

  useEffect(() => {
    fetch(`${backendUrl}/api/public/reviews`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setReviews(json.data); })
      .catch(() => setReviews([]));
  }, [backendUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.feedback.trim()) {
      setErrorMsg('Please complete the required fields.');
      return;
    }
    setIsSubmitting(true); setErrorMsg('');
    try {
      const response = await fetch(`${backendUrl}/api/public/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) throw new Error(json?.error?.message || 'Failed to submit review.');
      setSubmitted(true);
      setForm({ name: '', profession: '', rating: 5, feedback: '' });
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section style={styles.section} aria-labelledby="reviews-title">
      <div style={styles.heading}>
        <h2 id="reviews-title" style={styles.title}>NexusDoc <span style={styles.accent}>reviews</span></h2>
        <p style={styles.subtitle}>Share your experience with document intelligence, AI summarization, and vector search.</p>
      </div>

      {reviews.length > 0 && (
        <div style={styles.reviewGrid}>
          {reviews.map((review) => (
            <article key={review.id} style={styles.reviewCard}>
              <div style={styles.reviewMeta}>
                <span style={styles.stars} aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}</span>
                {review.createdAt && <time style={styles.date}>{new Date(review.createdAt).toLocaleDateString()}</time>}
              </div>
              <p style={styles.feedback}>“{review.feedback}”</p>
              <div style={styles.reviewer}>{review.name}{review.profession && <span style={styles.profession}> · {review.profession}</span>}</div>
            </article>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={styles.formCard}>
        {submitted ? (
          <div style={styles.success}>
            <h3 style={styles.formTitle}>Review submitted</h3>
            <p style={styles.formCopy}>Thanks. Your review is awaiting moderation and will appear here if approved.</p>
            <button onClick={() => setSubmitted(false)} style={styles.secondaryButton}>Write another review</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <h3 style={styles.formTitle}>Share your experience</h3>
              <p style={styles.formCopy}>Your review will be published after moderation.</p>
            </div>
            {errorMsg && <div role="alert" style={styles.error}>{errorMsg}</div>}
            <input required maxLength={255} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input maxLength={255} placeholder="Role / profession" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
            <div style={styles.rating} aria-label="Choose a rating">{[1,2,3,4,5].map((star) => <button type="button" key={star} onClick={() => setForm({ ...form, rating: star })} aria-label={`${star} star`} style={{ ...styles.starButton, color: star <= form.rating ? '#ffb340' : '#52525b' }}>★</button>)}</div>
            <textarea required rows={4} maxLength={2000} placeholder="How was your experience?" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            <button type="submit" disabled={isSubmitting} style={styles.primaryButton}>{isSubmitting ? 'Submitting…' : 'Submit review'}</button>
          </form>
        )}
      </motion.div>
    </section>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: { padding: '72px 24px', maxWidth: 1040, margin: '0 auto' },
  heading: { textAlign: 'center', marginBottom: 40 },
  title: { fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, letterSpacing: '-.04em', color: '#f5f5f7', marginBottom: 8 },
  accent: { color: '#6c5ce7' },
  subtitle: { color: '#a1a1aa', fontSize: '.95rem', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 12, marginBottom: 24 },
  reviewCard: { background: '#111316', border: '1px solid #27292e', borderRadius: 14, padding: 22 },
  reviewMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  stars: { color: '#ffb340', letterSpacing: 1, fontSize: 14 },
  date: { fontSize: 12, color: '#71717a' },
  feedback: { color: '#d4d4d8', lineHeight: 1.6, marginBottom: 16 },
  reviewer: { color: '#f5f5f7', fontWeight: 600, fontSize: 14 },
  profession: { color: '#71717a', fontWeight: 400 },
  formCard: { background: '#111316', border: '1px solid #27292e', borderRadius: 16, padding: '28px', maxWidth: 620, margin: '0 auto', boxShadow: '0 12px 32px rgba(0,0,0,.16)' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  formTitle: { fontSize: 18, fontWeight: 600, color: '#f5f5f7', marginBottom: 4 },
  formCopy: { color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 },
  rating: { display: 'flex', gap: 2 },
  starButton: { background: 'none', border: 0, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 },
  primaryButton: { background: '#6c5ce7', color: '#fff', fontWeight: 600, padding: '12px 18px', borderRadius: 10, border: 0, cursor: 'pointer' },
  secondaryButton: { marginTop: 16, background: 'transparent', color: '#a1a1aa', border: '1px solid #3a3d44', padding: '9px 14px', borderRadius: 10, cursor: 'pointer' },
  error: { color: '#ff453a', background: 'rgba(255,69,58,.08)', border: '1px solid rgba(255,69,58,.2)', padding: '9px 12px', borderRadius: 9, fontSize: 13 },
  success: { textAlign: 'center' },
};
