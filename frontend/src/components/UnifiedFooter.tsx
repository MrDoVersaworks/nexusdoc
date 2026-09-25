import Link from 'next/link';

interface FooterProps {
  platformName: string;
  techStack: string;
  contactLink?: string;
  creatorName?: string;
}

export function UnifiedFooter({ platformName, techStack, contactLink, creatorName = 'Oyewole Favour' }: FooterProps) {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        {contactLink && (
          <Link href={contactLink} style={styles.contact}>
            Contact developer
          </Link>
        )}
        <div style={styles.copy}>
          <p style={styles.primary}>{platformName} · {techStack}</p>
          <p style={styles.secondary}>Architected by <span style={styles.creator}>{creatorName}</span></p>
        </div>
        <nav style={styles.links} aria-label="Legal">
          <Link href="/terms" style={styles.link}>Terms of Service</Link>
          <Link href="/privacy" style={styles.link}>Privacy Policy</Link>
        </nav>
      </div>
    </footer>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  footer: { marginTop: 'auto', borderTop: '1px solid #27292e', padding: '40px 24px', color: '#71717a', fontSize: 14, position: 'relative', background: '#090a0c' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 },
  contact: { display: 'inline-flex', alignItems: 'center', padding: '10px 16px', background: '#111316', border: '1px solid #3a3d44', borderRadius: 10, color: '#f5f5f7', fontWeight: 600, textDecoration: 'none' },
  copy: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 5 },
  primary: { margin: 0, fontWeight: 500, color: '#d4d4d8' },
  secondary: { margin: 0, color: '#71717a' },
  creator: { color: '#a1a1aa', fontWeight: 600 },
  links: { display: 'flex', gap: 20, borderTop: '1px solid #27292e', paddingTop: 20, width: '100%', justifyContent: 'center' },
  link: { color: '#a1a1aa', textDecoration: 'none' },
};
