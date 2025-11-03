import { useEffect, useState } from 'react';
import axios from 'axios';

const MailList = ({ setSelectedMailBody }: { setSelectedMailBody: (body: string) => void }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('[Gmail] Token récupéré du localStorage:', token);

    if (token) {
      axios
        .get(`http://localhost:3000/gmail/messages?access_token=${token}`)
        .then((res) => {
          const messages = res.data;
          console.log('[Gmail] Nombre de messages:', messages?.length);
          setMessages(messages);
        })
        .catch((err) => {
          console.error('[Gmail] Erreur lors de la récupération des mails:', err);
        });
    } else {
      console.warn('[Gmail] Aucun token trouvé dans localStorage');
    }
  }, []);

  const handleClick = async (id: string) => {
  const token = localStorage.getItem('access_token');
  const res = await axios.get(`http://localhost:3000/gmail/messages/${id}?access_token=${token}`);
  setSelectedMailBody(res.data.body);
  };



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
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (isSameYear) {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    }

    return date.toLocaleDateString('fr-FR'); // JJ/MM/AAAA
  };




  
  return (
    <div className="container mt-4">
      <h5 className="mb-3">📥 Inbox</h5>
      {Array.isArray(messages) && messages.length > 0 ? (
        <div className="list-group">
          {messages.map((msg: any) => (
            <div key={msg.id} className="list-group-item list-group-item-action" onClick={() => handleClick(msg.id)}>
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">{msg.subject || '(Sans sujet)'}</h6>
                <small className="text-muted">{formatDate(msg.date)}</small>
              </div>
              <p className="mb-0 text-secondary">
                <strong>De :</strong> {msg.from}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-secondary">Aucun message à afficher</div>
      )}
    </div>
  );
};



export default MailList;
