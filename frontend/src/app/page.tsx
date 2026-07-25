'use client';

import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Database, Lock, Search, FileText, Server, TrendingUp, Code2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { UnifiedFooter } from '@/components/UnifiedFooter';
import styles from './page.module.css';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Satisfy strict lint rules by wrapping setState in a microtask
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: TrendingUp, title: 'Accelerated Engineering Velocity', desc: 'Automate hours of manual document synthesis into instantaneous, actionable insights.' },
    { icon: Code2, title: 'Production-Grade QA', desc: 'Fortified by rigorous Playwright E2E regression testing and strict CI/CD orchestration.' },
    { icon: Sparkles, title: 'Sovereign AI', desc: 'Powered dynamically by the specific model configured via your secure API key.' },
    { icon: Search, title: 'Semantic Discovery', desc: 'Vector-based retrieval to instantly find insights across documents.' },
    { icon: Lock, title: 'Air-Gapped Security', desc: 'Bring-Your-Own-Key (BYOK) architecture ensures absolute data privacy.' },
    { icon: Database, title: 'Vector Vault', desc: 'PostgreSQL-backed embeddings for hyper-scalable knowledge storage.' }
  ];


  if (!isMounted) return null; // Fixes SSR "frozen card" glitch

  return (
    <div className={styles.container}>
      {/* Navigation & Logo */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          NexusDoc
        </div>
      </nav>

      {/* High Fidelity Abstract Environment */}
      <div className={styles.background} />
      <div className={styles.gridOverlay} />

      {/* Looping Ambient Animation (Intelligence Scanner) */}
      <div className={styles.scannerContainer}>
        {/* Horizontal scanning laser line */}
        <motion.div 
          animate={{ top: ["0%", "100%", "0%"] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
          className={styles.scannerLine} 
        />
      </div>

      <div className={styles.splitLayout}>
        {/* Left Side: Sticky Hero Context */}
        <div className={styles.leftPanel}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={styles.badge}
          >
            <Lock className="w-4 h-4" />
            <span>Air-Gapped Document Intelligence</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className={styles.title}
          >
            Sovereign <br />
            <span className={styles.titleGradient}>
              Intelligence
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className={styles.description}
          >
            The deterministic knowledge vault for elite engineering teams. 
            Transform dense architectures into instantaneous, searchable vector spaces.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className={styles.actions}
          >
            <Link 
              href={isAuthenticated ? "/dashboard" : "/login"} 
              className={styles.btnCta}
            >
              {isAuthenticated ? 'Enter Dashboard' : 'Initialize Vault'}
              <ArrowRight className="w-5 h-5 ml-2 inline-block" />
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Scrolling Feature Deck */}
        <div className={styles.rightPanel}>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1, 
                ease: [0.25, 0.1, 0.25, 1] // Smooth Cubic Bezier, no spring jitter
              }}
              className={`card ${styles.featureCard}`}
            >
              <div className={styles.iconWrapper}>
                <motion.div
                  animate={idx < 2 ? { y: [0, -5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <feature.icon />
                </motion.div>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>



      <UnifiedFooter 
        platformName="NexusDoc Document Intelligence" 
        techStack="Next.js & Express"
        contactLink="https://devpulse-zeta-six.vercel.app/"
      />
    </div>
  );
}
