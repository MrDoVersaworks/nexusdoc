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
          <h3 style={styles.title}>✉️ Secure Developer Contact</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={styles.infoText}>Send a support inquiry or professional message. Automated abuse controls run on the server.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Name<input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required /></label>
          <label style={styles.label}>Email<input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required /></label>
          <label style={styles.label}>Message<textarea style={styles.textarea} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={5000} required /></label>
          <label style={styles.honeypot}>Website<input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.cancelButton} disabled={isSubmitting}>Cancel</button>
            <button type="submit" style={styles.submitButton} disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Message'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(5,5,10,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#0c0f1d', border: '1px solid rgba(108,92,231,.25)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(0,0,0,.5)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' },
  closeBtn: { background: 'none', border: 0, color: '#a0aed0', fontSize: 20, cursor: 'pointer' },
  infoText: { fontSize: 13, color: '#8a99ad', lineHeight: 1.5, marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: '#a0aed0', textTransform: 'uppercase', letterSpacing: '.05em' },
  input: { background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' },
  textarea: { background: 'rgba(15,23,42,.6)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' },
  honeypot: { position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#a0aed0', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' },
  submitButton: { background: '#6c5ce7', border: 0, color: '#fff', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' },
};
