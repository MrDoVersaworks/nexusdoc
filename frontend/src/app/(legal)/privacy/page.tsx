import Link from 'next/link';
import styles from '../legal.module.css';

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.legalShell}>
        <header className={styles.legalHeader}>
          <span className={styles.legalEyebrow}>NexusDoc · Privacy</span>
          <h1 className={styles.legalTitle}>Privacy Policy</h1>
          <p className={styles.legalIntro}>This policy explains what information NexusDoc handles, why it is needed to provide the service, and the choices available to you.</p>
          <p className={styles.legalMeta}>Version 1.1 · Last updated September 25, 2026</p>
        </header>
        <div className={styles.legalBody}>
          <section className={styles.legalSection}><h2>1. Information we handle</h2><p>Depending on how you use NexusDoc, we may handle your name, email address, account credentials, documents you upload, document text, AI-generated summaries, search activity, and service settings.</p></section>
          <section className={styles.legalSection}><h2>2. How we use information</h2><p>We use this information to authenticate your account, store and retrieve your documents, provide document search and AI-assisted analysis, protect the service, respond to support requests, and maintain service reliability.</p></section>
          <section className={styles.legalSection}><h2>3. Documents and AI processing</h2><p>Uploaded documents may be converted to text, summarized, divided into searchable chunks, and converted into vector embeddings. These operations are required for the corresponding NexusDoc features.</p><div className={styles.legalNote}>AI output can be incomplete or incorrect. Do not rely on an AI-generated summary or search result as a substitute for reviewing the original document when accuracy matters.</div></section>
          <section className={styles.legalSection}><h2>4. Your AI API key</h2><p>If you connect your own AI provider key, NexusDoc stores the key in encrypted form and uses it to make the configured provider requests on your behalf. You remain responsible for the provider account, its quota, billing, and applicable provider terms.</p></section>
          <section className={styles.legalSection}><h2>5. Storage and security</h2><p>Authentication credentials and other sensitive settings are protected using the application’s security controls. Private documents are associated with the owning account, and authenticated access is required to retrieve them. No security measure can guarantee absolute security.</p></section>
          <section className={styles.legalSection}><h2>6. Retention and deletion</h2><p>You can delete documents through the application and can request account deletion through the available account controls or support channel. Some operational records may need to be retained for security, legal, or service-integrity purposes.</p></section>
          <section className={styles.legalSection}><h2>7. Service providers</h2><p>NexusDoc may use third-party infrastructure and AI providers to host application data, store files, send requests, or provide AI functionality. Information sent to those providers is handled according to the service configuration and the providers’ applicable terms and privacy policies.</p></section>
          <section className={styles.legalSection}><h2>8. Cookies and local storage</h2><p>The application may use a secure refresh cookie and browser storage required for authentication and application operation. These mechanisms support the service rather than unrelated advertising.</p></section>
          <section className={styles.legalSection}><h2>9. Your choices</h2><ul><li>Review or update account and AI settings available in NexusDoc.</li><li>Delete documents you no longer want stored.</li><li>Stop using connected AI services by removing the configured key.</li><li>Contact the service operator with privacy questions or requests.</li></ul></section>
          <section className={styles.legalSection}><h2>10. Changes to this policy</h2><p>If the way NexusDoc handles information materially changes, this policy will be updated to reflect the new practice and the revision date will be changed.</p></section>
          <section className={styles.legalSection}><h2>11. Contact</h2><p>For privacy questions or requests, use the contact channel provided by NexusDoc.</p><p style={{marginTop:'0.75rem'}}><Link href="/">Return to NexusDoc</Link></p></section>
        </div>
      </div>
    </main>
  );
}
