'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import ApiKeyBanner from './ApiKeyBanner';
import styles from './DashboardShell.module.css';

interface NavLink {
  label: string;
  href: string;
  icon: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Documents', href: '/dashboard/documents', icon: '📄' },
  { label: 'Search', href: '/dashboard/search', icon: '🔍' },
  { label: 'Guide', href: '/dashboard/guide', icon: '📖' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Logout failed.');
    }
  }

  const userInitial = (() => {
    if (user && user.name) return user.name.charAt(0).toUpperCase();
    if (user && user.email) return user.email.charAt(0).toUpperCase();
    return '?';
  })();

  return (
    <div className={styles.shell}>
      {/* Mobile toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        id="sidebar-toggle"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBrand}>
          <h2><span className="gradient-text">NexusDoc</span></h2>
        </div>

        <nav>
          <ul className={styles.sidebarNav}>
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href));

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    onClick={() => setSidebarOpen(false)}
                    id={`nav-${link.label.toLowerCase()}`}
                  >
                    <span className={styles.navIcon}>{link.icon}</span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{userInitial}</div>
            <div className={styles.userTextWrapper}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <div className={styles.contactDev}>
            <p className={styles.contactTitle}>Sovereign Support</p>
            <p className={styles.architectName}>Architected by Oyewole Favour</p>
            <a href="mailto:mrdoofficial1@gmail.com" className={styles.contactEmail}>
              mrdoofficial1@gmail.com
            </a>
          </div>
          <button
            className={`${styles.navItem}`}
            onClick={toggleTheme}
            id="theme-toggle-btn"
          >
            <span className={styles.navIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            className={`${styles.navItem}`}
            onClick={handleLogout}
            id="logout-btn"
          >
            <span className={styles.navIcon}>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <ApiKeyBanner />
        {children}
      </main>
    </div>
  );
}
