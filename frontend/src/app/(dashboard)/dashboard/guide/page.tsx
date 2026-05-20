import styles from './guide.module.css';

export default function GuidePage() {
  return (
    <div className={`fade-in ${styles.container}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Guide & Architecture</h1>
        <p className={styles.subtitle}>Understanding how NexusDoc processes, secures, and analyzes your intelligence.</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🧠 1. Semantic Vector Search</h2>
        <div className={styles.sectionContent}>
          <p>
            Traditional search engines look for exact keyword matches. NexusDoc uses a much more advanced concept called <strong>Semantic Vector Search</strong>.
          </p>
          <div className={styles.highlightBox}>
            <strong>How it works:</strong>
            <ul className={styles.list}>
              <li>When you upload a document, the system breaks it down into hundreds of small chunks.</li>
              <li>It sends these chunks to the Google Gemini Embedding Model.</li>
              <li>The AI doesn't just read words; it converts the <em>meaning</em> of the sentence into a mathematical coordinate (a vector in 768-dimensional space).</li>
              <li>When you search a question (e.g., <em>"What causes crime?"</em>), your question is also converted into a coordinate. The database physically measures the distance between your question and every chunk to return the closest mathematical match!</li>
            </ul>
          </div>
          <p>
            NexusDoc utilizes <strong>Matryoshka-Style Truncation</strong> via an Adaptive Dimension Normalizer to safely align larger AI vectors to exactly 768 dimensions. This ensures high-performance database queries via <code>pgvector</code> while maintaining core semantic relationships.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>✨ 2. Generative AI Summarization</h2>
        <div className={styles.sectionContent}>
          <p>
            When a document is uploaded, it is passed through your configured Gemini Large Language Model (e.g., <code>gemini-1.5-flash</code>) to extract deep technical insights.
          </p>
          <ul className={styles.list}>
            <li><strong>Automated Insights:</strong> It automatically identifies the main topic, key bullet points, entities, and takeaways.</li>
            <li><strong>Raw Text Extraction:</strong> You can view the raw machine-extracted text that the AI "reads" by clicking the toggle button in the Document Viewer.</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🔒 3. Sovereign Security Architecture</h2>
        <div className={styles.sectionContent}>
          <p>
            NexusDoc is built with strict, deterministic security laws to ensure absolute data sovereignty.
          </p>
          <ul className={styles.list}>
            <li><strong>AES-256-GCM Encryption:</strong> Your Google API Key is encrypted at the database level. Only the application backend can decrypt it in volatile memory during technical orchestration.</li>
            <li><strong>Cloud Storage:</strong> Original files are stored securely in Vercel Blob with strict access tokens.</li>
            <li><strong>Total Account Deletion:</strong> The "Danger Zone" in your settings performs a cascading wipe. If you delete your account, every single document, chunk, vector, and API key associated with you is permanently destroyed.</li>
          </ul>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>⚙️ 4. Quick Start</h2>
        <div className={styles.sectionContent}>
          <p>Ready to begin?</p>
          <ol className={styles.list}>
            <li>Go to <strong>Settings</strong> and enter your Google AI Studio API Key.</li>
            <li>Leave the default models or specify your preferred Gemini models.</li>
            <li>Navigate to <strong>Documents</strong> and click <strong>Upload New</strong>.</li>
            <li>Watch as the system automatically extracts, summarizes, and indexes your data.</li>
            <li>Head to the <strong>Search</strong> tab to chat with your knowledge base!</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
