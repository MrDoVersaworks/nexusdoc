import Link from 'next/link';
const updated = 'September 25, 2026';

export default function TermsOfServicePage() {
  return (
    <main className={'legal-page'}>
      <div className={'legal-shell'}>
        <Link href="/" className={'legal-back-link'}>← Back to NexusDoc</Link>
        <header className={'legal-hero'}>
          <div className={'legal-eyebrow'}>NexusDoc · Agreement</div>
          <h1 className={'legal-title'}>Terms of Service</h1>
          <p className={'legal-intro'}>These terms set the ground rules for using NexusDoc, including your account, uploaded material, AI features, security responsibilities, and the limits of the service.</p>
          <div className={'legal-meta'}><span>Effective: {updated}</span><span>Version 2.0</span></div>
        </header>
        <article className={'legal-content'}>
          <section className={'legal-section'}><h2>1. Acceptance</h2><p>By creating an account or using NexusDoc, you agree to these Terms and the Privacy Policy. If you do not agree, do not use the service.</p></section>
          <section className={'legal-section'}><h2>2. Your account</h2><p>You are responsible for the accuracy of the information you provide and for protecting your password, sessions, and AI credentials. Do not share your password or deliberately allow another person to use your account.</p></section>
          <section className={'legal-section'}><h2>3. Documents and content</h2><p>You retain the rights you already have in documents and other material you upload. You represent that you have the necessary rights and permissions to upload and process that material. NexusDoc receives the limited permissions needed to store, extract, index, retrieve, and process your content to provide the requested features.</p></section>
          <section className={'legal-section'}><h2>4. AI features and results</h2><p>AI summaries, embeddings, and search results are generated using configured AI services and may contain errors, omissions, or interpretations that require verification. They are assistance tools, not professional legal, medical, financial, compliance, or other expert advice.</p><div className={'legal-callout'}>Review important AI-generated results before relying on them, publishing them, or making decisions based on them.</div></section>
          <section className={'legal-section'}><h2>5. Bring Your Own Key</h2><p>NexusDoc may require you to provide your own Gemini API key for AI features. You are responsible for that key, the account or billing arrangement behind it, and your use of the applicable provider&apos;s services. NexusDoc does not guarantee a third-party provider&apos;s availability, pricing, quotas, or model behavior.</p></section>
          <section className={'legal-section'}><h2>6. Acceptable use</h2><p>You must not use NexusDoc to:</p><ul><li>upload or process material you do not have permission to use;</li><li>attempt to access another user&apos;s account, documents, credentials, or private data;</li><li>circumvent security controls, rate limits, or access restrictions;</li><li>introduce malicious code or intentionally abuse the service or its infrastructure; or</li><li>use the service in a way that violates applicable law or the rights of others.</li></ul></section>
          <section className={'legal-section'}><h2>7. Availability and changes</h2><p>NexusDoc may experience maintenance, provider outages, quota limitations, or other interruptions. Features may be changed, improved, suspended, or retired as the product evolves. We will make reasonable efforts to keep the service understandable when an operation cannot be completed.</p></section>
          <section className={'legal-section'}><h2>8. Account and content deletion</h2><p>You may delete documents and request account deletion through the available application controls. Deletion can take additional time where storage cleanup, backups, or other technical processes must complete.</p></section>
          <section className={'legal-section'}><h2>9. Intellectual property</h2><p>NexusDoc&apos;s software, interface, branding, and original platform materials remain owned by their respective rights holders. These terms do not transfer ownership of the platform to you, and they do not transfer ownership of your own content to NexusDoc.</p></section>
          <section className={'legal-section'}><h2>10. Disclaimers and liability</h2><p>To the extent permitted by applicable law, NexusDoc is not responsible for losses caused by your reliance on unverified AI output, your misuse of the service, content you were not authorized to upload, or failures of third-party services outside NexusDoc&apos;s control.</p></section>
          <section className={'legal-section'}><h2>11. Changes to these terms</h2><p>We may revise these terms as the service changes. The effective date on this page identifies the current version. Continued use after an updated version becomes effective means you accept the revised terms to the extent permitted by law.</p></section>
          <section className={'legal-section'}><h2>12. Contact</h2><p>Questions about these terms can be sent through the NexusDoc contact form available from the application.</p></section>
        </article>
        <p className={'legal-footer-note'}>NexusDoc · Terms of Service · Last updated {updated}</p>
      </div>
    </main>
  );
}
