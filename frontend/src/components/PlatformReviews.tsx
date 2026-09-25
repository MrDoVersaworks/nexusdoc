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
    <div style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#fff' }}>NexusDoc <span style={{ color: '#06b6d4' }}>App Experience &amp; Reviews</span></h2>
        <p style={{ color: '#94a3b8', fontSize: '.95rem' }}>Share your experience using NexusDoc for document intelligence, AI summarization, and vector search.</p>
      </div>

      {reviews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#fbbf24' }}>{'★'.repeat(review.rating)}</span>
                {review.createdAt && <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(review.createdAt).toLocaleDateString()}</span>}
              </div>
              <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.5 }}>“{review.feedback}”</p>
              <div style={{ marginTop: 12, color: '#fff', fontWeight: 700 }}>{review.name} <span style={{ color: '#06b6d4', fontWeight: 400 }}>• {review.profession}</span></div>
            </div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        style={{ background: 'rgba(5,5,5,.6)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 20, padding: 32, maxWidth: 650, margin: '0 auto' }}>
        {submitted ? (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Review submitted</h3>
            <p style={{ color: '#94a3b8' }}>Thanks. Your review is awaiting moderation and will appear here if approved.</p>
            <button onClick={() => setSubmitted(false)} style={{ marginTop: 12, background: 'transparent', color: '#06b6d4', border: '1px solid rgba(6,182,212,.3)', padding: '8px 14px', borderRadius: 8 }}>Write Another Review</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Submit NexusDoc Usage Review</h3>
            {errorMsg && <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center' }}>{errorMsg}</div>}
            <input required maxLength={255} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} />
            <input maxLength={255} placeholder="Role / Profession" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} style={styles.input} />
            <div style={{ display: 'flex', gap: 6 }}>{[1,2,3,4,5].map((star) => <button type="button" key={star} onClick={() => setForm({ ...form, rating: star })} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 20, color: star <= form.rating ? '#fbbf24' : '#475569' }}>★</button>)}</div>
            <textarea required rows={4} maxLength={2000} placeholder="How was your experience?" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} style={styles.textarea} />
            <button type="submit" disabled={isSubmitting} style={styles.button}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  input: { width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff' },
  textarea: { width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', resize: 'vertical' },
  button: { background: '#06b6d4', color: '#0f172a', fontWeight: 700, padding: '12px 20px', borderRadius: 8, border: 0, cursor: 'pointer' },
};
