import Link from 'next/link';
import styles from '../legal.module.css';

export default function TermsOfServicePage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.legalShell}>
        <header className={styles.legalHeader}>
          <span className={styles.legalEyebrow}>NexusDoc · Terms</span>
          <h1 className={styles.legalTitle}>Terms of Service</h1>
          <p className={styles.legalIntro}>These terms describe the basic rules for using NexusDoc, your responsibilities, and the limits of AI-assisted features.</p>
          <p className={styles.legalMeta}>Version 1.1 · Last updated September 25, 2026</p>
        </header>
        <div className={styles.legalBody}>
          <section className={styles.legalSection}><h2>1. Using NexusDoc</h2><p>By creating an account or using NexusDoc, you agree to use the service lawfully and in accordance with these terms. If you do not agree, do not use the service.</p></section>
          <section className={styles.legalSection}><h2>2. Your account</h2><p>You are responsible for the information you provide, protecting your credentials and API keys, and activity performed through your account. Do not share credentials or attempt to access another user’s account.</p></section>
          <section className={styles.legalSection}><h2>3. Content you upload</h2><p>You are responsible for the documents and other content you submit. You must have the rights and permissions necessary to upload and process that content. Do not upload content that you are prohibited from processing or that violates applicable law.</p></section>
          <section className={styles.legalSection}><h2>4. AI features</h2><p>NexusDoc uses AI services to summarize documents and support semantic search. AI output is generated automatically and may be inaccurate, incomplete, outdated, or unsuitable for a particular purpose. You are responsible for reviewing important results against the original source.</p></section>
          <section className={styles.legalSection}><h2>5. Connected AI providers</h2><p>When you provide your own AI provider key, requests are made using that provider account. You are responsible for keeping the key valid and for any provider usage, quota, billing, or restrictions associated with it.</p></section>
          <section className={styles.legalSection}><h2>6. Acceptable use</h2><ul><li>Do not interfere with the operation or security of the service.</li><li>Do not attempt unauthorized access, abuse authentication, or bypass access controls.</li><li>Do not upload malware or deliberately malformed content intended to disrupt the service.</li><li>Do not use NexusDoc to violate applicable law or another person’s rights.</li></ul></section>
          <section className={styles.legalSection}><h2>7. Service availability</h2><p>NexusDoc depends on application infrastructure, storage systems, databases, and third-party providers. Those dependencies can experience outages, rate limits, maintenance, or other failures. We do not promise uninterrupted or error-free operation.</p></section>
          <section className={styles.legalSection}><h2>8. Your content and platform ownership</h2><p>You retain your rights in content you upload. NexusDoc’s application code, visual design, branding, and related platform materials remain the property of their respective owner, subject to any separate license that applies.</p></section>
          <section className={styles.legalSection}><h2>9. Security and responsible use</h2><p>We maintain technical controls intended to protect accounts and data, but no online service can guarantee absolute security. Tell us promptly if you believe your account or credentials have been compromised.</p></section>
          <section className={styles.legalSection}><h2>10. Suspension and termination</h2><p>Access may be restricted or terminated when necessary to protect the service, investigate abuse, address security issues, or comply with applicable obligations. You may stop using the service at any time.</p></section>
          <section className={styles.legalSection}><h2>11. Disclaimers and limitation of liability</h2><p>To the extent permitted by applicable law, NexusDoc is provided on an “as available” basis and AI-generated results are not guaranteed to be accurate or fit for a particular purpose. Nothing in these terms is intended to exclude a right or liability that cannot lawfully be excluded or limited.</p></section>
          <section className={styles.legalSection}><h2>12. Changes to these terms</h2><p>These terms may be updated as the service changes. Material changes will be reflected by updating the version and revision date shown on this page.</p></section>
          <section className={styles.legalSection}><h2>13. Contact</h2><p>Questions about these terms can be sent through the contact channel provided by NexusDoc.</p><p style={{marginTop:'0.75rem'}}><Link href="/">Return to NexusDoc</Link></p></section>
        </div>
      </div>
    </main>
  );
}
