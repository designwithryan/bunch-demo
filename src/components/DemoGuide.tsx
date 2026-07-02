import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../state/store';
import styles from './DemoGuide.module.css';

const SCRIPT: { label: string; to: string; persona: 'fundManager' | 'bunchAdmin' | 'investor' }[] = [
  { label: 'Approve Priya’s Series B call as her CFO', to: '/fund-manager/reviews', persona: 'fundManager' },
  { label: 'Work the checklist in Bunch’s Review Queue', to: '/bunch-admin/review-queue', persona: 'bunchAdmin' },
  { label: 'See the notice arrive as the LP investor', to: '/investor/capital-calls', persona: 'investor' },
  { label: 'Or start from scratch: create a new call', to: '/fund-manager/capital-calls/new', persona: 'fundManager' },
];

export function DemoGuide() {
  const [open, setOpen] = useState(false);
  const { dispatch } = useAppState();
  const navigate = useNavigate();

  function go(step: (typeof SCRIPT)[number]) {
    dispatch({ type: 'SET_PERSONA', persona: step.persona });
    navigate(step.to);
    setOpen(false);
  }

  function reset() {
    if (confirm('Reset all demo data back to the starting scenario?')) {
      dispatch({ type: 'RESET_DEMO' });
      navigate('/');
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <div className={styles.title}>Try this prototype</div>
            <p className={styles.body}>
              This is a live, interactive prototype — actions in one persona show up in the others. A good place to
              start:
            </p>
            <div className={styles.steps}>
              {SCRIPT.map((step, i) => (
                <button key={step.to + i} className={styles.step} onClick={() => go(step)}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepLink}>{step.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.footerRow}>
              <span className="faint" style={{ fontSize: 11 }}>
                State is saved in this browser.
              </span>
              <button className={styles.resetBtn} onClick={reset}>
                Reset demo data
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button className={styles.fab} onClick={() => setOpen((v) => !v)} aria-label="Prototype guide">
        {open ? '✕' : '?'}
      </button>
    </>
  );
}
