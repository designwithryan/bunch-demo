import { useState } from 'react';
import { PageHeader } from '../../components/AppShell';
import { Button, FilterChips } from '../../components/ui';
import { ChatDrawer } from '../../components/ChatDrawer';
import { useAppState } from '../../state/store';
import { allCallsList, callHasHold, callTotalDue, fmt2, fmtDateShort } from '../../state/selectors';
import type { ChecklistItem } from '../../data/types';
import tableStyles from '../../components/DataTable.module.css';

function slaFor(call: { submittedAt?: string; bunchChecklist: ChecklistItem[] }) {
  const hasEscalation = call.bunchChecklist.some((c) => c.state === 'escalated');
  if (!call.submittedAt) return { label: 'On track', tone: 'success' as const };
  const hoursAgo = (Date.now() - new Date(call.submittedAt).getTime()) / 36e5;
  if (hasEscalation) return { label: 'Escalated', tone: 'danger' as const };
  if (hoursAgo > 48) return { label: 'Breaching — 1h left', tone: 'danger' as const };
  if (hoursAgo > 20) return { label: 'Due today', tone: 'warning' as const };
  return { label: 'On track', tone: 'success' as const };
}

export function ReviewQueue() {
  const { state, dispatch } = useAppState();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const queue = allCallsList(state).filter((c) => c.status === 'under_review');
  const filtered = queue.filter((c) => {
    const sla = slaFor(c);
    if (filter === 'breaching') return sla.tone === 'danger' && sla.label.startsWith('Breach');
    if (filter === 'due') return sla.label === 'Due today';
    if (filter === 'escalated') return sla.label === 'Escalated';
    return true;
  });

  const active = state.calls[selectedId ?? filtered[0]?.id];
  const fund = active ? state.funds[active.fundId] : undefined;
  const thread = active ? state.chats[active.id] : undefined;
  const allResolved = active ? active.bunchChecklist.every((c) => c.state !== 'pending') : false;

  function resolveItem(itemId: string, itemState: 'clear' | 'escalated') {
    if (!active) return;
    dispatch({ type: 'BUNCH_RESOLVE_CHECKLIST_ITEM', callId: active.id, itemId, state: itemState });
  }

  function approve() {
    if (!active) return;
    dispatch({ type: 'BUNCH_APPROVE', callId: active.id });
    setSelectedId(null);
  }

  return (
    <div>
      <PageHeader title="Review Queue" subtitle="Every pending capital call across every client fund, prioritized by SLA" />
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'all', label: `All (${queue.length})` },
          { key: 'breaching', label: 'Breaching SLA' },
          { key: 'due', label: 'Due today' },
          { key: 'escalated', label: 'Escalated' },
        ]}
      />
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 24, alignItems: 'flex-start' }}>
        <div className={tableStyles.wrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Fund / Client</th>
                <th>Call</th>
                <th className={tableStyles.numeric}>Amount</th>
                <th>Submitted</th>
                <th>SLA</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((call) => {
                const f = state.funds[call.fundId];
                const sla = slaFor(call);
                const hasChat = !!state.chats[call.id];
                return (
                  <tr
                    key={call.id}
                    className={`${tableStyles.rowClickable} ${active?.id === call.id ? tableStyles.rowSelected : ''}`}
                    onClick={() => setSelectedId(call.id)}
                  >
                    <td style={{ fontWeight: 600 }}>{f.name}</td>
                    <td>
                      {hasChat && '💬 '}
                      {call.purpose}
                    </td>
                    <td className={tableStyles.numeric}>{fmt2(callTotalDue(call), f.currency)}</td>
                    <td className="muted">{call.submittedAt ? fmtDateShort(call.submittedAt) : '—'}</td>
                    <td style={{ color: sla.tone === 'danger' ? 'var(--danger-600)' : sla.tone === 'warning' ? 'var(--warning-600)' : 'var(--success-600)', fontWeight: 600 }}>
                      {sla.label}
                    </td>
                    <td className="muted">{f.name === 'Cherry Fund II' ? 'High' : 'Medium'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    Queue is clear.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {active && fund && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {thread && thread.parked && thread.messages.length > 0 && (
              <div style={{ background: 'var(--color-primary-tint-weak)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4 }}>
                  💬 Open support request from {state.currentUser.fundManagerName}
                </div>
                <p style={{ fontSize: 12, marginBottom: 8 }}>{thread.messages[thread.messages.length - 1].body}</p>
                <Button size="sm" variant="secondary" onClick={() => setChatOpen(true)}>
                  Open thread &amp; Reply
                </Button>
              </div>
            )}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{active.purpose}</h3>
              <p className="muted" style={{ fontSize: 12 }}>
                {fund.name} · {fmt2(callTotalDue(active), fund.currency)} · {active.notices.length} LPs
              </p>
            </div>
            {active.bunchChecklist.map((item) => (
              <ChecklistRow key={item.id} item={item} onResolve={(s) => resolveItem(item.id, s)} />
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={() => dispatch({ type: 'PEER_REQUEST_REVISION', callId: active.id, revision: { category: 'Amount', note: 'Bunch requested changes — see checklist notes.', ts: new Date().toISOString() } })}>
                Request Changes
              </Button>
              <Button variant="primary" disabled={!allResolved} onClick={approve}>
                {callHasHold(active) || active.bunchChecklist.some((c) => c.state === 'escalated')
                  ? 'Approve — Partial Hold (KYC)'
                  : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {active && <ChatDrawer callId={active.id} callLabel={active.purpose} open={chatOpen} onClose={() => setChatOpen(false)} role="bunch" />}
    </div>
  );
}

function ChecklistRow({ item, onResolve }: { item: ChecklistItem; onResolve: (s: 'clear' | 'escalated') => void }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            flexShrink: 0,
            marginTop: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#fff',
            background: item.state === 'clear' ? 'var(--success-600)' : item.state === 'escalated' ? 'var(--danger-600)' : 'var(--neutral-200)',
          }}
        >
          {item.state === 'clear' ? '✓' : item.state === 'escalated' ? '!' : ''}
        </span>
        <span style={{ flex: 1 }}>{item.label}</span>
      </div>
      {item.note && (
        <div style={{ marginLeft: 24, marginTop: 4, fontSize: 11, color: 'var(--danger-600)', background: 'var(--danger-100)', padding: '6px 8px', borderRadius: 6 }}>
          {item.note}
        </div>
      )}
      {item.state === 'pending' && (
        <div style={{ marginLeft: 24, marginTop: 6, display: 'flex', gap: 6 }}>
          <Button size="sm" variant="secondary" onClick={() => onResolve('clear')}>
            Check off
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onResolve('escalated')}>
            Escalate
          </Button>
        </div>
      )}
    </div>
  );
}
