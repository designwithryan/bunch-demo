import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/AppShell';
import { Button, FilterChips, Segmented } from '../../components/ui';
import { StatusPill } from '../../components/StatusPill';
import { NoticeDocument } from '../../components/NoticeDocument';
import { InfoCard, InfoRow, InfoLink, downloadTextFile } from '../../components/InfoCard';
import { ChatDrawer } from '../../components/ChatDrawer';
import { Modal } from '../../components/Modal';
import { useAppState } from '../../state/store';
import { callsForFund, callTotalDue, commitmentPctFor, fmt2, fmtDate, noticeStatusLabel } from '../../state/selectors';
import type { CapitalCall, RevisionRequest } from '../../data/types';
import tableStyles from '../../components/DataTable.module.css';

const CATEGORIES: RevisionRequest['category'][] = ['Amount', 'Dates', 'Wording', 'Line items'];

export function Reviews() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [level, setLevel] = useState<'fund' | 'investor'>('investor');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedLpId, setSelectedLpId] = useState<string | null>(null);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [approvedModal, setApprovedModal] = useState<CapitalCall | null>(null);

  const calls = callsForFund(state, state.activeFundId).filter((c) => c.peerStatus !== 'not_submitted');

  const filtered = calls.filter((c) => {
    if (filter === 'pending') return c.peerStatus === 'pending';
    if (filter === 'changes') return c.peerStatus === 'changes_requested';
    if (filter === 'approved') return c.peerStatus === 'approved';
    return true;
  });

  const activeCall: CapitalCall | undefined = state.calls[selectedCallId ?? filtered[0]?.id];
  const fund = activeCall ? state.funds[activeCall.fundId] : undefined;
  const activeLpId = selectedLpId ?? activeCall?.notices[0]?.lpId ?? null;
  const activeNotice = activeCall?.notices.find((n) => n.lpId === activeLpId) ?? activeCall?.notices[0];
  const flaggedNotices = activeCall?.notices.filter((n) => n.flagged) ?? [];

  const counts = {
    all: calls.length,
    pending: calls.filter((c) => c.peerStatus === 'pending').length,
    changes: calls.filter((c) => c.peerStatus === 'changes_requested').length,
    approved: calls.filter((c) => c.peerStatus === 'approved').length,
  };

  function select(callId: string, lpId?: string) {
    setSelectedCallId(callId);
    setSelectedLpId(lpId ?? null);
  }

  function approve() {
    if (!activeCall) return;
    dispatch({ type: 'PEER_APPROVE', callId: activeCall.id });
    setApprovedModal(activeCall);
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Capital calls other members of your team have created and assigned to you to check and approve"
        actions={
          <Button variant="secondary" onClick={() => setChatOpen(true)}>
            💬 Request Bunch Support
          </Button>
        }
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending', label: `Pending review (${counts.pending})` },
            { key: 'changes', label: `Changes requested (${counts.changes})` },
            { key: 'approved', label: `Approved (${counts.approved})` },
          ]}
        />
        <Segmented value={level} onChange={(v) => setLevel(v as 'fund' | 'investor')} options={[{ key: 'fund', label: 'Fund level' }, { key: 'investor', label: 'Investor level' }]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 24, alignItems: 'flex-start' }}>
        <div className={tableStyles.wrap}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Call</th>
                <th>Investor</th>
                <th>Country</th>
                <th className={tableStyles.numeric}>Amount</th>
                <th>Submitted</th>
                <th>Assigned to</th>
                <th>Payout date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((call) => {
                const flagCount = call.notices.filter((n) => n.flagged).length;
                const isCallSelected = activeCall?.id === call.id && !selectedLpId;
                return (
                  <Fragment key={call.id}>
                    <tr
                      className={`${tableStyles.rowClickable} ${isCallSelected ? tableStyles.rowSelected : ''}`}
                      onClick={() => select(call.id)}
                    >
                      <td style={{ fontWeight: 600 }}>{call.purpose}</td>
                      <td>
                        {call.notices.length} LP{call.notices.length !== 1 ? 's' : ''}
                        {flagCount > 0 && ` (${flagCount} flagged)`}
                      </td>
                      <td className="muted">Multiple</td>
                      <td className={tableStyles.numeric}>{fmt2(callTotalDue(call), fund?.currency)}</td>
                      <td className="muted">{call.submittedAt ? fmtDate(call.submittedAt) : '—'}</td>
                      <td className="muted">{call.assignedReviewer ?? '—'}</td>
                      <td className="muted">{fmtDate(call.dueDate)}</td>
                      <td>
                        <StatusPill label={peerLabel(call.peerStatus)} />
                      </td>
                    </tr>
                    {level === 'investor' &&
                      call.notices.map((n) => {
                        const lp = state.lps[n.lpId];
                        const rowSelected = activeCall?.id === call.id && selectedLpId === n.lpId;
                        return (
                          <tr
                            key={call.id + n.lpId}
                            className={`${tableStyles.rowClickable} ${rowSelected ? tableStyles.rowSelected : ''} ${n.flagged ? tableStyles.rowFlagged : ''}`}
                            onClick={() => select(call.id, n.lpId)}
                          >
                            <td className={tableStyles.indent}>↳ {lp.name}</td>
                            <td className="muted">—</td>
                            <td className="muted">{lp.country}</td>
                            <td className={tableStyles.numeric}>{fmt2(n.amountDue, fund?.currency)}</td>
                            <td className="muted">—</td>
                            <td className="muted">—</td>
                            <td className="muted">—</td>
                            <td>
                              <StatusPill label={n.flagged ? 'Flagged' : peerLabel(call.peerStatus)} />
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                    Nothing in this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {activeCall && fund && activeNotice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--warning-600)' }}>
                {peerLabel(activeCall.peerStatus)}
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, marginTop: 4 }}>{activeCall.purpose}</h3>
              <p className="muted" style={{ fontSize: 12 }}>
                Submitted by {activeCall.submittedBy} · {activeCall.notices.length} LPs
              </p>
            </div>

            {activeCall.reviewNotes.length > 0 && (
              <div style={{ background: 'var(--warning-100)', color: '#92600a', padding: 10, borderRadius: 8, fontSize: 12 }}>
                <b>Last revision note ({activeCall.reviewNotes[activeCall.reviewNotes.length - 1].category}):</b>{' '}
                {activeCall.reviewNotes[activeCall.reviewNotes.length - 1].note}
              </div>
            )}

            <InfoCard
              title="Calculation"
              onDownload={() =>
                downloadTextFile(
                  `${activeCall.purpose.replace(/\s+/g, '-')}-calculation.txt`,
                  activeCall.lineItems.map((li) => `${li.label}: ${fmt2(li.amount, fund.currency)}`).join('\n')
                )
              }
            >
              {activeCall.lineItems.map((li) => (
                <InfoRow key={li.label} label={li.label} value={fmt2(li.amount, fund.currency)} />
              ))}
              <InfoRow
                label="LPs flagged"
                value={
                  flaggedNotices.length ? `${flaggedNotices.length} of ${activeCall.notices.length} (${flaggedNotices[0].flagReason?.split(' — ')[0]})` : `0 of ${activeCall.notices.length}`
                }
              />
              <InfoLink onClick={() => navigate('/fund-manager/capital-calls')}>View full LP-by-LP breakdown →</InfoLink>
            </InfoCard>

            <InfoCard
              title="Notice template"
              onDownload={() =>
                downloadTextFile(
                  `${activeCall.purpose.replace(/\s+/g, '-')}-notice-template.txt`,
                  `Capital Call Notice — ${fund.name}\nTo: ${state.lps[activeNotice.lpId].name}\nAmount due: ${fmt2(activeNotice.amountDue, fund.currency)}`
                )
              }
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <NoticeDocument
                  call={activeCall}
                  notice={activeNotice}
                  fund={fund}
                  lp={state.lps[activeNotice.lpId]}
                  commitmentPct={commitmentPctFor(state, activeCall, activeNotice.lpId)}
                  scale="compact"
                />
                <div style={{ width: 140 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, marginBottom: 6 }}>{activeCall.notices.length} notices generated</p>
                  <p className="muted" style={{ fontSize: 10, lineHeight: 1.5 }}>
                    {flaggedNotices.length
                      ? `${flaggedNotices.length} held pending KYC renewal — the other ${activeCall.notices.length - flaggedNotices.length} are ready to send on approval.`
                      : `All ${activeCall.notices.length} are ready to send on approval.`}
                  </p>
                </div>
              </div>
            </InfoCard>

            {flaggedNotices.length > 0 && (
              <div style={{ background: 'var(--danger-100)', color: 'var(--danger-600)', padding: '10px 12px', borderRadius: 8, fontSize: 12 }}>
                🚩 {flaggedNotices.length} LP{flaggedNotices.length > 1 ? 's' : ''} flagged — {state.lps[flaggedNotices[0].lpId].name} ({state.lps[flaggedNotices[0].lpId].country}),{' '}
                {flaggedNotices[0].flagReason}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button style={{ flex: 1, borderRadius: 999, justifyContent: 'center' }} onClick={() => setRevisionOpen(true)}>
                Request Revision
              </Button>
              <Button variant="primary" style={{ flex: 1, borderRadius: 999, justifyContent: 'center' }} onClick={approve}>
                Approve
              </Button>
            </div>
          </div>
        )}
      </div>

      {activeCall && (
        <RequestRevisionModal
          open={revisionOpen}
          onClose={() => setRevisionOpen(false)}
          callName={activeCall.purpose}
          reviewer={activeCall.assignedReviewer ?? 'the reviewer'}
          onSend={(revision) => {
            dispatch({ type: 'PEER_REQUEST_REVISION', callId: activeCall.id, revision });
            setRevisionOpen(false);
          }}
        />
      )}

      {activeCall && <ChatDrawer callId={activeCall.id} callLabel={activeCall.purpose} open={chatOpen} onClose={() => setChatOpen(false)} role="fundManager" />}

      <Modal open={!!approvedModal} onClose={() => setApprovedModal(null)} title="Approved">
        <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          <b>{approvedModal?.purpose}</b> has been approved on your side and moved into Bunch's cross-fund Review Queue for
          final sign-off. You can track its progress any time from the Capital Calls overview.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setApprovedModal(null)}>Stay on Reviews</Button>
          <Button variant="primary" onClick={() => navigate('/fund-manager/capital-calls')}>
            Go to Capital Calls overview →
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function peerLabel(status: CapitalCall['peerStatus']) {
  if (status === 'pending') return 'Pending review';
  if (status === 'changes_requested') return 'Changes requested';
  if (status === 'approved') return 'Approved';
  return 'Not submitted';
}

function RequestRevisionModal({
  open,
  onClose,
  callName,
  reviewer,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  callName: string;
  reviewer: string;
  onSend: (r: RevisionRequest) => void;
}) {
  const [category, setCategory] = useState<RevisionRequest['category']>('Amount');
  const [note, setNote] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="Request Revision" wide>
      <p className="muted" style={{ fontSize: 12, marginTop: -8, marginBottom: 14 }}>
        {callName} · to {reviewer}
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={category === c ? 'primary' : 'secondary'} onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Describe what needs to change…"
        style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'inherit' }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!note.trim()}
          onClick={() => onSend({ category, note: note.trim(), ts: new Date().toISOString() })}
        >
          Send to {reviewer}
        </Button>
      </div>
    </Modal>
  );
}
