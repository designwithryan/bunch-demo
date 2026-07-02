import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ui.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'sm';
  to?: string;
}

export function Button({ variant = 'secondary', size = 'md', className = '', to, children, ...rest }: ButtonProps) {
  const cls = `${styles.btn} ${styles[variant]} ${size === 'sm' ? styles.sm : ''} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function KpiStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className={styles.kpiStrip}>
      {items.map((it) => (
        <div className={styles.kpiItem} key={it.label}>
          <span className={styles.kpiLabel}>{it.label}</span>
          <span className={styles.kpiValue}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className={styles.chipRow}>
      {options.map((o) => (
        <button
          key={o.key}
          className={`${styles.chip} ${value === o.key ? styles.chipActive : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ViewToggle({
  value,
  onChange,
  options = [
    { key: 'list', label: 'List' },
    { key: 'timeline', label: 'Timeline' },
  ],
}: {
  value: string;
  onChange: (v: string) => void;
  options?: { key: string; label: string }[];
}) {
  return (
    <div className={styles.viewToggle}>
      {options.map((o) => (
        <button
          key={o.key}
          className={`${styles.viewToggleBtn} ${value === o.key ? styles.viewToggleActive : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div className={styles.segmented}>
      {options.map((o) => (
        <button
          key={o.key}
          className={`${styles.segmentedBtn} ${value === o.key ? styles.segmentedActive : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className={styles.eyebrow}>{children}</div>;
}

export function EmptyPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.emptyPlaceholder}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}
