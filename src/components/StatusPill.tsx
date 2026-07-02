import styles from './StatusPill.module.css';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_BY_KEYWORD: Array<[RegExp, PillTone]> = [
  [/paid|approved|cleared|resolved|clear|active|reconciled|on track/i, 'success'],
  [/overdue|default|held|flagged|escalated|dispute|breaching|urgent/i, 'danger'],
  [/pending|review|due today|expiring|awaiting|grace|calculating|changes requested/i, 'warning'],
  [/sent|investing|harvesting|not sent/i, 'info'],
];

export function toneForLabel(label: string): PillTone {
  for (const [re, tone] of TONE_BY_KEYWORD) {
    if (re.test(label)) return tone;
  }
  return 'neutral';
}

export function StatusPill({ label, tone }: { label: string; tone?: PillTone }) {
  const resolved = tone ?? toneForLabel(label);
  return <span className={`${styles.pill} ${styles[resolved]}`}>{label}</span>;
}
