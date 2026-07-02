import { NavLink } from 'react-router-dom';
import { useAppState } from '../state/store';
import { NavIcon, type NavIconName } from './NavIcon';
import styles from './Sidebar.module.css';

export interface NavSection {
  title?: string;
  items: { label: string; to: string; icon: NavIconName }[];
}

export function Sidebar({
  sections,
  showFundSwitcher,
  footerName,
  footerRole,
}: {
  sections: NavSection[];
  showFundSwitcher?: boolean;
  footerName: string;
  footerRole: string;
}) {
  const { state, dispatch } = useAppState();
  const initials = footerName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <aside className={styles.sidebar}>
      {showFundSwitcher && (
        <div className={styles.fundSwitcher}>
          <select
            value={state.activeFundId}
            onChange={(e) => dispatch({ type: 'SET_ACTIVE_FUND', fundId: e.target.value })}
          >
            {Object.values(state.funds).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <nav className={styles.nav}>
        {sections.map((section, i) => (
          <div key={i}>
            {section.title !== undefined && section.title !== '' && <div className={styles.sectionLabel}>{section.title}</div>}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${styles.item} ${isActive ? styles.itemActive : ''}`}
              >
                <span className={styles.itemIcon}>
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.footerAvatar}>{initials}</div>
        <div>
          <div className={styles.footerName}>{footerName}</div>
          <div className={styles.footerRole}>{footerRole}</div>
        </div>
      </div>
    </aside>
  );
}
