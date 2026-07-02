import React from 'react';
import { Link } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar, type NavSection } from './Sidebar';
import styles from './AppShell.module.css';

export function AppShell({
  sections,
  showFundSwitcher,
  footerName,
  footerRole,
  children,
}: {
  sections: NavSection[];
  showFundSwitcher?: boolean;
  footerName: string;
  footerRole: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <TopNav />
      <div className={styles.body}>
        <Sidebar sections={sections} showFundSwitcher={showFundSwitcher} footerName={footerName} footerRole={footerRole} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <div className={styles.breadcrumb}>
      {items.map((it, i) => (
        <span key={i}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : it.label}
          {i < items.length - 1 && ' › '}
        </span>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  pill,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  pill?: React.ReactNode;
}) {
  return (
    <div className={styles.headerRow}>
      <div>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
          {pill}
        </h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </div>
  );
}

export function SplitRow({ main, side }: { main: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className={styles.splitRow}>
      <div className={styles.stack}>{main}</div>
      <div className={styles.stack}>{side}</div>
    </div>
  );
}

export function Stack({ children, gap }: { children: React.ReactNode; gap?: number }) {
  return <div className={styles.stack} style={gap ? { gap } : undefined}>{children}</div>;
}
