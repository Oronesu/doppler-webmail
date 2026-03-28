import { useEffect, useState, useCallback } from 'react';
import api from './apiClient';

interface Mail {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labelIds: string[];
}

interface FullMail {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  isUnread: boolean;
  attachments: { filename: string; url: string }[];
}

interface MailListProps {
  setSelectedMail: (mail: FullMail) => void;
  setIsComposing: (value: boolean) => void;
  label?: string;
  onUnreadCount?: (count: number) => void;
}

const LABEL_TITLES: Record<string, string> = {
  SPAM: 'Spam',
  TRASH: 'Corbeille',
};

const formatDate = (rawDate: string) => {
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameDay) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isSameYear) return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return date.toLocaleDateString('fr-FR');
};

const MailList = ({ setSelectedMail, setIsComposing, label, onUnreadCount }: MailListProps) => {
  const [messages, setMessages]           = useState<Mail[]>([]);
  const [loading, setLoading]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeQuery, setActiveQuery]     = useState(''); // query confirmée (Enter / bouton)

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (opts: {
    pageToken?: string;
    query?: string;
    append?: boolean;   // true = infinite scroll, false = rechargement complet
    silent?: boolean;   // true = pas de setLoading (refresh en fond)
  } = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const { pageToken, query = '', append = false, silent = false } = opts;

    if (!silent) append ? setLoadingMore(true) : setLoading(true);

    try {
      // access_token injecté automatiquement par l'intercepteur apiClient
      const res = await api.get('/gmail/messages', {
        params: {
          ...(label     ? { labelIds: label } : {}),
          ...(pageToken ? { pageToken }       : {}),
          ...(query     ? { q: query }        : {}),
        }
      });
      let msgs: Mail[]  = res.data.messages;
      const npt: string | null = res.data.nextPageToken ?? null;

      // Inbox : filtrer côté client pour ne garder que les mails INBOX
      if (!label && !query) {
        msgs = msgs.filter((m) => m.labelIds?.includes('INBOX'));
      }

      setMessages((prev) => append ? [...prev, ...msgs] : msgs);
      setNextPageToken(npt);

      // Badge non lus uniquement pour l'inbox
      if (!label) {
        const allMsgs = append
          ? [...(messages), ...msgs]
          : msgs;
        const unread = allMsgs.filter((m) => m.labelIds?.includes('UNREAD')).length;
        onUnreadCount?.(unread);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label, onUnreadCount]);

  // Chargement initial et quand label change
  useEffect(() => {
    setMessages([]);
    setNextPageToken(null);
    setSearchQuery('');
    setActiveQuery('');
    fetchMessages();
  }, [label]); // eslint-disable-line

  // Quand la recherche change (activeQuery)
  useEffect(() => {
    if (activeQuery === '' && messages.length > 0) return; // évite double fetch au montage
    setMessages([]);
    setNextPageToken(null);
    fetchMessages({ query: activeQuery });
  }, [activeQuery]); // eslint-disable-line


  // ── Recherche ──────────────────────────────────────────────────────────
  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q === activeQuery) return;
    setActiveQuery(q);
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') {
      setSearchQuery('');
      setActiveQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
  };

  // ── Clic sur un mail ───────────────────────────────────────────────────
  const handleClick = async (msg: Mail) => {
    setIsComposing(false);
    if (msg.labelIds?.includes('UNREAD')) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, labelIds: m.labelIds.filter((l) => l !== 'UNREAD') } : m
        )
      );
      if (!label) {
        onUnreadCount?.(
          messages.filter((m) => m.id !== msg.id && m.labelIds?.includes('UNREAD')).length
        );
      }
      api.post('/gmail/markAsRead', null, { params: { id: msg.id } })
        .catch((e) => console.error('markAsRead error:', e));
    }

    const res = await api.get('/gmail/message', { params: { id: msg.id } });
    setSelectedMail({
      id: res.data.id,
      subject: res.data.subject,
      from: res.data.from,
      to: res.data.to,
      body: res.data.body,
      isUnread: false, // déjà marqué lu juste avant
      attachments: res.data.attachments || [],
    });
  };

  const title = label ? LABEL_TITLES[label] ?? label : 'Inbox';
  const unreadCount = messages.filter((m) => m.labelIds?.includes('UNREAD')).length;

  return (
    <div className="maillist-container">

      {/* ── TOPBAR ── */}
      <div className="maillist-title">
        <span>{title}</span>
        <div className="maillist-title-right">
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          <button
            className="refresh-btn"
            onClick={() => fetchMessages({ query: activeQuery, silent: true })}
            disabled={loading}
            title="Rafraîchir"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              className={loading ? 'spin' : ''}>
              <path d="M13 2v4H9M1 12V8h4M1.5 8A5.5 5.5 0 0 1 12 5.5M12.5 8A5.5 5.5 0 0 1 2 10.5"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── BARRE DE RECHERCHE ── */}
      <div className="search-bar">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="search-icon">
          <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className="search-input"
          placeholder="Rechercher…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKey}
        />
        {searchQuery && (
          <button className="search-clear" onClick={clearSearch} title="Effacer">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <button className="search-submit" onClick={handleSearch}>
          Chercher
        </button>
      </div>

      {/* Badge recherche active */}
      {activeQuery && (
        <div className="search-active-bar">
          <span>Résultats pour <strong>"{activeQuery}"</strong></span>
          <button onClick={clearSearch}>× Effacer</button>
        </div>
      )}

      {/* ── LISTE ── */}
      <div className="maillist-scroll">
        {loading ? (
          <div className="maillist-empty">Chargement…</div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg) => {
              const isUnread = msg.labelIds?.includes('UNREAD');
              return (
                <div
                  key={msg.id}
                  className={`mail-item${isUnread ? ' mail-item--unread' : ''}`}
                  onClick={() => handleClick(msg)}
                >
                  <div className="mail-item-header">
                    <span className="mail-item-subject">{msg.subject || '(Sans sujet)'}</span>
                    <span className="mail-item-date">{formatDate(msg.date)}</span>
                  </div>
                  <div className="mail-item-from">
                    <strong>De :</strong> {msg.from}
                  </div>
                  {msg.snippet && (
                    <div className="mail-item-snippet">{msg.snippet}</div>
                  )}
                </div>
              );
            })}

            {/* Bouton charger plus */}
            <div className="scroll-sentinel">
              {nextPageToken && (
                <button
                  className="load-more-btn"
                  onClick={() => fetchMessages({ pageToken: nextPageToken, query: activeQuery, append: true })}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="spin">
                        <path d="M12 6.5A5.5 5.5 0 1 1 6.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Chargement…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M6.5 10V3M3 6.5l3.5-3.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Charger plus
                    </>
                  )}
                </button>
              )}
              {!nextPageToken && messages.length > 0 && (
                <div style={{ padding: '14px', textAlign: 'center' }}>
                  <span className="maillist-end">— Fin des messages —</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="maillist-empty">Aucun message à afficher</div>
        )}
      </div>

    </div>
  );
};

export default MailList;