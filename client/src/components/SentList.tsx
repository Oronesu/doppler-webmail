import { useEffect, useState } from 'react';
import axios from 'axios';

interface SentListProps {
  setSelectedMail: (mail: any) => void;
  setIsComposing: (value: boolean) => void;
}

const SentList = ({ setSelectedMail, setIsComposing }: SentListProps) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    axios
      .get(`http://localhost:3000/gmail/messages?access_token=${token}&labelIds=SENT`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error('[Gmail] Erreur récupération mails envoyés:', err));
  }, []);

  const handleClick = async (id: string) => {
    setIsComposing(false);
    const token = localStorage.getItem('access_token');
    const res = await axios.get(`http://localhost:3000/gmail/message?access_token=${token}&id=${id}`);
    setSelectedMail({
      id: res.data.id,
      subject: res.data.subject,
      from: res.data.from,
      to: res.data.to,
      body: res.data.body,
      attachments: res.data.attachments || [],
    });
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

  return (
    <div className="maillist-container">
      <div className="maillist-title">Envoyés</div>
      <div className="maillist-scroll">
        {messages.length > 0 ? (
          messages.map((msg: any) => (
            <div key={msg.id} className="mail-item" onClick={() => handleClick(msg.id)}>
              <div className="mail-item-header">
                <span className="mail-item-subject">{msg.subject || '(Sans sujet)'}</span>
                <span className="mail-item-date">{formatDate(msg.date)}</span>
              </div>
              <div className="mail-item-from">
                <strong>À :</strong> {msg.to || 'Destinataire inconnu'}
              </div>
            </div>
          ))
        ) : (
          <div className="maillist-empty">Aucun mail envoyé à afficher</div>
        )}
      </div>
    </div>
  );
};

export default SentList;