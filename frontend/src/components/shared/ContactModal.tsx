'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ContactModalProps { isOpen: boolean; onClose: () => void; }

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      toast.error('Please provide a valid name, email, and message of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), website }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message || data?.message || 'Failed to send message.');

      toast.success('Your message was received.');
      setName(''); setEmail(''); setMessage(''); setWebsite('');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Developer contact</h3>
            <p style={styles.subtitle}>Send a support inquiry or professional message.</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>
        <p style={styles.infoText}>Automated abuse controls run on the server.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Name<input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required /></label>
          <label style={styles.label}>Email<input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required /></label>
          <label style={styles.label}>Message<textarea style={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={5000} required /></label>
          <label style={styles.honeypot}>Website<input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={isSubmitting}>Cancel</button>
            <button type="submit" style={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send message'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.62)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#111316', border: '1px solid #3a3d44', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 50px rgba(0,0,0,.34)' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 },
  title: { margin: 0, fontSize: 18, fontWeight: 600, color: '#f5f5f7', letterSpacing: '-.02em' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 },
  closeBtn: { background: 'transparent', border: 0, color: '#a1a1aa', fontSize: 26, lineHeight: 1, cursor: 'pointer', padding: 2 },
  infoText: { fontSize: 13, color: '#71717a', lineHeight: 1.5, marginBottom: 18 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '.04em' },
  input: { background: '#0d0f12', border: '1px solid #27292e', borderRadius: 10, padding: '11px 13px', color: '#f5f5f7', fontSize: 14, outline: 'none' },
  textarea: { background: '#0d0f12', border: '1px solid #27292e', borderRadius: 10, padding: '11px 13px', color: '#f5f5f7', fontSize: 14, outline: 'none', resize: 'vertical' },
  honeypot: { position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelButton: { background: 'transparent', border: '1px solid #3a3d44', color: '#a1a1aa', borderRadius: 10, padding: '10px 16px', cursor: 'pointer' },
  submitButton: { background: '#6c5ce7', border: 0, color: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' },
};
