export function BarList({ items, max }: { items: { label: string; value: number; display: string }[]; max?: number }) {
  const m = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, fontSize: 12, flexShrink: 0 }}>{it.label}</div>
          <div style={{ flex: 1, background: 'var(--neutral-100)', borderRadius: 4, height: 8, position: 'relative' }}>
            <div
              style={{
                width: `${Math.max((it.value / m) * 100, 3)}%`,
                background: 'var(--success-600)',
                height: '100%',
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ width: 48, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--success-600)' }}>{it.display}</div>
        </div>
      ))}
    </div>
  );
}
