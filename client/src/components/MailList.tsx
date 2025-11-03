import { useEffect, useState } from 'react';
import axios from 'axios';

const MailList = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    console.log('[Gmail] Token récupéré du localStorage:', token);

    if (token) {
        axios.get(`http://localhost:3000/gmail/messages?access_token=${token}`)
    .then(res => {
      const messages = res.data; 
      console.log('[Gmail] Nombre de messages:', messages?.length);
      if (messages?.length > 0) {
        console.log('[Gmail] Premier message ID:', messages[0].id);
      } else {
        console.warn('[Gmail] Aucun message reçu');
      }
      setMessages(messages);
    })
    .catch(err => {
      console.error('[Gmail] Erreur lors de la récupération des mails:', err);
    });

    } else {
      console.warn('[Gmail] Aucun token trouvé dans localStorage');
    }
  }, []);


  return (
    <div className="overflow-auto p-3">
      <h5>Inbox</h5>
          <ul>
            {Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg: any) => (
                <li key={msg.id}>{msg.subject || '(Sans sujet)'}</li>
              ))
            ) : (
              <li className="text-muted">Aucun message à afficher</li>
            )}
          </ul>

    </div>
  );
};

export default MailList;
