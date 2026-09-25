export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#04071a] text-[#94a3b8] p-8 pt-24">
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        <p className="text-sm text-[#64748b]">Version 1.0.0 · Last updated: July 2026</p>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">1. Information We Collect</h2><p>When you use NexusDoc, we collect information you provide directly: your name, email address, and uploaded documents. We also collect usage data such as search queries and document interactions to improve the platform.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">2. How We Use Your Information</h2><p>We use collected information to operate your document intelligence workspace, process semantic search queries, generate AI-powered summaries, and communicate important service updates.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">3. Data Security</h2><p>Sensitive credentials are encrypted before storage. Documents and embeddings are scoped to the owning account. Authentication uses short-lived access tokens and an httpOnly refresh cookie. Transport should use HTTPS in deployed environments.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">4. BYOK (Bring Your Own Key)</h2><p>If you provide an API key for AI features, the key is encrypted at rest and is decrypted only when the server needs to call the configured AI provider.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">5. Document Data</h2><p>Documents are processed into text, summaries, and vector embeddings for semantic search. Document access is restricted to the owning account.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">6. Data Retention & Deletion</h2><p>You may delete your account at any time. Account deletion is performed only after credential confirmation and storage cleanup succeeds; failed storage cleanup leaves the account recoverable for retry.</p></section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold text-white">7. Contact</h2><p>For privacy-related inquiries, please use the contact form provided by the portfolio site.</p></section>
      </div>
    </div>
  );
}
