import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { Segmented } from './ui';
import { useAppState } from '../state/store';
import type { Persona } from '../data/types';
import styles from './TopNav.module.css';

const PERSONA_HOME: Record<Persona, string> = {
  fundManager: '/fund-manager/dashboard',
  bunchAdmin: '/bunch-admin/dashboard',
  investor: '/investor/dashboard',
};

export function TopNav() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const name =
    state.activePersona === 'fundManager'
      ? state.currentUser.fundManagerName
      : state.activePersona === 'bunchAdmin'
      ? state.currentUser.bunchAdminName
      : state.currentUser.investorName;
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  function switchPersona(key: string) {
    const persona = key as Persona;
    dispatch({ type: 'SET_PERSONA', persona });
    navigate(PERSONA_HOME[persona]);
  }

  return (
    <div className={styles.bar}>
      <div className={styles.brand}>
        <Logo height={18} color="var(--color-ink)" />
      </div>
      <Segmented
        value={state.activePersona}
        onChange={switchPersona}
        options={[
          { key: 'fundManager', label: 'Fund Manager' },
          { key: 'bunchAdmin', label: 'Bunch Admin' },
          { key: 'investor', label: 'Investor' },
        ]}
      />
      <div className={styles.spacer} />
      <input className={styles.search} placeholder="Search funds, LPs, calls…" />
      <button className={styles.iconBtn} title="Notifications" aria-label="Notifications">
        🔔<span className={styles.dot} />
      </button>
      <div className={styles.avatar} title={name}>
        {initials || '?'}
      </div>
    </div>
  );
}
