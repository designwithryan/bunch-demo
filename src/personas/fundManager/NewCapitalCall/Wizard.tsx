import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/AppShell';
import { Button } from '../../../components/ui';
import { StepEyebrow } from '../../../components/Stepper';
import { Modal } from '../../../components/Modal';
import { NoticeDocument } from '../../../components/NoticeDocument';
import { ChatDrawer } from '../../../components/ChatDrawer';
import { useAppState } from '../../../state/store';
import { fmt2, fundLps } from '../../../state/selectors';
import { standardLineItems, WORKING_CAPITAL_RATE } from '../../../data/fixtures';
import type { CapitalCall, NoticeLine } from '../../../data/types';
import styles from './Wizard.module.css';
import tableStyles from '../../../components/DataTable.module.css';

const round2 = (n: number) => Math.round(n * 100) / 100;

type CallType = 'one-time' | 'scheduled';
type Cadence = 'Monthly' | 'Quarterly' | 'Half-year' | 'Yearly';
const CADENCE_OPTIONS: { value: Cadence; label: string; adverb: string }[] = [
  { value: 'Monthly', label: 'Monthly', adverb: 'month' },
  { value: 'Quarterly', label: 'Quarterly', adverb: 'quarter' },
  { value: 'Half-year', label: 'Half-yearly', adverb: 'half-year' },
  { value: 'Yearly', label: 'Yearly', adverb: 'year' },
];

export function NewCapitalCallWizard() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [zoomLpId, setZoomLpId] = useState<string | null>(null);

  const [type, setType] = useState<CallType>('one-time');
  const [fundId, setFundId] = useState(state.activeFundId);
  const [purpose, setPurpose] = useState('Series C follow-on — Portfolio Co. N');
  const [linkedInvestment, setLinkedInvestment] = useState('Portfolio Co. N — Series C, €3.5M round');
  const [amount, setAmount] = useState(1_500_000);
  const [noticeDate, setNoticeDate] = useState('2026-08-01');
  const [dueDate, setDueDate] = useState('2026-09-05');

  const [startDate, setStartDate] = useState('2027-01-01 (next quarter)');
  const [cadence, setCadence] = useState<Cadence>('Quarterly');
  const cadenceInfo = CADENCE_OPTIONS.find((c) => c.value === cadence)!;
  const [annualFeeRate, setAnnualFeeRate] = useState(2.5);
  const [stepDownTrigger, setStepDownTrigger] = useState('Reduce to 1.5% after investment period ends');
  const [includeMgmtFee, setIncludeMgmtFee] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);

  const [recipientMode, setRecipientMode] = useState<'all' | 'manual'>('all');
  const lps = fundLps(state, fundId);
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set(lps.map((l) => l.id)));

  const fund = state.funds[fundId];
  const recipients = recipientMode === 'all' ? lps.map((l) => l.id) : lps.filter((l) => manualSelected.has(l.id)).map((l) => l.id);
  const excluded = lps.filter((l) => !recipients.includes(l.id)).map((l) => l.id);

  const rate = type === 'one-time' ? amount / lps.reduce((s, l) => s + l.commitment, 0) || 0 : (annualFeeRate / 100);

  const notices: NoticeLine[] = useMemo(() => {
    return recipients.map((lpId) => {
      const lp = state.lps[lpId];
      const capitalCall = type === 'one-time' ? round2(lp.commitment * rate) : 0;
      const managementFee = type === 'scheduled' ? round2(lp.commitment * rate) : round2(lp.commitment * lp.feePct);
      const workingCapital = type === 'one-time' ? round2(lp.commitment * WORKING_CAPITAL_RATE) : 0;
      const flagged = lp.kycStatus !== 'clear';
      return {
        lpId,
        commitmentBefore: lp.commitment,
        commitmentAfter: lp.commitment,
        capitalCall,
        managementFee,
        workingCapital,
        amountDue: round2(capitalCall + managementFee + workingCapital),
        status: flagged ? 'held_kyc' : undefined,
        flagged,
        flagReason: flagged ? `KYC ${lp.kycStatus === 'expired' ? 'clearance expired' : 'renewal due soon'} — ${lp.country}, ${lp.jurisdictionAuthority} renewal cycle.` : undefined,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients.join(','), rate, type]);

  const totalCallAmount = notices.reduce((s, n) => s + n.amountDue, 0);
  const flaggedCount = notices.filter((n) => n.flagged).length;

  function toggleLp(id: string) {
    setManualSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildCall(): CapitalCall {
    const id = `call-${Date.now()}`;
    return {
      id,
      fundId,
      type,
      purpose: type === 'one-time' ? purpose : `${cadenceInfo.label} Management Fee`,
      linkedInvestment: type === 'one-time' ? linkedInvestment : undefined,
      amount: round2(notices.reduce((s, n) => s + (type === 'one-time' ? n.capitalCall : n.managementFee), 0)),
      noticeDate: type === 'one-time' ? noticeDate : '2027-01-01',
      dueDate: type === 'one-time' ? dueDate : '2027-01-28',
      recipientMode,
      recipientLpIds: recipients,
      excludedLpIds: excluded,
      excludedReason: excluded.length ? 'Excluded by manual selection at creation' : undefined,
      lineItems: standardLineItems(notices),
      notices,
      status: 'draft',
      peerStatus: 'not_submitted',
      reviewNotes: [],
      bunchChecklist: [
        { id: 'amount', label: 'Total amount matches investment memo', state: 'pending' },
        { id: 'proRata', label: 'Pro-rata allocation applied against current commitments', state: 'pending' },
        { id: 'sideLetters', label: 'Side-letter terms correctly applied', state: 'pending' },
        { id: 'equalisation', label: 'Equalisation calculated across all prior calls', state: 'pending' },
        { id: 'incompleteData', label: 'Incomplete-data flags resolved or escalated', state: flaggedCount ? 'pending' : 'clear' },
        { id: 'jurisdiction', label: 'Jurisdiction-specific overlays applied', state: 'pending' },
        { id: 'kyc', label: 'KYC/AML status current for every LP', state: flaggedCount ? 'pending' : 'clear' },
      ],
      cadence: type === 'scheduled' ? cadence : undefined,
      annualFeeRate: type === 'scheduled' ? annualFeeRate / 100 : undefined,
      stepDownTrigger: type === 'scheduled' ? stepDownTrigger : undefined,
      startDate: type === 'scheduled' ? startDate : undefined,
    };
  }

  function handleSubmit() {
    const call = buildCall();
    dispatch({ type: 'CREATE_CALL', call });
    dispatch({ type: 'SUBMIT_FOR_REVIEW', callId: call.id, reviewer: 'Tom Weber' });
    navigate('/fund-manager/reviews');
  }

  function handleSaveForLater() {
    const call = buildCall();
    dispatch({ type: 'CREATE_CALL', call });
    navigate('/fund-manager/capital-calls');
  }

  const zoomNotice = zoomLpId ? notices.find((n) => n.lpId === zoomLpId) : null;

  return (
    <div>
      <PageHeader
        title="New Capital Call"
        actions={
          step === 4 ? (
            <Button variant="secondary" onClick={() => setChatOpen(true)}>
              💬 Request Bunch Support
            </Button>
          ) : undefined
        }
      />

      {step === 1 && (
        <div>
          <StepEyebrow step={1} total={4} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, margin: '6px 0 4px' }}>Choose how this call runs</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Everything after this adapts to your choice</p>
          <div className={styles.typeGrid}>
            <button className={`${styles.typeCard} ${type === 'one-time' ? styles.typeCardActive : ''}`} onClick={() => setType('one-time')}>
              <h4>One-time</h4>
              <p>Call capital for a specific purpose — an investment, follow-on, or equalisation.</p>
              <div className={styles.example}>
                <b>Example</b>
                Series B follow-on into Portfolio Co. X
              </div>
            </button>
            <button className={`${styles.typeCard} ${type === 'scheduled' ? styles.typeCardActive : ''}`} onClick={() => setType('scheduled')}>
              <h4>Scheduled</h4>
              <p>Configure a recurring call once — it runs itself on a cadence you set.</p>
              <div className={styles.example}>
                <b>Example</b>
                Quarterly management fee, 2.5% of commitment
              </div>
            </button>
          </div>
          <div className={styles.field}>
            <label>Fund</label>
            <select value={fundId} onChange={(e) => setFundId(e.target.value)}>
              {Object.values(state.funds).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={() => setStep(2)}>
            Continue →
          </Button>
        </div>
      )}

      {step === 2 && type === 'one-time' && (
        <div>
          <StepEyebrow step={2} total={4} label="One-time" />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, margin: '6px 0 4px' }}>Call Details</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            The minimum needed to run the calculation. Everything here can be edited before you submit for review.
          </p>
          <div className={styles.field}>
            <label>Purpose</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Linked investment record (optional)</label>
            <input value={linkedInvestment} onChange={(e) => setLinkedInvestment(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Notice date</label>
              <input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <p className={styles.hint}>✓ Meets {fund.name}'s LPA minimum notice period (20 business days)</p>
          <div className={styles.actionRow}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && type === 'scheduled' && (
        <div>
          <StepEyebrow step={2} total={4} label="Scheduled" />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, margin: '6px 0 4px' }}>Schedule Details</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Configure this once — the schedule runs itself afterward, with exception-only alerts.
          </p>
          <div className={styles.field}>
            <label>Start date</label>
            <input value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Repeat cadence</label>
            <select value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)}>
              {CADENCE_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Fee rate applied per {cadenceInfo.adverb} (% of commitment)</label>
            <input type="number" step="0.1" value={annualFeeRate} onChange={(e) => setAnnualFeeRate(Number(e.target.value))} />
          </div>
          <div className={styles.field}>
            <label>Step-down trigger</label>
            <input value={stepDownTrigger} onChange={(e) => setStepDownTrigger(e.target.value)} />
            <p className="faint" style={{ fontSize: 11, marginTop: 4 }}>Applied automatically once the fund enters Portfolio Management stage</p>
          </div>
          <div className={styles.field}>
            <label>Included line items</label>
            <div className={styles.checklistBox}>
              <div className={styles.checkRow}>
                <input type="checkbox" checked={includeMgmtFee} onChange={(e) => setIncludeMgmtFee(e.target.checked)} /> Management fee
              </div>
              <div className={styles.checkRow}>
                <input type="checkbox" checked={includeExpenses} onChange={(e) => setIncludeExpenses(e.target.checked)} /> Recurring fund expenses
              </div>
            </div>
          </div>
          <div className={styles.actionRow}>
            <Button onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Preview schedule →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepEyebrow step={3} total={4} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, margin: '6px 0 4px' }}>Who is this call for?</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Most calls draw pro-rata from every LP in the fund. Some — equalisation, excuse rights, corrections — target only a subset.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Button variant={recipientMode === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setRecipientMode('all')}>
              All investors in the fund
            </Button>
            <Button variant={recipientMode === 'manual' ? 'primary' : 'secondary'} size="sm" onClick={() => setRecipientMode('manual')}>
              Manual Select
            </Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: recipientMode === 'manual' ? 'minmax(0,1fr) 260px' : '1fr', gap: 24 }}>
            <div>
              {recipientMode === 'all' ? (
                <div className={styles.recipientBanner}>
                  <h4>All {lps.length} LPs included</h4>
                  <p>Every LP in {fund.name} will be called pro-rata to their commitment, per the LPA. Switch to Manual Select if this call should only target specific LPs.</p>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  {recipients.length} of {lps.length} LPs selected — total call amount updates as you toggle rows.
                </p>
              )}
              <div className={tableStyles.wrap}>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      {recipientMode === 'manual' && <th></th>}
                      <th>Name</th>
                      <th className={tableStyles.numeric}>Commitment</th>
                      <th className={tableStyles.numeric}>Total amount due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lps.map((lp) => {
                      const included = recipients.includes(lp.id);
                      const due = round2(lp.commitment * rate);
                      return (
                        <tr key={lp.id} style={!included ? { opacity: 0.4 } : undefined}>
                          {recipientMode === 'manual' && (
                            <td>
                              <input type="checkbox" checked={included} onChange={() => toggleLp(lp.id)} />
                            </td>
                          )}
                          <td>{lp.name}</td>
                          <td className={tableStyles.numeric}>{fmt2(lp.commitment, fund.currency)}</td>
                          <td className={tableStyles.numeric}>{fmt2(due, fund.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {recipientMode === 'manual' && (
              <div className={styles.summaryCard}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Selection summary</h4>
                <div className={styles.summaryRow}>
                  <span>LPs selected</span>
                  <span>
                    {recipients.length} of {lps.length}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Total call amount</span>
                  <span>{fmt2(totalCallAmount, fund.currency)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Excluded LPs</span>
                  <span>{excluded.length}</span>
                </div>
                <p className="faint" style={{ fontSize: 11, marginTop: 8 }}>
                  Excluded LPs are logged with a reason and remain visible in the audit trail as "not called this cycle."
                </p>
              </div>
            )}
          </div>

          <div className={styles.actionRow}>
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Continue →
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <StepEyebrow step={4} total={4} label={type === 'one-time' ? 'One-time' : 'Scheduled'} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, margin: '6px 0 4px' }}>Preview</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Calculation results and notices for the {recipients.length} selected LPs — review both before submitting.
          </p>

          <div className={styles.summaryCard} style={{ maxWidth: 640, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Calculation</h4>
            <div className={styles.summaryRow}>
              <span>Total capital call ({recipients.length} LPs selected)</span>
              <span>{fmt2(totalCallAmount, fund.currency)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Working capital (reserve, itemized)</span>
              <span>{fmt2(notices.reduce((s, n) => s + n.workingCapital, 0), fund.currency)}</span>
            </div>
            {flaggedCount > 0 && (
              <div className={styles.flagBanner} style={{ marginTop: 12, marginBottom: 0, maxWidth: 'none' }}>
                🚩 {flaggedCount} of {recipients.length} LPs flagged for KYC — notices held for those LPs only, the other {recipients.length - flaggedCount} are unaffected:
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {notices
                    .filter((n) => n.flagged)
                    .map((n) => (
                      <li key={n.lpId}>
                        {state.lps[n.lpId].name} — {n.flagReason}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notices</h4>
          <div className={styles.noticeGrid}>
            {notices.map((n) => {
              const lp = state.lps[n.lpId];
              return (
                <div key={n.lpId} className={styles.noticeCell}>
                  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomLpId(n.lpId)}>
                    <span className={styles.zoomTag}>Zoom</span>
                    <NoticeDocument
                      call={buildCall()}
                      notice={n}
                      fund={fund}
                      lp={lp}
                      commitmentPct={(lp.commitment / recipients.reduce((s, id) => s + state.lps[id].commitment, 0)) * 100}
                      scale="thumbnail"
                    />
                  </div>
                  <div className={styles.noticeLabel}>{lp.name}</div>
                </div>
              );
            })}
          </div>

          <div className={styles.actionRow}>
            <Button onClick={() => setStep(3)}>Back</Button>
            <Button variant="secondary" onClick={handleSaveForLater}>
              Save for Later
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {type === 'one-time' ? 'Submit for Review' : 'Confirm & Activate'}
            </Button>
          </div>
        </div>
      )}

      <Modal open={!!zoomNotice} onClose={() => setZoomLpId(null)} title="Capital Call Notice">
        {zoomNotice && (
          <NoticeDocument
            call={buildCall()}
            notice={zoomNotice}
            fund={fund}
            lp={state.lps[zoomNotice.lpId]}
            commitmentPct={(state.lps[zoomNotice.lpId].commitment / recipients.reduce((s, id) => s + state.lps[id].commitment, 0)) * 100}
            scale="zoom"
          />
        )}
      </Modal>

      <ChatDrawer callId="wizard-draft" callLabel={purpose} open={chatOpen} onClose={() => setChatOpen(false)} role="fundManager" />
    </div>
  );
}
