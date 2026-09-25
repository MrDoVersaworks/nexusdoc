import Link from 'next/link';
const updated = 'September 25, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className={'legal-page'}>
      <div className={'legal-shell'}>
        <Link href="/" className={'legal-back-link'}>← Back to NexusDoc</Link>
        <header className={'legal-hero'}>
          <div className={'legal-eyebrow'}>NexusDoc · Privacy</div>
          <h1 className={'legal-title'}>Privacy Policy</h1>
          <p className={'legal-intro'}>This policy explains what information NexusDoc handles, why it is needed, how document and AI data are processed, and the controls available to you.</p>
          <div className={'legal-meta'}><span>Effective: {updated}</span><span>Version 2.0</span></div>
        </header>
        <article className={'legal-content'}>
          <section className={'legal-section'}><h2>1. What this policy covers</h2><p>This policy applies to the NexusDoc web application and describes the information processed when you create an account, configure AI services, upload documents, search your workspace, or contact us.</p></section>
          <section className={'legal-section'}><h2>2. Information we handle</h2><ul><li><strong>Account information:</strong> name, email address, authentication data, and account settings.</li><li><strong>Documents:</strong> files you upload, extracted text, titles, metadata, summaries, and search embeddings.</li><li><strong>AI configuration:</strong> your Gemini model selections and, when supplied, your Gemini API key.</li><li><strong>Service activity:</strong> information needed to operate requests, security controls, rate limits, and troubleshooting.</li><li><strong>Messages:</strong> information you choose to provide through contact or review features.</li></ul></section>
          <section className={'legal-section'}><h2>3. How your information is used</h2><p>We use this information to authenticate you, store and retrieve your documents, generate summaries and embeddings, provide semantic search, maintain security, respond to support requests, and operate the application. We do not need your documents to provide unrelated advertising services.</p></section>
          <section className={'legal-section'}><h2>4. Your AI key and third-party processing</h2><p>NexusDoc uses a bring-your-own-key model for Gemini AI features. Your Gemini API key is encrypted before it is stored and is decrypted only when the backend needs to make an AI request for your account. Document text sent to Gemini is processed by Google according to the Google service and API terms that apply to your use of that service.</p><div className={'legal-callout'}>NexusDoc does not claim that a third-party AI provider has the same privacy practices as NexusDoc. Review the provider&apos;s current terms and data-use documentation before sending sensitive material.</div></section>
          <section className={'legal-section'}><h2>5. Storage, access, and security</h2><p>Documents are stored in private object storage and associated with the account that uploaded them. Database records, authentication controls, encrypted API-key storage, and server-side authorization are used to prevent ordinary cross-account access. No security measure can guarantee absolute security, so avoid uploading material you are not authorized to process.</p></section>
          <section className={'legal-section'}><h2>6. Retention and deletion</h2><p>Your account data and documents are retained while they are needed to provide the service or until you delete them, subject to operational backups, legal requirements, or unresolved storage-cleanup work. Document and account deletion initiates cleanup of associated application data and private stored files.</p></section>
          <section className={'legal-section'}><h2>7. Information sharing</h2><p>We share information only where needed to operate the service, such as with infrastructure and AI providers involved in storage, database hosting, or AI processing, or where disclosure is required to comply with a lawful request. We do not sell your documents or API keys.</p></section>
          <section className={'legal-section'}><h2>8. Your choices</h2><p>You can review or change available account and AI settings, replace or remove your stored Gemini API key, delete documents, and request account-related assistance through the contact channel provided by NexusDoc.</p></section>
          <section className={'legal-section'}><h2>9. Children and unauthorized use</h2><p>NexusDoc is not designed to knowingly collect information from children who are not permitted to use the service. Do not create an account or upload information on behalf of another person without the authority to do so.</p></section>
          <section className={'legal-section'}><h2>10. Changes to this policy</h2><p>We may update this policy when the product, processing activities, or applicable requirements change. The effective date above identifies the version currently presented on this page.</p></section>
          <section className={'legal-section'}><h2>11. Contact</h2><p>For privacy questions or requests, use the NexusDoc contact form available from the application.</p></section>
        </article>
        <p className={'legal-footer-note'}>NexusDoc · Privacy Policy · Last updated {updated}</p>
      </div>
    </main>
  );
}
