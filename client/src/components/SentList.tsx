import { useEffect, useState, useCallback } from 'react';
import api from './apiClient';

interface Mail {
  id: string;
  subject: string;
  to: string;
  date: string;
  snippet: string;
}

interface SentListProps {
  setSelectedMail: (mail: any) => void;
  setIsComposing: (value: boolean) => void;
}

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

const SentList = ({ setSelectedMail, setIsComposing }: SentListProps) => {
  const [messages, setMessages]           = useState<Mail[]>([]);
  const [loading, setLoading]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchMessages = useCallback(async (opts: { pageToken?: string; append?: boolean } = {}) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const { pageToken, append = false } = opts;

    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await api.get('/gmail/messages', {
        params: {
          labelIds: 'SENT',
          ...(pageToken ? { pageToken } : {}),
        }
      });
      // La route retourne { messages, nextPageToken }
      const msgs: Mail[] = res.data.messages ?? [];
      const npt: string | null = res.data.nextPageToken ?? null;

      setMessages((prev) => append ? [...prev, ...msgs] : msgs);
      setNextPageToken(npt);
    } catch (err) {
      console.error('[Gmail] Erreur récupération mails envoyés:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleClick = async (id: string) => {
    setIsComposing(false);
    const res = await api.get('/gmail/message', { params: { id } });
    setSelectedMail({
      id: res.data.id,
      subject: res.data.subject,
      from: res.data.from,
      to: res.data.to,
      body: res.data.body,
      attachments: res.data.attachments || [],
    });
  };

  return (
    <div className="maillist-container">
      <div className="maillist-title">
        <span>Envoyés</span>
        <div className="maillist-title-right">
          <button
            className="refresh-btn"
            onClick={() => fetchMessages()}
            disabled={loading}
            title="Rafraîchir"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={loading ? 'spin' : ''}>
              <path d="M13 2v4H9M1 12V8h4M1.5 8A5.5 5.5 0 0 1 12 5.5M12.5 8A5.5 5.5 0 0 1 2 10.5"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="maillist-scroll">
        {loading ? (
          <div className="maillist-empty">Chargement…</div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="mail-item" onClick={() => handleClick(msg.id)}>
                <div className="mail-item-header">
                  <span className="mail-item-subject">{msg.subject || '(Sans sujet)'}</span>
                  <span className="mail-item-date">{formatDate(msg.date)}</span>
                </div>
                <div className="mail-item-from">
                  <strong>À :</strong> {msg.to || 'Destinataire inconnu'}
                </div>
                {msg.snippet && (
                  <div className="mail-item-snippet">{msg.snippet}</div>
                )}
              </div>
            ))}

            <div className="scroll-sentinel">
              {nextPageToken && (
                <button
                  className="load-more-btn"
                  onClick={() => fetchMessages({ pageToken: nextPageToken, append: true })}
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
              {!nextPageToken && (
                <div style={{ padding: '14px', textAlign: 'center' }}>
                  <span className="maillist-end">— Fin des messages —</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="maillist-empty">Aucun mail envoyé à afficher</div>
        )}
      </div>
    </div>
  );
};

export default SentList;