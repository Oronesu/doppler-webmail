import { useEffect, useState } from 'react';
import axios from 'axios';

const SentList = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    axios
      .get(`http://localhost:3000/gmail/messages?access_token=${token}&labelIds=SENT`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => {
        console.error('[Gmail] Erreur récupération mails envoyés:', err);
      });
  }, []);

  const formatDate = (rawDate: string) => {
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return 'Date invalide';

    const now = new Date();
    const isSameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const isSameYear = date.getFullYear() === now.getFullYear();

    if (isSameDay) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    if (isSameYear) {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-3">
      <h5 className="mb-3">📤 Mails envoyés</h5>
      {Array.isArray(messages) && messages.length > 0 ? (
        <div className="list-group">
          {messages.map((msg: any) => (
            <div key={msg.id} className="list-group-item list-group-item-action">
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">{msg.subject || '(Sans sujet)'}</h6>
                <small className="text-muted">{formatDate(msg.date)}</small>
              </div>
              <p className="mb-0 text-secondary">
                <strong>À :</strong> {msg.to || 'Destinataire inconnu'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-secondary">Aucun mail envoyé à afficher</div>
      )}
    </div>
  );
};

export default SentList;
