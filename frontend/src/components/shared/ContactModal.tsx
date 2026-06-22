'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string; geminiKey?: string }>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!message.trim()) newErrors.message = 'Message is required';
    if (!geminiKey.trim()) newErrors.geminiKey = 'Gemini API Key is required for spam screening';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Step 1: Client-Side AI Gatekeeper (BYOK)
      const aiModel = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
      const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are a strict security gatekeeper for a software engineer's portfolio. Analyze this incoming contact message. Is it a valid, professional inquiry (e.g., job offer, project inquiry, tech question) or is it spam/marketing/malware? Return ONLY the word 'TRUE' if valid, or 'FALSE' if spam. Message: ${message}` }]
          }]
        })
      });

      if (!aiRes.ok) {
        throw new Error('Invalid Gemini API Key or rate limit exceeded. Please check your key.');
      }

      const aiData = await aiRes.json();
      const aiDecision = aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.toUpperCase();

      if (aiDecision === 'FALSE') {
        throw new Error('AI Gatekeeper rejected this message as spam or irrelevant.');
      }

      // Step 2: Dispatch to secure backend
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002').replace(/\/$/, '');
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, aiScreeningPassed: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to send message');
      }
      
      toast.success('Your message passed AI screening and was securely sent!');
      setName('');
      setEmail('');
      setMessage('');
      setGeminiKey('');
      setShowGuide(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>✉️ Secure Developer Contact</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <p style={styles.infoText}>
          Send a direct, validated support inquiry or message. This form is encrypted and dispatched via our secure mail server.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              placeholder="Your Name"
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              placeholder="you@example.com"
            />
            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...styles.textarea, ...(errors.message ? styles.inputError : {}) }}
              placeholder="Write your message here..."
              rows={4}
            />
            {errors.message && <span style={styles.errorText}>{errors.message}</span>}
          </div>

          <div style={styles.gatekeeperCard}>
            <div style={styles.gatekeeperHeader}>
              <h4 style={styles.gatekeeperTitle}>🤖 AI Gatekeeper (BYOK)</h4>
              <button 
                type="button" 
                onClick={() => setShowGuide(!showGuide)}
                style={styles.guideToggle}
              >
                {showGuide ? 'Hide Guide' : 'How to get a free key?'}
              </button>
            </div>
            
            {showGuide && (
              <div style={styles.guideSteps}>
                <ol style={styles.guideList}>
                  <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={styles.link}>Google AI Studio</a>.</li>
                  <li>Sign in and click <strong>"Create API key"</strong>.</li>
                  <li>Copy the key and paste it below. (It runs entirely in your browser and is never stored).</li>
                </ol>
              </div>
            )}

            <div style={styles.formGroup}>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{ ...styles.input, ...(errors.geminiKey ? styles.inputError : {}) }}
                placeholder="Paste your Gemini API Key..."
              />
              {errors.geminiKey && <span style={styles.errorText}>{errors.geminiKey}</span>}
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
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
    border: '1px solid rgba(108, 92, 231, 0.25)',
    borderRadius: '16px',
    padding: '28px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(108, 92, 231, 0.1)',
    fontFamily: 'inherit',
    animation: 'fadeIn 0.3s ease'
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
    color: '#fff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aed0',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    transition: 'color 0.2s'
  },
  infoText: {
    fontSize: '13px',
    color: '#8a99ad',
    lineHeight: '1.5',
    margin: '0 0 20px 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#a0aed0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  input: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  textarea: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.2s'
  },
  inputError: {
    borderColor: '#ff7675'
  },
  errorText: {
    color: '#ff7675',
    fontSize: '12px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  cancelButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#a0aed0',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  submitButton: {
    background: '#6c5ce7',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  gatekeeperCard: {
    background: 'rgba(108, 92, 231, 0.05)',
    border: '1px solid rgba(108, 92, 231, 0.2)',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '4px'
  },
  gatekeeperHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  gatekeeperTitle: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#6c5ce7'
  },
  guideToggle: {
    background: 'none',
    border: 'none',
    color: '#a0aed0',
    fontSize: '12px',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0
  },
  guideSteps: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px'
  },
  guideList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#a0aed0',
    lineHeight: '1.6'
  },
  link: {
    color: '#6c5ce7',
    textDecoration: 'none',
    fontWeight: '500'
  }
};
