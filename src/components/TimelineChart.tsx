import styles from './TimelineChart.module.css';

export interface TimelinePoint {
  date: string; // ISO
  label: string;
  sub?: string;
  color: string; // css color
  projected?: boolean;
}

const TONE_COLORS: Record<string, string> = {
  success: 'var(--success-600)',
  warning: 'var(--warning-600)',
  danger: 'var(--danger-600)',
  info: 'var(--color-primary)',
  neutral: 'var(--neutral-400)',
};

export function toneColor(tone: keyof typeof TONE_COLORS) {
  return TONE_COLORS[tone];
}

export function TimelineChart({
  points,
  legend,
}: {
  points: TimelinePoint[];
  legend?: { label: string; color: string; projected?: boolean }[];
}) {
  const years = points.map((p) => new Date(p.date).getFullYear());
  const minYear = Math.min(...years) - 1;
  const maxYear = Math.max(...years) + 1;
  const span = maxYear - minYear;

  function pct(dateIso: string) {
    const y = new Date(dateIso).getFullYear();
    const frac = new Date(dateIso).getMonth() / 12;
    return ((y - minYear + frac) / span) * 100;
  }

  const yearTicks = Array.from({ length: span + 1 }, (_, i) => minYear + i);

  const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let lastShownPct = -Infinity;
  const withVisibility = sorted.map((p) => {
    const p1 = pct(p.date);
    const showLabel = p1 - lastShownPct > 9;
    if (showLabel) lastShownPct = p1;
    return { ...p, showLabel };
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {yearTicks.map((y) => (
          <div key={y} className={styles.tick} style={{ left: `${((y - minYear) / span) * 100}%` }}>
            <span className={styles.tickLabel}>{y}</span>
          </div>
        ))}
        {withVisibility.map((p, i) => (
          <div key={i} className={styles.marker} style={{ left: `${pct(p.date)}%` }} title={`${p.label}${p.sub ? ' — ' + p.sub : ''}`}>
            {p.showLabel && (
              <div className={styles.markerLabel} style={{ bottom: 14 + (i % 2) * 26, maxWidth: 110, whiteSpace: 'normal' }}>
                {p.label}
                {p.sub && (
                  <>
                    <br />
                    <span className={styles.markerSub}>{p.sub}</span>
                  </>
                )}
              </div>
            )}
            <svg width="12" height="12" viewBox="0 0 12 12">
              {p.projected ? (
                <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke={p.color} strokeWidth="1.5" strokeDasharray="2 2" transform="rotate(45 6 6)" />
              ) : (
                <rect x="1.5" y="1.5" width="9" height="9" fill={p.color} transform="rotate(45 6 6)" />
              )}
            </svg>
          </div>
        ))}
      </div>
      {legend && (
        <div className={styles.legend}>
          {legend.map((l) => (
            <div className={styles.legendItem} key={l.label}>
              <svg width="10" height="10" viewBox="0 0 12 12">
                {l.projected ? (
                  <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke={l.color} strokeWidth="1.5" strokeDasharray="2 2" transform="rotate(45 6 6)" />
                ) : (
                  <rect x="1.5" y="1.5" width="9" height="9" fill={l.color} transform="rotate(45 6 6)" />
                )}
              </svg>
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
