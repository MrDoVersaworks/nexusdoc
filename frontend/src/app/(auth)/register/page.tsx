'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated (A5)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!termsAgreed) {
      setError('You must agree to the Terms of Service and Privacy Policy to proceed.');
      toast.error('Terms & Privacy agreement required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, name);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authLogo}>
          <h1><span className="gradient-text">NexusDoc</span></h1>
          <p>Create your account</p>
        </div>

        <div className="flex items-center gap-3 p-4 mb-6 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-accent-blue/10 rounded-lg text-accent-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-accent-blue uppercase tracking-widest mb-1">Frictionless Client Demo</p>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Email verification is temporarily disabled to allow immediate, seamless access. 
              You may use any dummy email to proceed.
            </p>
          </div>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit} id="register-form">
          {error && <div className={styles.authError}>{error}</div>}

          <div className={styles.authFormGroup}>
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.authFormGroup}>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.authFormGroup}>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.authFormGroup}>
            <label htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {/* Terms & Conditions Agreement Section */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                id="terms-checkbox-nd"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ marginTop: '0.2rem', cursor: 'pointer' }}
              />
              <label htmlFor="terms-checkbox-nd" style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, cursor: 'pointer' }}>
                I agree to the{' '}
                <Link href="/terms" target="_blank" style={{ color: '#06b6d4', textDecoration: 'underline' }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" style={{ color: '#06b6d4', textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => setTermsAgreed(true)}
                style={{ flex: 1, padding: '0.35rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: termsAgreed ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)', color: termsAgreed ? '#22d3ee' : '#94a3b8' }}
              >
                {termsAgreed ? '✓ Terms Agreed' : 'I Agree'}
              </button>
              <button
                type="button"
                onClick={() => setTermsAgreed(false)}
                style={{ flex: 1, padding: '0.35rem', borderRadius: '0.5rem', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: !termsAgreed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255,255,255,0.05)', color: !termsAgreed ? '#fb7185' : '#94a3b8' }}
              >
                Decline
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.authSubmitBtn}`}
            disabled={isSubmitting || !termsAgreed}
            id="register-submit"
            style={{ opacity: !termsAgreed ? 0.5 : 1, cursor: !termsAgreed ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
