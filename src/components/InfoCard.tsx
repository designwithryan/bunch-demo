import React from 'react';
import styles from './InfoCard.module.css';

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function InfoCard({
  title,
  onDownload,
  children,
}: {
  title: string;
  onDownload?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {onDownload && (
          <button className={styles.download} onClick={onDownload}>
            Download <span>↓</span>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function InfoRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <div className={`${styles.row} ${total ? styles.rowTotal : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function InfoLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button className={styles.linkRow} onClick={onClick}>
      {children}
    </button>
  );
}
