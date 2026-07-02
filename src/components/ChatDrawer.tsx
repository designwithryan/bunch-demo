import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../state/store';
import { Button } from './ui';
import styles from './ChatDrawer.module.css';

export function ChatDrawer({
  callId,
  callLabel,
  open,
  onClose,
  role,
}: {
  callId: string;
  callLabel: string;
  open: boolean;
  onClose: () => void;
  role: 'fundManager' | 'bunch';
}) {
  const { state, dispatch } = useAppState();
  const [draft, setDraft] = useState('');
  const thread = state.chats[callId];

  function send(park: boolean) {
    if (!draft.trim() && !park) return;
    const authorName = role === 'fundManager' ? state.currentUser.fundManagerName : 'Bunch Support';
    if (draft.trim()) {
      const message = {
        id: `m-${Date.now()}`,
        author: authorName,
        authorRole: role,
        body: draft.trim(),
        ts: new Date().toISOString(),
      };
      if (role === 'bunch') {
        dispatch({ type: 'BUNCH_REPLY_CHAT', callId, message });
      } else {
        dispatch({ type: 'SEND_CHAT_MESSAGE', callId, message, park });
      }
      setDraft('');
    } else if (park) {
      dispatch({ type: 'SEND_CHAT_MESSAGE', callId, message: { id: `m-${Date.now()}`, author: authorName, authorRole: role, body: '(call parked awaiting reply)', ts: new Date().toISOString() }, park: true });
    }
    if (park) onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={styles.drawer}
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
          >
            <div className={styles.header}>
              <div>
                <div className={styles.headerTitle}>{role === 'fundManager' ? 'Request Bunch Support' : `Support request — ${state.currentUser.fundManagerName}`}</div>
                <div className={styles.headerSub}>{callLabel}</div>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ color: 'var(--color-ink-muted)', fontSize: 16 }}>
                ✕
              </button>
            </div>
            {thread?.parked && (
              <div className={styles.parkedBanner}>● Call is parked until {role === 'fundManager' ? 'Bunch replies' : 'you reply'}</div>
            )}
            <div className={styles.messages}>
              {(thread?.messages ?? []).map((m) => (
                <div key={m.id} className={`${styles.msg} ${m.authorRole === 'bunch' ? styles.msgBunch : styles.msgFm}`}>
                  {m.body}
                  <div className={styles.msgMeta}>
                    {m.author} · {new Date(m.ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {!thread?.messages?.length && (
                <p className="muted" style={{ fontSize: 12 }}>
                  No messages yet — ask Bunch anything about this call.
                </p>
              )}
            </div>
            <div className={styles.footer}>
              <input
                placeholder={role === 'fundManager' ? 'Ask Bunch Support…' : `Reply to ${state.currentUser.fundManagerName}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(false)}
              />
              {role === 'fundManager' ? (
                <Button size="sm" variant="secondary" onClick={() => send(true)}>
                  Save &amp; Close
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => send(false)}>
                  Reply
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
