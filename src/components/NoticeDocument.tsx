import { LogoMark } from './Logo';
import { fmt2, fmtDate } from '../state/selectors';
import type { CapitalCall, Fund, LP, NoticeLine } from '../data/types';
import styles from './NoticeDocument.module.css';

const WIRE_BANK = 'Deutsche Bank AG, Berlin';
const WIRE_IBAN = 'DE89 3704 0044 0532 0130 00';

export function NoticeDocument({
  call,
  notice,
  fund,
  lp,
  commitmentPct,
  scale = 'full',
}: {
  call: CapitalCall;
  notice: NoticeLine;
  fund: Fund;
  lp: LP;
  commitmentPct: number;
  scale?: 'thumbnail' | 'zoom' | 'full';
}) {
  const ref = `${fund.name.split(' ').map((w) => w[0]).join('').toUpperCase()}-${call.id.slice(-4).toUpperCase()}`;

  return (
    <div className={`${styles.doc} ${styles[scale]}`}>
      <div className={styles.brandRow}>
        <LogoMark size={scale === 'thumbnail' ? 12 : 20} />
        {scale !== 'thumbnail' && fund.name.toUpperCase()}
      </div>
      <div className={styles.eyebrowRow}>
        <span>Capital Call Notice</span>
        <span>Ref: {ref}</span>
      </div>
      <div className={styles.to}>To: {lp.name}</div>
      {scale !== 'thumbnail' && (
        <p className={styles.para}>
          On behalf of {fund.name}, we are issuing this capital call notice in accordance with the terms of the
          Limited Partnership Agreement. Please find your required contribution and payment instructions detailed
          below.
        </p>
      )}
      <div className={styles.amountBox}>
        <div className={styles.amountLabel}>Amount due — auto-calculated</div>
        <div className={styles.amountValue}>{fmt2(notice.amountDue, fund.currency)}</div>
      </div>
      {scale !== 'thumbnail' && (
        <>
          <div className={styles.detailRow}>
            <span>Commitment %</span>
            <span>{commitmentPct.toFixed(2)}%</span>
          </div>
          <div className={styles.detailRow}>
            <span>Working capital</span>
            <span>{fmt2(notice.workingCapital, fund.currency)}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Notice date</span>
            <span>{fmtDate(call.noticeDate)}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Payment deadline</span>
            <span>{fmtDate(call.dueDate)}</span>
          </div>
          <div className={styles.wireHeading}>Wire instructions</div>
          <div className={styles.detailRow}>
            <span>Bank</span>
            <span>{WIRE_BANK}</span>
          </div>
          <div className={styles.detailRow}>
            <span>IBAN</span>
            <span>{WIRE_IBAN}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Reference</span>
            <span>{ref}</span>
          </div>
          <div className={styles.footer}>
            <span>Always rendered in-platform — never an email attachment.</span>
            <span>Powered by bunch</span>
          </div>
        </>
      )}
    </div>
  );
}
